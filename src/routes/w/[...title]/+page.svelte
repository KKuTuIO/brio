<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import ArticleSkeleton from '$lib/ArticleSkeleton.svelte';
	import { headings } from '$lib/headings';
	import { footnotes } from '$lib/footnotes';
	import { collapsibles, foldToc, placeToc } from '$lib/collapsible';
	import { headingMarkup } from '$lib/headings';
	import { session, ui } from '$lib/session.svelte';
	import '$lib/wiki.css';
	import { articlePath, editPath, rewriteLinks, tocOf } from '$lib/wikitext';
	import { categoryPage, isTalk, talkOf, titleParts } from '$lib/ns';
	import { api } from '$lib/session.svelte';
	import { prefs } from '$lib/prefs.svelte';
	import { goto } from '$app/navigation';
	import CategoryMembers from '$lib/CategoryMembers.svelte';
	import MwFrame from '$lib/MwFrame.svelte';
	import LicenseNotice from '$lib/LicenseNotice.svelte';
	import NsTitle from '$lib/NsTitle.svelte';
	import FileView from '$lib/FileView.svelte';
	let { data } = $props();
	let embed = $state<string | null | undefined>(untrack(() => (data.embed instanceof Promise ? undefined : data.embed)));
	let frameTitle = $state('');
	$effect(() => {
		let live = true;
		frameTitle = '';
		Promise.resolve(data.embed)
			.then((e) => live && (embed = e))
			.catch(() => live && (embed = null));
		return () => (live = false);
	});
	$effect(() => {
		let live = true;
		Promise.resolve(data.reroute)
			.then((r) => {
				if (!live || !r) return;
				if (r.hard) location.replace(r.to);
				else goto(r.to, { replaceState: true });
			})
			.catch(() => {});
		return () => (live = false);
	});
	let denyMsg = $state<string | null>(null);
	let denyDlg: HTMLDialogElement | undefined = $state();
	$effect(() => {
		if (!denyDlg) return;
		if (denyMsg && !denyDlg.open) denyDlg.showModal();
		if (!denyMsg && denyDlg.open) denyDlg.close();
	});
	let moreOpen = $state(false);
	const outside = (node: HTMLElement) => {
		const on = (e: Event) => !node.contains(e.target as Node) && (moreOpen = false);
		document.addEventListener('pointerdown', on);
		return { destroy: () => document.removeEventListener('pointerdown', on) };
	};

	const fmt = (iso?: string) => {
		if (!iso) return '';
		const d = new Date(iso);
		const p = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
	};
	const slug = (t: string) => t.replace(/ /g, '_');
	const ns = $derived(data.site.ns);
	const talk = (t: string) => talkOf(t, ns) ?? t;

	let watched = $state(false);
	let watchBusy = $state(false);
	$effect(() => {
		let live = true;
		Promise.resolve(data.article).then((a) => live && (watched = !!a?.watched)).catch(() => {});
		return () => (live = false);
	});
	async function toggleWatch(title: string) {
		if (session.anon) return (ui.loginOpen = true);
		watchBusy = true;
		try {
			const t = await api({ action: 'query', meta: 'tokens', type: 'watch' });
			await api({ action: 'watch', titles: title, token: t.query.tokens.watchtoken, ...(watched ? { unwatch: '1' } : {}) }, true);
			watched = !watched;
		} catch {
		} finally {
			watchBusy = false;
		}
	}

	let wikiEl = $state<HTMLElement>();
	let deniedNow = $state<string | null>(null);
	function jumpTo(e: Event, anchor: string) {
		if ((e.target as Element).closest('a')) return;
		location.hash = anchor;
	}
	let tocEl = $state<HTMLElement>();
	let tocFolded = $state(false);
	const titleHasNs = (t: string) => titleParts(t, data.site.ns).prefix !== null;
	let rich = $state<Record<string, string>>({});
	let html = $state('');
	let hidden = $state<string[]>([]);
	$effect(() => {
		const node = wikiEl;
		if (!node || !html) return;
		const removed: string[] = [];
		const stopFootnotes = footnotes(node, { onRemovedHeading: (a) => removed.push(a) });
		headings(node);
		hidden = removed;
		const stopFolds = collapsibles(node);
		if (tocEl) placeToc(node, tocEl);
		rich = headingMarkup(node, sections.map((x) => x.anchor));
		const lock = (e: Event) => {
			const a = (e.target as HTMLElement).closest('.mw-editsection a');
			if (a && deniedNow) {
				e.preventDefault();
				denyMsg = deniedNow;
			}
		};
		node.addEventListener('click', lock, true);
		return () => {
			stopFolds();
			node.removeEventListener('click', lock, true);
			stopFootnotes();
		};
	});
	let sections = $state<import('$lib/wikitext').Section[]>([]);
	$effect(() => {
		let live = true;
		Promise.resolve(data.article)
			.then((a) => {
				if (!live) return;
				sections = a ? tocOf(a.sections) : [];
				html = a ? rewriteLinks(a.html) : '';
				deniedNow = a?.editDenied ?? null;
			})
			.catch(() => live && (sections = []));
		return () => (live = false);
	});
	const toc = $derived(sections.filter((s) => !hidden.includes(s.anchor)));
	$effect(() => {
		ui.toc = toc.map((s) => ({ anchor: s.anchor, number: s.number, line: rich[s.anchor] ?? s.line, level: s.toclevel }));
		return () => (ui.toc = []);
	});
	onMount(() => {
		if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
	});
