<script lang="ts">
	import { goto } from '$app/navigation';
	import HistoryHead from '$lib/HistoryHead.svelte';
	import Pager from '$lib/Pager.svelte';
	import { userPage } from '$lib/ns';
	import { articlePath } from '$lib/wikitext';
	let { data } = $props();
	const pad = (n: number) => String(n).padStart(2, '0');
	const fmt = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
	const slug = (t: string) => t.replace(/ /g, '_');
	const enc = encodeURIComponent;
	let oldRev = $state(0);
	let newRev = $state(0);
	$effect(() => {
		let live = true;
		Promise.resolve(data.revs).then((p) => {
			if (live && p.revs.length) {
				newRev = p.revs[0].id;
				oldRev = p.revs[1]?.id ?? p.revs[0].id;
			}
		}).catch(() => {});
		return () => (live = false);
	});
	function compare(e: SubmitEvent) {
		e.preventDefault();
		const [from, to] = oldRev < newRev ? [oldRev, newRev] : [newRev, oldRev];
		goto(`/diff/${slug(data.title)}?from=${from}&to=${to}`);
	}
</script>

<svelte:head><title>{data.title} (문서 역사) - {data.site.sitename}</title></svelte:head>

<article class="kk-card p-4 sm:p-7">
	<HistoryHead title={data.title} active="history" />
	<form class="mt-5" onsubmit={compare}>
		<button class="kk-btn" type="submit">선택 리비전 비교</button>
		{#await data.revs}
			<ul class="mt-4">{#each [0, 1, 2, 3, 4, 5, 6] as i (i)}<li class="flex gap-3 py-1.5" role="status"><div class="kk-skeleton h-5 w-44"></div><div class="kk-skeleton h-5 w-56"></div></li>{/each}</ul>
		{:then pg}
			<ul class="mt-4 text-[0.95rem] leading-7">
				{#each pg.revs as r, i (r.id)}
					<li class="flex flex-wrap items-baseline gap-x-2 border-b py-1.5" style="border-color: var(--kk-line)">
						<span class="tabular-nums">{fmt(r.ts)}</span>
						<span class="text-xs" style="color: var(--kk-blue)">
							(<a href="/w/{slug(data.title)}?rev={r.id}">보기</a> |
							<a href="/index.php?title={enc(data.title)}&action=raw&oldid={r.id}" data-sveltekit-reload>RAW</a>
							{#if pg.revs[i + 1]}| <a href="/mw?src={enc(`/index.php?title=${data.title}&action=edit&undoafter=${pg.revs[i + 1].id}&undo=${r.id}`)}">이 리비전으로 되돌리기</a>{/if}
							| <a href="/diff/{slug(data.title)}?rev={r.id}">비교</a>)
						</span>
						<span class="inline-flex gap-0.5"><input type="radio" name="old" value={r.id} checked={oldRev === r.id} onchange={() => (oldRev = r.id)} aria-label="r{r.seq} 이전 판으로 선택" /><input type="radio" name="new" value={r.id} checked={newRev === r.id} onchange={() => (newRev = r.id)} aria-label="r{r.seq} 이후 판으로 선택" /></span>
						<b class="tabular-nums">r{r.seq}</b>
						<span class="font-bold tabular-nums" style="color: {r.delta < 0 ? 'var(--kk-danger)' : r.delta === 0 ? 'var(--kk-muted)' : '#16a34a'}">({r.delta > 0 ? '+' : ''}{r.delta})</span>
						{#if r.anon}<span class="font-bold" style="color: var(--kk-blue)">{r.user}</span>{:else}<a class="font-bold" style="color: var(--kk-blue)" href={articlePath(userPage(r.user, data.site.ns))}>{r.user}</a>{/if}
						{#if r.comment}<span style="color: var(--kk-muted)">({r.comment})</span>{/if}
					</li>
				{:else}
					<li class="py-8 text-center" style="color: var(--kk-muted)">기록이 없어요.</li>
				{/each}
			</ul>
			<div class="mt-4"><Pager base={'/history/' + slug(data.title)} prev={pg.prev} next={pg.next} /></div>
		{:catch}
			<p class="py-8 text-center">불러오지 못했어요.</p>
		{/await}
	</form>
</article>
