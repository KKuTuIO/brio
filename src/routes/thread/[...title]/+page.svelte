<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { api, session, ui } from '$lib/session.svelte';
	import { articlePath, rewriteLinks } from '$lib/wikitext';
	import '$lib/wiki.css';
	let { data } = $props();
	let text = $state('');
	let busy = $state(false);
	let error = $state('');
	const slug = (t: string) => t.replace(/ /g, '_');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = '';
		try {
			const t = await api({ action: 'query', meta: 'tokens', type: 'csrf' });
			await api({ action: 'edit', title: data.talkTitle, section: data.section, appendtext: '\n\n' + text.trim() + ' ~~~~', token: t.query.tokens.csrftoken }, true);
			await fetch('/_/purge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: data.talkTitle }) });
			text = '';
			await invalidateAll();
		} catch (err) {
			error = (err as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>{data.subject} (토론) - {page.data.site.sitename}</title></svelte:head>

<article class="kk-card talk p-4 sm:p-7">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<h1 class="text-[2rem] leading-tight font-extrabold">{data.subject} <span class="text-xl">(토론)</span></h1>
		<div class="seg">
			<a href={'/discuss/' + slug(data.subject)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">list</span>토론 목록</a>
			<a href={articlePath(data.subject)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">reply</span>문서로</a>
		</div>
	</div>
	{#await data.thread}
		<div class="mt-6 flex flex-col gap-2" role="status" aria-label="불러오는 중">{#each [50, 90, 70, 80] as w}<div class="kk-skeleton h-5" style="width: {w}%"></div>{/each}</div>
	{:then t}
		{#if !t}
			<p class="mt-6" style="color: var(--kk-muted)">이 토론을 찾을 수 없어요. <a style="color: var(--kk-blue)" href={'/discuss/' + slug(data.subject)}>토론 목록으로</a></p>
		{:else}
			<h2 class="mt-6 mb-3 text-2xl font-extrabold">{@html t.heading}</h2>
			<div class="rounded border p-4" style="border-color: var(--kk-line-strong); background: var(--kk-surface-2)"><div class="wiki">{@html rewriteLinks(t.html)}</div></div>
			<form class="mt-6 flex flex-col gap-2" onsubmit={submit}>
				<label class="text-sm font-bold" for="reply">댓글 달기</label>
				<textarea id="reply" class="kk-input min-h-28 p-3 text-base" bind:value={text} required></textarea>
				{#if session.loaded && session.anon}<p class="text-sm font-bold" style="color: var(--kk-danger)">비로그인 상태로 토론에 참여합니다. 토론 내역에 IP({session.name}) 주소 전체가 영구히 기록됩니다.</p>{/if}
				{#if error}<p role="alert" class="alert font-bold" style="background: var(--kk-danger-soft); color: var(--kk-danger)">{error}</p>{/if}
				<div class="flex justify-end gap-2">
					{#if session.loaded && session.anon}<button type="button" class="kk-btn" onclick={() => (ui.loginOpen = true)}>로그인</button>{/if}
					<button class="kk-btn kk-btn-primary" disabled={busy}>{busy ? '전송 중…' : '전송'}</button>
				</div>
			</form>
		{/if}
	{:catch}
		<p class="mt-6">불러오지 못했어요.</p>
	{/await}
</article>