</script>

<svelte:head><title>{embed ? frameTitle || data.title : data.title} - {data.site.sitename}</title></svelte:head>

{#if embed}
	<article class="kk-card min-w-0 p-4 sm:p-7">
		<h1 class="text-[2rem] leading-tight font-extrabold">{frameTitle || data.title}</h1>
		<div class="relative mt-4"><MwFrame src={embed} specialNames={data.site.specialNames} ontitle={(t) => (frameTitle = t)} /></div>
	</article>
{:else if embed === undefined}
	<article class="kk-card min-w-0 p-5 sm:p-7"><div class="kk-skeleton mb-6 h-9 w-1/2"></div><ArticleSkeleton /></article>
{:else}
{#await data.article}
	<article class="kk-card min-w-0 p-5 sm:p-7">
		<div class="kk-skeleton mb-2 h-9 w-1/2"></div>
		<div class="kk-skeleton mb-6 h-4 w-48"></div>
		<div class="kk-skeleton mb-6 h-8 w-full"></div>
		<ArticleSkeleton />
	</article>
{:then a}
	{#if !a}
		<article class="kk-card min-w-0 p-5 sm:p-7">
			<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
				<h1 class="min-w-0 text-[2rem] leading-tight font-extrabold"><NsTitle title={data.title} ns={data.site.ns} /></h1>
				<div class="ml-auto flex items-start gap-2">
					<div class="seg" role="group" aria-label="문서 도구">
						<button type="button" disabled={watchBusy} onclick={() => toggleWatch(data.title)} aria-pressed={watched} aria-label={watched ? '주시 해제' : '주시'} title={watched ? '주시 해제' : '주시 문서에 추가'}><span class="material-symbols-outlined" style="font-size:18px; {watched ? "font-variation-settings:'FILL' 1; color:#f59e0b" : ''}" aria-hidden="true">star</span></button>
						<a href={editPath(data.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">edit_square</span>편집</a>
						<a href={'/discuss/' + slug(data.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">forum</span>토론</a>
						<a href={'/activity/' + slug(data.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">menu_book</span>역사</a>
					</div>
					<div class="relative" use:outside>
						<button type="button" class="grid h-9 w-9 place-items-center rounded-md border" style="border-color: var(--kk-line-strong)" aria-expanded={moreOpen} aria-label="더 보기" onclick={() => (moreOpen = !moreOpen)}><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">more_vert</span></button>
						{#if moreOpen}
							<div class="kk-card absolute top-11 right-0 z-30 flex w-48 flex-col p-1 text-sm font-bold shadow-lg" role="menu">
								<a role="menuitem" class="flex items-center gap-2 rounded px-3 py-2 hover:bg-(--kk-accent-soft)" href={'/backlink/' + slug(data.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">anchor</span>역링크</a>
								<a role="menuitem" class="flex items-center gap-2 rounded px-3 py-2 hover:bg-(--kk-accent-soft)" href="/mw?src={encodeURIComponent(`/index.php?title=${data.title}&action=protect`)}"><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">policy</span>ACL</a>
							</div>
						{/if}
					</div>
				</div>
			</div>
			{#await data.members}
				<div class="kk-skeleton mt-6 h-5 w-1/3"></div>
			{:then m}
				{#if m?.total}
					<div class="mt-4"><CategoryMembers members={m} ns={data.site.ns} /></div>
				{:else}
					<p class="mt-6">해당 문서를 찾을 수 없습니다.</p>
					<a class="kk-btn-blue mt-5" href={editPath(data.title)}>새 문서 만들기</a>
				{/if}
			{/await}
		</article>
	{:else}
		<article class="kk-card min-w-0 p-4 sm:p-7">
			<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
				<div class="min-w-0">
					<h1 class="text-[2rem] leading-tight font-extrabold">{#if titleHasNs(a.title)}<NsTitle title={a.title} ns={data.site.ns} />{:else}{@html a.displaytitle}{/if}</h1>
					{#if a.touched}<p class="mt-1 text-sm" style="color: var(--kk-muted)">최근 수정 시각: {fmt(a.touched)}</p>{/if}
				</div>
				<div class="seg ml-auto" role="group" aria-label="문서 도구">
					<button type="button" disabled={watchBusy} onclick={() => toggleWatch(a.title)} aria-pressed={watched} aria-label={watched ? '주시 해제' : '주시'} title={watched ? '주시 해제' : '주시 문서에 추가'}><span class="material-symbols-outlined" style="font-size:18px; {watched ? "font-variation-settings:'FILL' 1; color:#f59e0b" : ''}" aria-hidden="true">star</span></button>
					{#if a.editDenied}<button type="button" onclick={() => (denyMsg = a.editDenied)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">edit_square</span>편집{#if a.protection}<span class="material-symbols-outlined" style="font-size:15px; color: var(--kk-muted)" aria-label="편집 보호됨 ({a.protection})" title="편집 보호됨 ({a.protection})">lock</span>{/if}</button>{:else}<a href={editPath(a.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">edit_square</span>편집{#if a.protection}<span class="material-symbols-outlined" style="font-size:15px; color: var(--kk-muted)" aria-label="편집 보호됨 ({a.protection})" title="편집 보호됨 ({a.protection})">lock</span>{/if}</a>{/if}
					<a href={'/discuss/' + slug(isTalk(a.title, ns) ? (talkOf(a.title, ns) ?? a.title) : a.title)} class:has-talk={a.talkExists} aria-current={isTalk(a.title, ns) ? 'page' : undefined} title={a.talkExists ? '토론이 있어요' : undefined}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">forum</span>토론</a>
					<a href={'/activity/' + slug(a.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">menu_book</span>역사</a>
				</div>
				<div class="relative" use:outside>
					<button type="button" class="grid h-9 w-9 place-items-center rounded-md border" style="border-color: var(--kk-line-strong)" aria-expanded={moreOpen} aria-label="더 보기" onclick={() => (moreOpen = !moreOpen)}><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">more_vert</span></button>
					{#if moreOpen}
						<div class="kk-card absolute top-11 right-0 z-30 flex w-48 flex-col p-1 text-sm font-bold shadow-lg" role="menu">
							<a role="menuitem" class="flex items-center gap-2 rounded px-3 py-2 hover:bg-(--kk-accent-soft)" href={'/backlink/' + slug(a.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">anchor</span>역링크</a>
							<a role="menuitem" class="flex items-center gap-2 rounded px-3 py-2 hover:bg-(--kk-accent-soft)" href="/mw?src={encodeURIComponent(`/index.php?title=${a.title}&action=protect`)}"><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">policy</span>ACL</a>
						</div>
					{/if}
				</div>
			</div>
			{#if data.rev}
				<div class="mt-5 rounded border px-4 py-3 text-sm" style="background: var(--kk-warn-soft); border-color: var(--kk-warn); color: var(--kk-warn)" role="note">
					r{data.rev} 판이에요 (예전 판). <a class="font-bold underline" href={articlePath(a.title)}>최신 판 보기</a>
				</div>
			{/if}
			{#if data.from}
				<div class="mt-5 rounded border px-4 py-3 text-sm" style="background: color-mix(in srgb, var(--kk-blue) 18%, var(--kk-surface)); border-color: color-mix(in srgb, var(--kk-blue) 50%, var(--kk-surface))" role="note">
					<a class="font-bold" style="color: var(--kk-blue)" href="{articlePath(data.from)}?redirect=no">{data.from}</a>에서 넘어옴
				</div>
			{/if}

			{#if prefs.categoryPos !== 'bottom'}
			{#if a.categories.length}
				<div class="mt-5 rounded border px-3 py-1.5 text-sm" style="border-color: var(--kk-line)">
					<span>분류:</span>
					{#each a.categories as c, i}{#if i}<span class="mx-1.5" style="color: var(--kk-muted)">|</span>{/if}<a style="color: var(--kk-blue)" href={articlePath(categoryPage(c.replace(/_/g, ' '), ns))}>{c.replace(/_/g, ' ')}</a>{/each}
				</div>
			{/if}
			{/if}

			{#if toc.length}
				<div id="toc" bind:this={tocEl} class="toc-box mt-5">
					<button type="button" class="toc-head" aria-expanded={!tocFolded} aria-controls="toc-list" onclick={() => { tocFolded = !tocFolded; if (tocEl) foldToc(tocEl, tocFolded); }}>
						<span>목차</span><span class="material-symbols-outlined" aria-hidden="true">{tocFolded ? 'chevron_left' : 'expand_more'}</span>
					</button>
					<ol id="toc-list" class="toc-list">
						{#each toc as s (s.index)}<li style="padding-left: {(s.toclevel - 1) * 1.25}rem"><a class="toc-num" href="#{s.anchor}">{s.number}.</a> <span class="toc-title" role="link" tabindex="0" onclick={(e) => jumpTo(e, s.anchor)} onkeydown={(e) => e.key === 'Enter' && jumpTo(e, s.anchor)}>{@html rich[s.anchor] ?? rewriteLinks(s.line)}</span></li>{/each}
					</ol>
				</div>
			{/if}

			{#await data.file then f}{#if f}<FileView {f} ns={data.site.ns} />{/if}{/await}

			<div class="wiki mt-4" bind:this={wikiEl}>{@html rewriteLinks(a.html)}</div>
			<LicenseNotice site={data.site} />
			{#if prefs.categoryPos !== 'top' && a.categories.length}
				<div class="mt-6 rounded border px-3 py-1.5 text-sm" style="border-color: var(--kk-line)">
					<span>분류:</span>
					{#each a.categories as c, i}{#if i}<span class="mx-1.5" style="color: var(--kk-muted)">|</span>{/if}<a style="color: var(--kk-blue)" href={articlePath(categoryPage(c.replace(/_/g, ' '), ns))}>{c.replace(/_/g, ' ')}</a>{/each}
				</div>
			{/if}
			{#await data.members then m}{#if m}<CategoryMembers members={m} ns={data.site.ns} />{/if}{/await}
		</article>
	{/if}
{:catch}
	<article class="kk-card p-8 text-center">
		<h1 class="text-xl font-extrabold">문서를 불러오지 못했어요</h1>
		<p class="mt-2" style="color: var(--kk-muted)">잠시 후 다시 시도해 주세요.</p>
		<a class="kk-btn mt-5" href={articlePath(data.title)} data-sveltekit-reload>다시 시도</a>
	</article>
{/await}
{/if}
<dialog bind:this={denyDlg} onclose={() => (denyMsg = null)} onclick={(e) => e.target === denyDlg && (denyMsg = null)} class="kk-card m-auto w-[min(94vw,34rem)] overflow-hidden p-0 backdrop:bg-black/50" style="color: var(--kk-text)" aria-labelledby="deny-title">
	<div class="flex items-center justify-between border-b px-5 py-3" style="background: var(--kk-surface-2); border-color: var(--kk-line)">
		<h2 id="deny-title" class="flex items-center gap-2 text-lg font-extrabold"><span class="material-symbols-outlined" aria-hidden="true">edit_square</span>편집</h2>
		<button type="button" class="grid h-8 w-8 place-items-center rounded hover:bg-(--kk-accent-soft)" aria-label="닫기" onclick={() => (denyMsg = null)}><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
	</div>
	<div class="min-h-28 px-5 py-5 leading-7">
		<p>{denyMsg}</p>
		<p class="mt-2 text-sm" style="color: var(--kk-muted)">자세한 내용은 <a style="color: var(--kk-blue)" href="/mw?src={encodeURIComponent(`/index.php?title=${data.title}&action=protect`)}" onclick={() => (denyMsg = null)}>ACL</a>을 확인하시기 바랍니다.</p>
	</div>
	<div class="flex justify-end border-t px-5 py-3" style="border-color: var(--kk-line)"><button type="button" class="kk-btn" onclick={() => (denyMsg = null)}>닫기</button></div>
</dialog>

