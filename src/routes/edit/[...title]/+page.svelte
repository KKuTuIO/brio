<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
		import { api, session, ui } from '$lib/session.svelte';
	import { articlePath, rewriteLinks } from '$lib/wikitext';
	import { editDeniedOf } from '$lib/editDenied';
	import NsTitle from '$lib/NsTitle.svelte';
	import { relativeTime } from '$lib/time';
	const slug = (t: string) => t.replace(/ /g, '_');
	import '$lib/wiki.css';

	const title = $derived(page.params.title!.replace(/_/g, ' '));
	const section = $derived(page.url.searchParams.get('section'));

	let host: HTMLDivElement | undefined = $state();
	let editor: any = $state.raw();
	let monaco: any = $state.raw();
	let loading = $state(true);
	let loadError = $state('');
	let exists = $state(true);
	let baseRev = $state(0);
	let baseTs = $state('');
	let original = '';
	let dirty = $state(false);
	let summary = $state('');
	let saving = $state(false);
	let agreed = $state(false);
	onMount(() => {
		try {
			agreed = localStorage.getItem('brio.agree') === '1';
		} catch {}
	});
	$effect(() => {
		try {
			localStorage.setItem('brio.agree', agreed ? '1' : '0');
		} catch {}
	});
	let saveError = $state('');
	let conflict = $state(false);
	let denied = $state<string | null>(null);
	let previewHtml = $state('');
	let previewBusy = $state(false);
	let previewAt = $state(0);
	function togglePreview() {
		if (tab === 'preview') tab = 'edit';
		else {
			tab = 'preview';
			refreshPreview();
		}
	}
	let tab = $state<'edit' | 'preview'>('edit');
	let full = $state(false);
	let words = $state(0);
	let pos = $state({ line: 1, col: 1 });
	$effect(() => {
		if (!session.anon) saveError = '';
	});
	let previewTimer: ReturnType<typeof setTimeout> | undefined;
	let previewSeq = 0;

	async function checkDenied() {
		try {
			const j = await api({ action: 'query', prop: 'info', titles: title, intestactions: 'edit', intestactionsdetail: 'full', errorformat: 'plaintext', errorlang: 'ko' });
			denied = editDeniedOf(j.query.pages[0]?.actions?.edit);
		} catch {
			denied = null;
		}
		editor?.updateOptions({ readOnly: !!denied });
	}
	let lastWho = '';
	$effect(() => {
		const who = session.name;
		if (session.loaded && who !== lastWho) {
			if (lastWho) checkDenied();
			lastWho = who;
		}
	});

	async function load() {
		loading = true;
		loadError = '';
		try {
			const j = await api({ action: 'query', prop: 'revisions', titles: title, rvprop: 'content|ids|timestamp', rvslots: 'main', ...(section ? { rvsection: section } : {}) });
			const p = j.query.pages[0];
			exists = !p.missing;
			const rev = p.revisions?.[0];
			baseRev = rev?.revid ?? 0;
			baseTs = rev?.timestamp ?? '';
			original = rev?.slots?.main?.content ?? '';
			await checkDenied();
		} catch (e) {
			loadError = (e as Error).message;
		} finally {
			loading = false;
		}
	}

	async function refreshPreview() {
		if (!editor) return;
		const seq = ++previewSeq;
		previewBusy = true;
		try {
			const j = await api({ action: 'parse', title, text: editor.getValue(), contentmodel: 'wikitext', prop: 'text', pst: '1', preview: '1', disablelimitreport: '1', disabletoc: '1', disableeditsection: '1' }, true);
			if (seq === previewSeq) {
				previewHtml = j.parse.text;
				previewAt = Date.now();
			}
		} catch {
		} finally {
			if (seq === previewSeq) previewBusy = false;
		}
	}

	function onChange() {
		const v = editor.getValue();
		dirty = v !== original;
		words = (v.match(/\S+/g) ?? []).length;
		clearTimeout(previewTimer);
		previewTimer = setTimeout(refreshPreview, 600);
	}

	function wrap(before: string, after: string, placeholder = '') {
		const sel = editor.getSelection();
		const text = editor.getModel().getValueInRange(sel) || placeholder;
		editor.executeEdits('toolbar', [{ range: sel, text: before + text + after, forceMoveMarkers: true }]);
		const start = sel.getStartPosition();
		editor.setSelection(new monaco.Selection(start.lineNumber, start.column + before.length, start.lineNumber, start.column + before.length + text.length));
		editor.focus();
	}
	function linePrefix(prefix: string) {
		const sel = editor.getSelection();
		const edits = [];
		for (let l = sel.startLineNumber; l <= sel.endLineNumber; l++) edits.push({ range: new monaco.Range(l, 1, l, 1), text: prefix });
		editor.executeEdits('toolbar', edits);
		editor.focus();
	}
	const tools = [
		{ icon: 'format_bold', label: '굵게', run: () => wrap("'''", "'''", '굵은 글씨') },
		{ icon: 'format_italic', label: '기울임', run: () => wrap("''", "''", '기울인 글씨') },
		{ icon: 'title', label: '제목', run: () => wrap('== ', ' ==', '제목') },
		{ icon: 'link', label: '내부 링크', run: () => wrap('[[', ']]', '문서 이름') },
		{ icon: 'open_in_new', label: '외부 링크', run: () => wrap('[https://', ' 이름]', 'example.com') },
		{ icon: 'format_list_bulleted', label: '목록', run: () => linePrefix('* ') },
		{ icon: 'format_list_numbered', label: '번호 목록', run: () => linePrefix('# ') },
		{ icon: 'data_object', label: '틀', run: () => wrap('{{', '}}', '틀 이름') },
		{ icon: 'table', label: '표', run: () => wrap('{| class="wikitable"\n! 제목1 !! 제목2\n|-\n| ', ' || \n|}', '칸') },
		{ icon: 'format_quote', label: '인용', run: () => wrap('<blockquote>', '</blockquote>', '인용문') }
	];

	function errorText(e: any): string {
		switch (e.code) {
			case 'editconflict':
				conflict = true;
				return '그 사이 다른 사람이 문서를 고쳤어요. 내용을 복사해 두고 새로 불러오세요.';
			case 'permissiondenied':
			case 'protectedpage':
			case 'readonly':
				return '이 문서를 편집할 권한이 없어요.';
			case 'abusefilter-disallowed':
			case 'abusefilter-warning':
				return '편집 필터에 걸렸어요: ' + e.message;
			case 'blocked':
			case 'autoblocked':
				return '차단된 계정이라 편집할 수 없어요.';
			default:
				return e.message || '저장하지 못했어요.';
		}
	}

	async function save() {
		if (saving || !editor) return;
		saving = true;
		saveError = '';
		try {
			const t = await api({ action: 'query', meta: 'tokens', type: 'csrf' });
			const token = t.query.tokens.csrftoken;
			if (token === '+\\') {
				ui.loginOpen = true;
				saveError = '편집하려면 먼저 로그인해 주세요.';
				return;
			}
			const r = await api(
				{
					action: 'edit',
					title,
					text: editor.getValue(),
					summary,
					token,
					...(section ? { section } : {}),
					...(baseRev ? { baserevid: String(baseRev), basetimestamp: baseTs } : { createonly: '1' })
				},
				true
			);
			if (r.edit?.result !== 'Success') throw Object.assign(new Error('저장하지 못했어요. (' + (r.edit?.result ?? '?') + ')'), { code: r.edit?.code });
			dirty = false;
			await fetch('/_/purge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title }) });
			await goto(articlePath(r.edit.title ?? title), { invalidateAll: true });
		} catch (e) {
			saveError = errorText(e);
		} finally {
			saving = false;
		}
	}

	onMount(() => {
		let disposed = false;
		const beforeUnload = (e: BeforeUnloadEvent) => {
			if (dirty) e.preventDefault();
		};
		window.addEventListener('beforeunload', beforeUnload);
		const mq = matchMedia('(prefers-color-scheme: dark)');
		const themeName = () => {
			const t = document.documentElement.dataset.theme;
			return (t ? t === 'dark' : mq.matches) ? 'brio-dark' : 'brio-light';
		};
		const mo = new MutationObserver(() => monaco?.editor.setTheme(themeName()));
		mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		(async () => {
			const [m] = await Promise.all([import('$lib/monaco'), load()]);
			if (disposed || !host) return;
			monaco = m.setup();
			editor = monaco.editor.create(host, {
				value: original,
				language: m.LANG,
				theme: themeName(),
				automaticLayout: true,
				wordWrap: 'on',
				wrappingIndent: 'same',
				minimap: { enabled: false },
				lineNumbers: 'on',
				fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, 'D2Coding', monospace",
				fontSize: 14,
				lineHeight: 24,
				padding: { top: 12, bottom: 12 },
				scrollBeyondLastLine: false,
				renderLineHighlight: 'line',
				smoothScrolling: true,
				tabSize: 2,
				readOnly: !!denied,
				accessibilitySupport: 'auto'
			});
			editor.onDidChangeModelContent(onChange);
			editor.onDidChangeCursorPosition((e: any) => (pos = { line: e.position.lineNumber, col: e.position.column }));
			editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, save);
			words = (original.match(/\S+/g) ?? []).length;
			refreshPreview();
		})();

		return () => {
			disposed = true;
			clearTimeout(previewTimer);
			window.removeEventListener('beforeunload', beforeUnload);
			mo.disconnect();
			editor?.dispose();
		};
	});
