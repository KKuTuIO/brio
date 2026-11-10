<script lang="ts">
	import { articlePath } from './wikitext';
	import { relativeTime } from './time';
	let { recent }: { recent: Promise<{ title: string; ts: string }[]> } = $props();
	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 15000);
		return () => clearInterval(id);
	});
</script>

<section class="kk-card p-4" aria-label="최근 변경">
	<div class="mb-2 flex items-center justify-between">
		<h2 class="flex items-center gap-1.5 font-extrabold"><span class="material-symbols-outlined" style="font-size:20px; color: var(--kk-muted)" aria-hidden="true">history</span>최근 변경</h2>
		<a href="/recent" class="grid h-6 w-6 place-items-center" aria-label="더 보기"><span class="material-symbols-outlined" style="font-size:20px">chevron_right</span></a>
	</div>
	<ul class="text-sm">
		{#await recent}
			{#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}<li class="flex items-center justify-between py-1.5"><div class="kk-skeleton h-4" style="width: {50 + ((i * 17) % 35)}%"></div><div class="kk-skeleton h-3 w-10"></div></li>{/each}
		{:then items}
			{#each items as c (c.title + c.ts)}
				<li class="flex items-baseline justify-between gap-2 py-1.5">
					<a href={articlePath(c.title)} class="min-w-0 truncate" style="color: var(--kk-blue)">{c.title}</a>
					<span class="shrink-0 text-xs tabular-nums" style="color: var(--kk-muted)">{relativeTime(c.ts, now)}</span>
				</li>
			{:else}
				<li class="py-2 text-xs" style="color: var(--kk-muted)">변경 내역이 없어요.</li>
			{/each}
		{:catch}
			<li class="py-2 text-xs" style="color: var(--kk-muted)">불러오지 못했어요.</li>
		{/await}
	</ul>
</section>
