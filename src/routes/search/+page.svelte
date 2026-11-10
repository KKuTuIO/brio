<script lang="ts">
	import { page } from '$app/state';
	import { articlePath, editPath } from '$lib/wikitext';
	let { data } = $props();
</script>

<svelte:head><title>{data.q} 검색 - {page.data.site.sitename}</title></svelte:head>

<div class="mx-auto max-w-3xl">
	<h1 class="mb-4 text-2xl font-extrabold">“{data.q}” 검색 결과</h1>
	{#await data.results}
		<div class="flex flex-col gap-3" role="status" aria-label="검색 중">
			{#each [0, 1, 2, 3, 4] as i (i)}
				<div class="kk-card flex flex-col gap-2 p-4"><div class="kk-skeleton h-5 w-1/3"></div><div class="kk-skeleton h-4 w-full"></div><div class="kk-skeleton h-4 w-4/5"></div></div>
			{/each}
		</div>
	{:then r}
		{#if !r.hits.length}
			<div class="kk-card p-8 text-center">
				<p style="color: var(--kk-muted)">검색 결과가 없어요.</p>
				<a class="kk-btn kk-btn-primary mt-4" href={editPath(data.q)}>“{data.q}” 문서 만들기</a>
			</div>
		{:else}
			<p class="mb-3 text-sm" style="color: var(--kk-muted)">{r.total.toLocaleString('ko-KR')}개 문서</p>
			<ul class="flex flex-col gap-3">
				{#each r.hits as h (h.title)}
					<li class="kk-card p-4">
						<a class="text-lg font-extrabold hover:underline" style="color: var(--kk-blue)" href={articlePath(h.title)}>{h.title}</a>
						<p class="mt-1 text-sm [&_.searchmatch]:rounded [&_.searchmatch]:bg-(--kk-accent-soft) [&_.searchmatch]:px-0.5 [&_.searchmatch]:font-bold" style="color: var(--kk-muted)">{@html h.snippet}</p>
					</li>
				{/each}
			</ul>
		{/if}
	{:catch}
		<p class="kk-card p-8 text-center">검색하지 못했어요. 잠시 후 다시 시도해 주세요.</p>
	{/await}
</div>
