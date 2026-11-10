<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { api, session, ui } from '$lib/session.svelte';
	import { articlePath } from '$lib/wikitext';
	let { data } = $props();
	let topic = $state('');
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
			await api({ action: 'edit', title: data.talkTitle, section: 'new', sectiontitle: topic, text, token: t.query.tokens.csrftoken }, true);
			await fetch('/_/purge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: data.talkTitle }) });
			topic = text = '';
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
		<div class="seg"><a href={articlePath(data.subject)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">reply</span>문서로</a></div>
	</div>

	<h2 class="mt-6 mb-2 text-xl font-extrabold">토론</h2>
	{#await data.talk}
		<div class="flex flex-col gap-2" role="status" aria-label="불러오는 중">{#each [70, 90, 55] as w}<div class="kk-skeleton h-5" style="width: {w}%"></div>{/each}</div>
	{:then t}
		{#if t.topics.length}
			<ol class="list-decimal pl-6 leading-8">
				{#each t.topics as topic (topic.index)}<li><a style="color: var(--kk-blue)" href="/thread/{slug(data.talkTitle)}?s={topic.index}">{@html topic.title}</a></li>{/each}
			</ol>
		{:else}
			<p style="color: var(--kk-muted)">아직 토론이 없어요.</p>
		{/if}
		{#if t.exists}<p class="mt-2 text-xs"><a style="color: var(--kk-blue)" href={'/history/' + slug(data.talkTitle)}>토론 문서 역사</a></p>{/if}
	{:catch}
		<p>불러오지 못했어요.</p>
	{/await}

	<hr class="my-6 border-dashed" style="border-color: var(--kk-line-strong)" />
	<h2 class="mb-3 text-xl font-extrabold">새 주제 생성</h2>
	<form class="flex flex-col gap-2" onsubmit={submit}>
		<label class="text-sm" for="topic">주제 :</label>
		<input id="topic" class="kk-input h-10 px-3 text-base" bind:value={topic} required maxlength="200" />
		<label class="text-sm" for="body">내용 :</label>
		<textarea id="body" class="kk-input min-h-32 p-3 text-base" bind:value={text} required></textarea>
		{#if session.loaded && session.anon}<p class="text-sm font-bold" style="color: var(--kk-danger)">비로그인 상태로 토론에 참여합니다. 토론 내역에 IP({session.name}) 주소 전체가 영구히 기록됩니다.</p>{/if}
		{#if error}<p role="alert" class="alert font-bold" style="background: var(--kk-danger-soft); color: var(--kk-danger)">{error}</p>{/if}
		<div class="flex justify-end gap-2">
			{#if session.loaded && session.anon}<button type="button" class="kk-btn" onclick={() => (ui.loginOpen = true)}>로그인</button>{/if}
			<button class="kk-btn kk-btn-primary" disabled={busy}>{busy ? '전송 중…' : '전송'}</button>
		</div>
	</form>
</article>
