<script lang="ts">
	import HistoryHead from '$lib/HistoryHead.svelte';
	import Pager from '$lib/Pager.svelte';
	import { userPage } from '$lib/ns';
	import { articlePath } from '$lib/wikitext';
	let { data } = $props();
	const pad = (n: number) => String(n).padStart(2, '0');
	const fmt = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
	const slug = (t: string) => t.replace(/ /g, '_');
	const enc = encodeURIComponent;
	const what = { move: '문서 이동', delete: '문서 삭제', restore: '문서 복구', protect: 'ACL 변경', other: '문서 작업', create: '새 문서' } as const;
	const icon = { move: 'drive_file_move', delete: 'delete', restore: 'restore_from_trash', protect: 'policy', other: 'history', create: 'add' } as const;
	const btn = 'rounded border px-2 py-0.5 text-xs';
</script>

<svelte:head><title>{data.title} (문서 활동) - {data.site.sitename}</title></svelte:head>

<article class="kk-card p-4 sm:p-7">
	<HistoryHead title={data.title} active="activity" />
	{#await data.activity}
		<div class="mt-6 flex flex-col gap-5" role="status" aria-label="불러오는 중">{#each [0, 1, 2, 3] as i (i)}<div class="flex gap-3"><div class="kk-skeleton size-9"></div><div class="flex-1"><div class="kk-skeleton h-5 w-2/3"></div><div class="kk-skeleton mt-2 h-4 w-40"></div></div></div>{/each}</div>
	{:then act}
		<div class="mt-5"><Pager base={'/activity/' + slug(data.title)} prev={act.prev} next={act.next} /></div>
		<ol class="relative mt-6 flex flex-col gap-6">
			{#each act.items as it, i (it.ts + i)}
				<li class="relative flex gap-3 {i < act.items.length - 1 ? 'before:absolute before:top-10 before:bottom-[-1.5rem] before:left-[1.05rem] before:w-px before:bg-(--kk-line-strong)' : ''}">
					<span class="grid size-[2.15rem] shrink-0 place-items-center rounded border" style="border-color: var(--kk-line-strong); background: var(--kk-surface)"><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">{it.kind === 'edit' ? 'edit_note' : icon[it.event.kind]}</span></span>
					<div class="min-w-0">
						{#if it.kind === 'edit'}
							{@const r = it.rev}
							<p class="leading-7">
								{#if r.anon}<b style="color: var(--kk-blue)">{r.user}</b>{:else}<a class="font-bold" style="color: var(--kk-blue)" href={articlePath(userPage(r.user, data.site.ns))}>{r.user}</a>{/if}
								사용자가 문서 편집 <code class="mx-1 text-[0.85em]">{r.short}</code> <b>r{r.seq}</b>
								<span class="font-bold tabular-nums" style="color: {r.delta < 0 ? '#dc2626' : r.delta === 0 ? 'var(--kk-muted)' : '#16a34a'}">{r.delta > 0 ? '+' : ''}{r.delta}</span>
							</p>
							{#if r.comment}<p class="text-sm" style="color: var(--kk-muted)">{r.comment}</p>{/if}
							<p class="mt-0.5 tabular-nums" style="color: var(--kk-muted)">{fmt(r.ts)}</p>
							<p class="mt-1.5 flex flex-wrap gap-1.5" style="color: var(--kk-text)">
								<a class={btn} style="border-color: var(--kk-line-strong); background: var(--kk-surface-2)" href="/w/{slug(data.title)}?rev={r.id}">보기</a>
								<a class={btn} style="border-color: var(--kk-line-strong); background: var(--kk-surface-2)" href="/index.php?title={enc(data.title)}&action=raw&oldid={r.id}" data-sveltekit-reload>RAW</a>
								{#if it.parent}<a class={btn} style="border-color: var(--kk-line-strong); background: var(--kk-surface-2)" href="/mw?src={enc(`/index.php?title=${data.title}&action=edit&undoafter=${it.parent}&undo=${r.id}`)}">되돌리기</a>{/if}
								<a class={btn} style="border-color: var(--kk-line-strong); background: var(--kk-surface-2)" href="/diff/{slug(data.title)}?rev={r.id}">비교</a>
							</p>
						{:else}
							{@const e = it.event}
							<p class="leading-7">
								{#if e.anon}<b style="color: var(--kk-blue)">{e.user}</b>{:else}<a class="font-bold" style="color: var(--kk-blue)" href={articlePath(userPage(e.user, data.site.ns))}>{e.user}</a>{/if}
								사용자가 {what[e.kind]}{#if e.kind === 'move' && e.target} <a style="color: var(--kk-blue)" href={articlePath(e.target)}>{e.target}</a>로{/if}
							</p>
							{#if e.comment}<p class="text-sm" style="color: var(--kk-muted)">{e.comment}</p>{/if}
							<p class="mt-0.5 tabular-nums" style="color: var(--kk-muted)">{fmt(e.ts)}</p>
						{/if}
					</div>
				</li>
			{:else}
				<li class="py-8 text-center" style="color: var(--kk-muted)">기록이 없어요.</li>
			{/each}
		</ol>
		<div class="mt-6"><Pager base={'/activity/' + slug(data.title)} prev={act.prev} next={act.next} /></div>
	{:catch}
		<p class="mt-6 text-center">불러오지 못했어요.</p>
	{/await}
</article>
