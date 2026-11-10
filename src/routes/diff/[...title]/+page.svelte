<script lang="ts">
	import { page } from '$app/state';
	import { articlePath, editPath } from '$lib/wikitext';
	let { data } = $props();
	const slug = (t: string) => t.replace(/ /g, '_');
</script>

<svelte:head><title>{data.title} (비교) - {page.data.site.sitename}</title></svelte:head>

<article class="kk-card p-4 sm:p-7">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<h1 class="text-[2rem] leading-tight font-extrabold">{data.title} <span class="text-xl">(비교)</span></h1>
		<div class="seg">
			<a href={editPath(data.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">edit_square</span>편집</a>
			<a href={'/history/' + slug(data.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">menu_book</span>역사</a>
			<a href={'/backlink/' + slug(data.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">anchor</span>역링크</a>
		</div>
	</div>
	{#await data.diff}
		<div class="mt-6 flex flex-col gap-2" role="status" aria-label="비교 중">{#each [90, 60, 80, 70, 50] as w}<div class="kk-skeleton h-6" style="width: {w}%"></div>{/each}</div>
	{:then d}
		{#if !d}
			<p class="mt-6" style="color: var(--kk-muted)">비교할 수 있는 판이 없어요. <a style="color: var(--kk-blue)" href={articlePath(data.title)}>문서로 돌아가기</a></p>
		{:else}
			<p class="mt-5 text-sm font-bold">r{d.fromrev} <span style="color: var(--kk-muted)">({d.fromuser})</span> vs r{d.torev} <span style="color: var(--kk-muted)">({d.touser})</span>{#if d.tocomment}<span class="font-normal" style="color: var(--kk-muted)"> — {d.tocomment}</span>{/if}</p>
			<div class="diffbox mt-3 overflow-x-auto">{@html d.html ? `<table class="diff">${d.html}</table>` : '<p class="p-4">변경된 내용이 없어요.</p>'}</div>
		{/if}
	{:catch}
		<p class="mt-6">불러오지 못했어요.</p>
	{/await}
</article>

<style>
	.diffbox { border: 1px solid var(--kk-line-strong); border-radius: 0.25rem; }
	.diffbox :global(table.diff) { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 0.875rem; line-height: 1.55; }
	.diffbox :global(.diff-otitle), .diffbox :global(.diff-ntitle) { display: none; }
	.diffbox :global(td) { padding: 0.15rem 0.5rem; vertical-align: top; overflow-wrap: anywhere; }
	.diffbox :global(.diff-marker) { width: 1.4rem; text-align: right; color: var(--kk-muted); background: var(--kk-surface-2); }
	.diffbox :global(.diff-lineno) { background: var(--kk-surface-2); font-weight: 800; color: var(--kk-muted); }
	.diffbox :global(.diff-deletedline) { background: color-mix(in srgb, #ef4444 16%, var(--kk-surface)); }
	.diffbox :global(.diff-addedline) { background: color-mix(in srgb, #22c55e 18%, var(--kk-surface)); }
	.diffbox :global(.diff-context) { background: var(--kk-surface); color: var(--kk-muted); }
	.diffbox :global(del.diffchange) { background: color-mix(in srgb, #ef4444 38%, transparent); text-decoration: none; }
	.diffbox :global(ins.diffchange) { background: color-mix(in srgb, #22c55e 40%, transparent); text-decoration: none; }
</style>
