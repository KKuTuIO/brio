<script lang="ts">
	import HistoryHead from '$lib/HistoryHead.svelte';
	import { userPage } from '$lib/ns';
	import { articlePath } from '$lib/wikitext';
	let { data } = $props();
	const pad = (n: number) => String(n).padStart(2, '0');
	const fmt = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
	const slug = (t: string) => t.replace(/ /g, '_');
	const tag = 'rounded px-1.5 py-0.5 text-xs font-bold';
</script>

<svelte:head><title>{data.title} (표제어 역사) - {data.site.sitename}</title></svelte:head>

<article class="kk-card p-4 sm:p-7">
	<HistoryHead title={data.title} active="title" />
	{#await data.life}
		<div class="mt-6 flex flex-col gap-4" role="status" aria-label="불러오는 중">{#each [0, 1, 2] as i (i)}<div class="kk-skeleton h-6 w-3/4"></div>{/each}</div>
	{:then life}
		{@const rows = [
			...life.events.map((e) => ({ ...e, at: e.ts })),
			...(life.first ? [{ kind: 'create' as const, at: life.first.ts, user: life.first.user, anon: life.first.anon, comment: life.first.comment, target: '', short: life.first.short, current: life.first.exists }] : [])
		].sort((a, b) => b.at.localeCompare(a.at))}
		<ul class="mt-6 border-t" style="border-color: var(--kk-line)">
			{#each rows as e, i (e.at + i)}
				<li class="flex flex-wrap items-start gap-x-3 gap-y-1 border-b py-3" style="border-color: var(--kk-line)">
					<span class="material-symbols-outlined mt-0.5" style="font-size:22px; color: {e.kind === 'create' ? '#16a34a' : '#7c3aed'}" aria-hidden="true">{e.kind === 'create' ? 'add' : e.kind === 'move' ? 'arrow_right_alt' : 'delete'}</span>
					<div class="min-w-0 flex-1">
						<p class="leading-7">
							{#if e.anon}<b style="color: var(--kk-blue)">{e.user}</b>{:else}<a class="font-bold" style="color: var(--kk-blue)" href={articlePath(userPage(e.user, data.site.ns))}>{e.user}</a>{/if}
							{#if e.kind === 'create'}
								<span class={tag} style="background: color-mix(in srgb, #16a34a 18%, var(--kk-surface)); color: #16a34a">새 문서</span>
								{#if e.current}<span class={tag} style="background: color-mix(in srgb, #16a34a 18%, var(--kk-surface)); color: #16a34a">현재 문서</span>{/if}
								<code class="text-[0.85em]">{e.short}</code>
							{:else if e.kind === 'move'}
								<span class={tag} style="background: color-mix(in srgb, #7c3aed 16%, var(--kk-surface)); color: #7c3aed">문서 이동</span>
								<b><a href={articlePath(e.target)}>{e.target}</a></b>로 이동
							{:else}
								<span class={tag} style="background: color-mix(in srgb, #dc2626 16%, var(--kk-surface)); color: #dc2626">{e.kind === 'restore' ? '문서 복구' : '문서 삭제'}</span>
							{/if}
							{#if e.comment && e.kind !== 'create'}<span class="text-sm" style="color: var(--kk-muted)">{e.comment}</span>{/if}
						</p>
					</div>
					<span class="text-sm tabular-nums" style="color: var(--kk-muted)">{fmt(e.at)}</span>
				</li>
			{:else}
				<li class="py-8 text-center" style="color: var(--kk-muted)">기록이 없어요.</li>
			{/each}
		</ul>
	{:catch}
		<p class="mt-6 text-center">불러오지 못했어요.</p>
	{/await}
</article>
