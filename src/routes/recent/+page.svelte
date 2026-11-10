<script lang="ts">
	import { page } from '$app/state';
	import { articlePath } from '$lib/wikitext';
	import { relativeTime } from '$lib/time';
	import { splitTitle, talkOf, userPage } from '$lib/ns';
	import { TABS } from '$lib/recent';
	let { data } = $props();
	const ns = $derived(data.site.ns);
	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 15000);
		return () => clearInterval(id);
	});
	const q = (type: string) => `/recent?${new URLSearchParams({ ...(type !== 'all' ? { logtype: type } : {}), ...(data.talk ? { talk: '1' } : {}) })}`.replace(/\?$/, '');
	const slug = (t: string) => t.replace(/ /g, '_');
</script>

<svelte:head><title>{data.talk ? '최근 토론' : '최근 변경내역'} - {page.data.site.sitename}</title></svelte:head>

<article class="kk-card p-4 sm:p-7">
	<h1 class="text-[2rem] leading-tight font-extrabold">{data.talk ? '최근 토론' : '최근 변경내역'}</h1>
	<div class="seg mt-5" role="tablist">
		{#each TABS as t (t.key)}<a role="tab" href={q(t.key)} aria-current={data.type === t.key ? 'page' : undefined} aria-selected={data.type === t.key}>{t.label}</a>{/each}
	</div>
	<div class="mt-4 overflow-x-auto">
		<table class="w-full min-w-[34rem] text-sm">
			<thead>
				<tr class="border-b-2 text-left" style="border-color: var(--kk-line-strong)"><th class="py-2.5 pr-3">문서</th><th class="px-3">기능</th><th class="px-3">수정자</th><th class="pl-3">수정 시간</th></tr>
			</thead>
			<tbody>
				{#await data.changes}
					{#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}<tr class="border-b" style="border-color: var(--kk-line)"><td class="py-3"><div class="kk-skeleton h-5 w-48"></div></td><td><div class="kk-skeleton h-6 w-32"></div></td><td><div class="kk-skeleton h-5 w-20"></div></td><td><div class="kk-skeleton h-5 w-14"></div></td></tr>{/each}
				{:then changes}
					{#each changes as c, i (c.ts + c.title + i)}
						<tr class="border-b align-top" style="border-color: var(--kk-line)">
							<td class="py-2.5 pr-3">
								<a style="color: var(--kk-blue)" href={articlePath(c.title)}>{c.title}</a>
								{#if c.delta !== null}<span class="ml-1 text-xs font-bold tabular-nums" style="color: {c.delta < 0 ? '#dc2626' : c.delta === 0 ? 'var(--kk-muted)' : '#16a34a'}">{c.delta > 0 ? '+' : ''}{c.delta}</span>{/if}
								{#if c.kind === 'new'}<span class="kk-chip ml-1">새 문서</span>{:else if c.kind === 'delete'}<span class="ml-1 text-xs" style="color: var(--kk-danger)">(삭제)</span>{:else if c.kind === 'move'}<span class="ml-1 text-xs" style="color: var(--kk-muted)">(이동)</span>{/if}
								{#if c.comment}<p class="mt-0.5 pl-2 text-xs" style="color: var(--kk-muted)">{c.comment}</p>{/if}
							</td>
							<td class="px-3 py-2.5 whitespace-nowrap">
								<span class="inline-flex gap-1 text-xs">
									<a class="rounded border px-1.5 py-0.5" style="border-color: var(--kk-line-strong); background: var(--kk-surface-2)" href={'/history/' + slug(c.title)}>역사</a>
									{#if c.old_revid && c.revid}<a class="rounded border px-1.5 py-0.5" style="border-color: var(--kk-line-strong); background: var(--kk-surface-2)" href="/diff/{slug(c.title)}?from={c.old_revid}&to={c.revid}">비교</a>{:else}<span class="rounded border px-1.5 py-0.5 opacity-40" style="border-color: var(--kk-line-strong)">비교</span>{/if}
									{#if splitTitle(c.title, ns).id >= 0}<a class="rounded border px-1.5 py-0.5" style="border-color: var(--kk-line-strong); background: var(--kk-surface-2)" href={articlePath(talkOf(c.title, ns) ?? c.title)}>토론</a>{/if}
								</span>
							</td>
							<td class="px-3 py-2.5 font-bold">{#if c.anon}<span style="color: var(--kk-blue)">{c.user}</span>{:else}<a style="color: var(--kk-blue)" href={articlePath(userPage(c.user, ns))}>{c.user}</a>{/if}</td>
							<td class="py-2.5 pl-3 whitespace-nowrap tabular-nums">{relativeTime(c.ts, now)}</td>
						</tr>
					{:else}
						<tr><td colspan="4" class="py-10 text-center" style="color: var(--kk-muted)">변경 내역이 없어요.</td></tr>
					{/each}
				{:catch}
					<tr><td colspan="4" class="py-10 text-center">불러오지 못했어요.</td></tr>
				{/await}
			</tbody>
		</table>
	</div>
</article>
