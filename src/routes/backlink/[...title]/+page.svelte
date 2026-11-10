<script lang="ts">
	import { page } from '$app/state';
	import { articlePath, editPath } from '$lib/wikitext';
	import { nsName } from '$lib/ns';
	let { data } = $props();
	const ns = $derived(page.data.site.ns);
	const slug = (t: string) => t.replace(/ /g, '_');
	function groups(links: { title: string; redirect: boolean; ns: number }[]) {
		const m = new Map<number, typeof links>();
		for (const l of links) m.set(l.ns, [...(m.get(l.ns) ?? []), l]);
		return [...m.entries()].sort(([a], [b]) => a - b);
	}
</script>

<svelte:head><title>{data.title} (역링크) - {page.data.site.sitename}</title></svelte:head>

<article class="kk-card p-4 sm:p-7">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<h1 class="text-[2rem] leading-tight font-extrabold">{data.title} <span class="text-xl">(역링크)</span></h1>
		<div class="seg">
			<a href={articlePath(data.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">article</span>문서</a>
			<a href={editPath(data.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">edit_square</span>편집</a>
			<a href={'/history/' + slug(data.title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">menu_book</span>역사</a>
		</div>
	</div>
	{#await data.links}
		<div class="mt-6 flex flex-col gap-2" role="status" aria-label="불러오는 중">{#each [40, 55, 35, 50, 45] as w}<div class="kk-skeleton h-5" style="width: {w}%"></div>{/each}</div>
	{:then links}
		{#if !links.length}
			<p class="mt-6" style="color: var(--kk-muted)">이 문서를 가리키는 문서가 없어요.</p>
		{:else}
			<p class="mt-5 text-sm" style="color: var(--kk-muted)">전체 {links.length}개 문서</p>
			{#each groups(links) as [id, items] (id)}
				<h2 class="mt-5 mb-2 border-b pb-1 text-xl font-extrabold" style="border-color: var(--kk-line-strong)">{nsName(ns, id) || '문서'}</h2>
				<ul class="list-disc pl-6 leading-8" style="columns: 3 14rem">
					{#each items as l (l.title)}
						<li><a style="color: var(--kk-blue)" href={articlePath(l.title)}>{l.title}</a>{#if l.redirect}<span class="ml-1 text-xs" style="color: var(--kk-muted)">(리다이렉트)</span>{/if}</li>
					{/each}
				</ul>
			{/each}
		{/if}
	{:catch}
		<p class="mt-6">불러오지 못했어요.</p>
	{/await}
</article>
