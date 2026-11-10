<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from './session.svelte';
	import { articlePath } from './wikitext';

	let { variant }: { variant: 'desktop' | 'mobile' } = $props();
	let q = $state('');
	let items = $state<string[]>([]);
	let open = $state(false);
	let active = $state(-1);
	let seq = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	function typed() {
		clearTimeout(timer);
		active = -1;
		const v = q.trim();
		if (!v) {
			items = [];
			open = false;
			return;
		}
		const my = ++seq;
		timer = setTimeout(async () => {
			try {
				const r = await api({ action: 'opensearch', search: v, limit: '8', namespace: '*' });
				if (my === seq) {
					items = r[1] ?? [];
					open = items.length > 0;
				}
			} catch {
			}
		}, 150);
	}
	function go(title?: string) {
		open = false;
		const v = (title ?? q).trim();
		if (v) goto(articlePath(v));
	}
	function search() {
		open = false;
		const v = q.trim();
		if (v) goto('/search?q=' + encodeURIComponent(v));
	}
	function submit(e: SubmitEvent) {
		e.preventDefault();
		go(active >= 0 ? items[active] : undefined);
	}
	function key(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' && items.length) {
			e.preventDefault();
			open = true;
			active = (active + 1) % items.length;
		} else if (e.key === 'ArrowUp' && items.length) {
			e.preventDefault();
			active = (active - 1 + items.length) % items.length;
		} else if (e.key === 'Escape') open = false;
	}
	function outside(node: HTMLElement) {
		const on = (e: Event) => !node.contains(e.target as Node) && (open = false);
		document.addEventListener('pointerdown', on);
		return { destroy: () => document.removeEventListener('pointerdown', on) };
	}
</script>

<form onsubmit={submit} role="search" use:outside style="background: var(--nm-field); color: var(--nm-field-text)" class={variant === 'desktop' ? 'relative hidden h-9 min-w-0 items-center rounded-md px-2 sm:flex sm:w-56 lg:w-72' : 'relative flex h-11 items-center border-t border-white/20 sm:hidden'}>
	{#if variant === 'mobile'}
		<a href="/random" class="grid h-full w-11 place-items-center border-r" style="border-color: var(--nm-field-line)" aria-label="아무 문서로 이동"><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">shuffle</span></a>
	{/if}
	<input
		class="h-full min-w-0 flex-1 bg-transparent {variant === 'mobile' ? 'px-3 text-base' : 'px-1 text-sm'} outline-none placeholder:opacity-60 placeholder:text-current"
		type="search" placeholder="여기에서 검색" aria-label="문서 검색" autocomplete="off" role="combobox" aria-expanded={open} aria-controls="suggest-{variant}" aria-autocomplete="list"
		bind:value={q} oninput={typed} onkeydown={key} onfocus={() => items.length && (open = true)}
	/>
	<button type="button" onclick={search} class="grid h-7 w-7 place-items-center opacity-80 {variant === 'mobile' ? 'h-full w-11' : ''}" aria-label="검색"><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">search</span></button>
	{#if variant === 'desktop'}<button class="grid h-7 w-7 place-items-center opacity-80" aria-label="이동"><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">arrow_forward</span></button>{/if}
	{#if open}
		<ul id="suggest-{variant}" role="listbox" class="absolute top-full right-0 left-0 z-50 overflow-hidden rounded-b-md border py-1 text-sm shadow-lg" style="background: var(--nm-field); color: var(--nm-field-text); border-color: var(--nm-field-line)">
			{#each items as t, i (t)}
				<li role="option" aria-selected={i === active}>
					<button type="button" class="block w-full truncate px-3 py-1.5 text-left hover:bg-(--kk-accent-soft) {i === active ? 'bg-(--kk-accent-soft)' : ''}" onclick={() => go(t)}>{t}</button>
				</li>
			{/each}
		</ul>
	{/if}
</form>
