<script lang="ts">
	import { goto } from '$app/navigation';
	import { api, session } from './session.svelte';
	import { noteIcon, toNote, type Note } from './notifications';
	import { toShellPath } from './mwUrl';
	import { relativeTime } from './time';

	let { specialNames }: { specialNames: string[] } = $props();
	let open = $state(false);
	let items = $state<Note[]>([]);
	let unread = $state(0);
	let loading = $state(false);
	let now = $state(Date.now());

	async function refresh() {
		if (session.anon || !session.loaded) {
			items = [];
			unread = 0;
			return;
		}
		loading = true;
		try {
			const j = await api({ action: 'query', meta: 'notifications', notprop: 'list|count', notformat: 'flyout', notlimit: '20' });
			const n = j.query.notifications;
			items = (n.list ?? []).map(toNote);
			unread = Number(n.rawcount ?? 0);
		} catch {
			items = [];
			unread = 0;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void session.name;
		void session.loaded;
		refresh();
		const id = setInterval(() => document.visibilityState === 'visible' && refresh(), 60_000);
		return () => clearInterval(id);
	});
	$effect(() => {
		if (open) {
			now = Date.now();
			refresh();
		}
	});

	async function markRead(ids: number[] | 'all') {
		try {
			const t = await api({ action: 'query', meta: 'tokens', type: 'csrf' });
			await api({ action: 'echomarkread', ...(ids === 'all' ? { all: '1' } : { list: ids.join('|') }), token: t.query.tokens.csrftoken }, true);
		} catch {
		}
		items = items.map((n) => (ids === 'all' || ids.includes(n.id) ? { ...n, unread: false } : n));
		unread = items.filter((n) => n.unread).length;
	}

	async function openNote(n: Note) {
		open = false;
		if (n.unread) markRead([n.id]);
		if (!n.href) return;
		const to = toShellPath(n.href, location.origin, specialNames);
		if (to) await goto(to);
		else if (/^https?:/.test(n.href)) window.open(n.href, '_blank', 'noopener');
	}

	function outside(node: HTMLElement) {
		const on = (e: Event) => !node.contains(e.target as Node) && (open = false);
		const key = (e: KeyboardEvent) => e.key === 'Escape' && (open = false);
		document.addEventListener('pointerdown', on);
		document.addEventListener('keydown', key);
		return { destroy: () => (document.removeEventListener('pointerdown', on), document.removeEventListener('keydown', key)) };
	}
</script>

<div class="relative" use:outside>
	<button class="relative grid h-10 w-9 place-items-center rounded-md hover:bg-white/15 sm:w-10" aria-label={unread ? `알림 ${unread}개` : '알림'} aria-expanded={open} onclick={() => (open = !open)}>
		<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1" aria-hidden="true">notifications</span>
		{#if unread > 0}<span class="absolute top-0.5 right-0.5 grid min-w-[1.1rem] place-items-center rounded-full bg-red-500 px-1 text-[0.65rem] leading-[1.1rem] font-extrabold text-white" aria-hidden="true">{unread > 99 ? '99+' : unread}</span>{/if}
	</button>
	{#if open}
		<div class="kk-card absolute top-11 right-0 z-50 w-[min(24rem,calc(100vw-1rem))] shadow-lg" style="color: var(--kk-text)" role="dialog" aria-label="알림">
			<div class="flex items-center justify-between border-b px-4 py-2.5" style="border-color: var(--kk-line)">
				<h2 class="text-lg font-extrabold">알림</h2>
				{#if unread > 0}<button class="text-sm font-bold" style="color: var(--kk-blue)" onclick={() => markRead('all')}>모두 읽음으로 표시</button>{/if}
			</div>
			<ul class="max-h-[min(26rem,70dvh)] overflow-auto">
				{#if loading && !items.length}
					{#each [0, 1, 2] as i (i)}<li class="flex gap-3 px-4 py-3" role="status"><div class="kk-skeleton size-8 shrink-0"></div><div class="flex-1"><div class="kk-skeleton h-4 w-5/6"></div><div class="kk-skeleton mt-2 h-3 w-1/2"></div></div></li>{/each}
				{:else if !items.length}
					<li class="px-4 py-8 text-center text-sm" style="color: var(--kk-muted)">알림이 없습니다</li>
				{:else}
					{#each items as n (n.id)}
						<li class="border-b last:border-b-0" style="border-color: var(--kk-line)">
							<button class="flex w-full gap-3 px-4 py-3 text-left hover:bg-(--kk-accent-soft) {n.unread ? 'bg-(--kk-surface-2)' : ''}" onclick={() => openNote(n)}>
								<span class="relative mt-0.5 grid size-8 shrink-0 place-items-center rounded-full" style="background: var(--kk-accent-soft); color: var(--kk-accent-strong)">
									<span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">{noteIcon(n.type)}</span>
									{#if n.unread}<span class="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 bg-red-500" style="border-color: var(--kk-surface)" aria-label="읽지 않음"></span>{/if}
								</span>
								<span class="min-w-0 flex-1">
									<span class="block text-sm leading-5">{#each n.title as p}{#if p.bold}<b>{p.text}</b>{:else}{p.text}{/if}{/each}</span>
									{#if n.body}<span class="mt-0.5 line-clamp-2 block text-sm leading-5" style="color: var(--kk-muted)">{n.body}</span>{/if}
									<span class="mt-0.5 block text-xs" style="color: var(--kk-muted)">{relativeTime(new Date(n.unix * 1000).toISOString(), now)}</span>
								</span>
							</button>
						</li>
					{/each}
				{/if}
			</ul>
			<div class="border-t px-4 py-2.5 text-center" style="border-color: var(--kk-line)"><a class="text-sm font-bold" style="color: var(--kk-blue)" href="/w/Special:Notifications" onclick={() => (open = false)}>모든 알림 보기</a></div>
		</div>
	{/if}
</div>