</script>

<svelte:head><title>{title} 편집 - {page.data.site.sitename}</title></svelte:head>
<svelte:window onkeydown={(e) => e.key === 'Escape' && full && (full = false)} />

<article class="kk-card min-w-0 p-4 sm:p-7 {full ? 'fixed inset-0 z-50 flex flex-col overflow-auto !rounded-none' : ''}">
	{#if !full}
		<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
			<h1 class="text-[2rem] leading-tight font-extrabold"><NsTitle {title} ns={page.data.site.ns} />{section ? ` (문단 ${section})` : ''} <span class="text-xl">({baseRev ? `r${baseRev} 편집` : exists ? '편집' : '새 문서'})</span></h1>
			<div class="seg ml-auto" role="group" aria-label="문서 도구">
				<a href="/w/Special:WhatLinksHere/{slug(title)}" data-sveltekit-reload><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">anchor</span>역링크</a>
				<a href="/w/Special:MovePage/{slug(title)}" data-sveltekit-reload><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">arrow_circle_right</span>이동</a>
				<a href={articlePath(title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">article</span>문서</a>
			</div>
		</div>

		{#if session.loaded && session.anon}
			<div class="alert mt-4 font-bold" style="background: var(--kk-warn-soft); color: var(--kk-warn)">
				로그인하지 않았어요. 저장하면 IP 주소가 편집 기록에 남아요. <button class="underline" onclick={() => (ui.loginOpen = true)}>로그인</button>
			</div>
		{/if}
		{#if denied}
			<div role="alert" class="alert mt-4 flex flex-wrap items-center gap-x-2 font-bold" style="background: var(--kk-warn-soft); color: var(--kk-warn)">
				<span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">lock</span>{denied}
				<span class="font-normal">원문은 볼 수 있어요.</span> <a class="underline" href="/mw?src={encodeURIComponent(`/index.php?title=${title}&action=protect`)}">ACL</a>
			</div>
		{/if}
		{#if conflict}
			<div role="alert" class="alert mt-4 font-bold" style="background: var(--kk-danger-soft); color: var(--kk-danger)">편집 충돌: 내용을 복사해 둔 뒤 <button class="underline" onclick={() => location.reload()}>새로 불러오세요</button>.</div>
		{/if}
		{#if loadError}<div role="alert" class="alert mt-4 font-bold" style="background: var(--kk-danger-soft); color: var(--kk-danger)">{loadError}</div>{/if}
	{/if}

	<div class="mt-4 flex min-h-0 flex-col overflow-hidden rounded border {full ? 'flex-1' : ''}" style="border-color: var(--kk-line-strong)">
		<div class="flex items-center gap-1 border-b px-1.5 py-1" style="border-color: var(--kk-line); background: var(--kk-surface-2)" role="group" aria-label="편집 방식">
			<button type="button" aria-pressed={tab === 'edit'} class="inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-sm font-bold hover:bg-(--kk-accent-soft) {tab === 'edit' ? 'bg-(--kk-accent-soft)' : ''}" onclick={() => (tab = 'edit')}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">edit_note</span>편집기</button>
			<span class="h-5 w-px" style="background: var(--kk-line-strong)"></span>
			<button type="button" aria-pressed={tab === 'preview'} class="inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-sm font-bold hover:bg-(--kk-accent-soft) {tab === 'preview' ? 'bg-(--kk-accent-soft)' : ''}" onclick={togglePreview}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">visibility</span>미리보기</button>
			<button type="button" class="ml-auto grid h-8 w-8 place-items-center rounded hover:bg-(--kk-accent-soft)" onclick={() => (full = !full)} aria-label={full ? '전체 화면 닫기' : '전체 화면'} aria-pressed={full}>
				<span class="material-symbols-outlined" style="font-size: 19px" aria-hidden="true">{full ? 'close_fullscreen' : 'fullscreen'}</span>
			</button>
		</div>
		{#if tab === 'edit'}
			<div class="flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1" style="border-color: var(--kk-line)" role="toolbar" aria-label="서식">
				{#each tools as t}
					<button type="button" title={t.label} aria-label={t.label} class="grid h-8 w-8 place-items-center rounded hover:bg-(--kk-accent-soft) disabled:opacity-40" disabled={loading || !editor || !!denied} onclick={t.run}>
						<span class="material-symbols-outlined" style="font-size: 19px" aria-hidden="true">{t.icon}</span>
					</button>
				{/each}
			</div>
		{:else}
			<div class="flex items-center justify-end border-b px-1.5 py-1" style="border-color: var(--kk-line)">
				<button type="button" class="inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-sm font-bold hover:bg-(--kk-accent-soft)" onclick={refreshPreview}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">refresh</span>새로고침</button>
			</div>
		{/if}

		<div class="relative min-h-0 {full ? 'flex-1' : 'h-[min(62dvh,40rem)] min-h-[20rem]'}">
			<div class="absolute inset-0 {tab === 'preview' ? 'invisible' : ''}">
				{#if loading || !editor}
					<div class="absolute inset-0 z-10 flex flex-col gap-3 p-4" style="background: var(--kk-surface)" role="status" aria-label="편집기를 불러오는 중">
						{#each [40, 90, 75, 85, 30, 95, 60] as w}<div class="kk-skeleton h-4" style="width: {w}%"></div>{/each}
					</div>
				{/if}
				<div bind:this={host} class="h-full w-full"></div>
			</div>
			{#if tab === 'preview'}
				<div class="absolute inset-0 overflow-auto p-5" style="background: var(--kk-surface)" aria-label="미리보기">
					{#if previewHtml}<div class="wiki">{@html rewriteLinks(previewHtml)}</div>
					{:else}<div class="flex flex-col gap-3">{#each [90, 70, 95] as w}<div class="kk-skeleton h-4" style="width: {w}%"></div>{/each}</div>{/if}
				</div>
			{/if}
		</div>

		<div class="flex items-center justify-between border-t px-3 py-1 text-xs" style="border-color: var(--kk-line); color: var(--kk-muted); background: var(--kk-surface-2)">
			{#if tab === 'edit'}<span>{pos.line}행 {pos.col}열{previewBusy ? ' · 미리보기 갱신 중…' : ''}</span>{:else}<span>미리보기{previewBusy ? ' · 갱신 중…' : previewAt ? ` · 마지막 갱신: ${relativeTime(new Date(previewAt).toISOString())}` : ''}</span>{/if}
			<span class="flex items-center gap-3">{#if dirty}<span class="kk-chip">저장 안 됨</span>{/if}{words.toLocaleString('ko-KR')}단어</span>
		</div>
	</div>

	{#if saveError}<div role="alert" class="alert mt-3 font-bold" style="background: var(--kk-danger-soft); color: var(--kk-danger)">{saveError}</div>{/if}

	{#if !denied}
	<form class="mt-3 flex flex-col gap-2" onsubmit={(e) => { e.preventDefault(); save(); }}>
		<label class="text-sm font-bold" for="summary">요약</label>
		<input id="summary" class="kk-input h-10 min-w-0 px-3 text-base" placeholder="무엇을 고쳤나요?" maxlength="500" bind:value={summary} />
		<label class="mt-1 flex cursor-pointer items-start gap-3 text-[0.95rem] leading-7">
			<input id="agree" type="checkbox" class="mt-2 size-5 shrink-0" bind:checked={agreed} />
			<span>문서 편집을 <b>저장</b>하면 당신은 기여한 내용을 <b>{page.data.site.license?.text ?? '이 위키의 라이선스'}</b>로 배포하고 기여자로 기록되는 것에 동의하는 것입니다. 이 <b>동의는 철회할 수 없습니다.</b></span>
		</label>
		<div class="flex justify-end gap-2">
			<a class="kk-btn" href={articlePath(title)}>취소</a>
			<button class="kk-btn kk-btn-primary" disabled={saving || loading || !editor || !agreed || (!dirty && exists)}>{saving ? '저장 중…' : '저장'}</button>
		</div>
	</form>
	{/if}
</article>

