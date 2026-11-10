<script lang="ts">
	import '../app.css';
	import '@fortawesome/fontawesome-free/css/all.min.css';
	import '@fortawesome/fontawesome-free/css/v4-shims.min.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Header from '$lib/Header.svelte';
	import LoginModal from '$lib/LoginModal.svelte';
	import Sidebar from '$lib/Sidebar.svelte';
	import { refreshSession, restoreWide, ui } from '$lib/session.svelte';
	import { applyPrefs, loadPrefs, prefs } from '$lib/prefs.svelte';
	import SettingsModal from '$lib/SettingsModal.svelte';
	import SeoHead from '$lib/SeoHead.svelte';
	import { rewriteLinks } from '$lib/wikitext';
	import type { Seo } from '$lib/seo';

	let { children, data } = $props();
	$effect(() => applyPrefs());
	let tocOpen = $state(false);
	function tocJump(e: Event, anchor: string) {
		if (!(e.target as Element).closest('a')) location.hash = anchor;
		tocOpen = false;
	}
	function outsideToc(node: HTMLElement) {
		const on = (e: Event) => {
			if (!node.contains(e.target as Node) && !(e.target as Element).closest?.('[data-toc-button]')) tocOpen = false;
		};
		const key = (e: KeyboardEvent) => e.key === 'Escape' && (tocOpen = false);
		document.addEventListener('pointerdown', on);
		document.addEventListener('keydown', key);
		return { destroy: () => (document.removeEventListener('pointerdown', on), document.removeEventListener('keydown', key)) };
	}
	onMount(() => {
		loadPrefs();
		restoreWide();
		refreshSession();
	});
	const wide = $derived(false);
	let y = $state(0);
	const up = () => scrollTo({ top: 0, behavior: 'smooth' });
	const down = () => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
</script>

<SeoHead seo={(page.data.seo as Seo | undefined) ?? { title: data.site.sitename, description: '', image: null, type: 'website', path: page.url.pathname, noindex: !page.url.pathname.startsWith('/w/') && page.url.pathname !== '/' }} site={data.site} origin={data.origin} noindexAll={data.noindexAll} />
<svelte:head><title>{data.site.sitename}</title>{#if data.site.favicon}<link rel="icon" href={data.site.favicon} />{/if}</svelte:head>
<svelte:window bind:scrollY={y} />

<a href="#content" class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-(--kk-surface) focus:p-2">본문으로 건너뛰기</a>
<div class={prefs.navFixed ? 'sticky top-0 z-40' : ''}><Header sitename={data.site.sitename} navbar={data.site.navbar} ns={data.site.ns} specialNames={data.site.specialNames} /></div>
<LoginModal />
<SettingsModal />
<div class="mx-auto grid {ui.wide ? '' : 'max-w-[1400px]'} gap-4 px-0 py-4 sm:px-5 {wide || prefs.sidebar === 'vertical' ? '' : prefs.sidebar === 'left' ? 'lg:grid-cols-[19rem_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)_19rem]'}">
	<main id="content" class="min-w-0">{@render children()}</main>
	{#if !wide}
		<aside class="{prefs.sidebar === 'vertical' ? 'block px-3 sm:px-0' : 'hidden lg:block'} {prefs.sidebar === 'left' ? 'lg:order-first' : ''}"><div><Sidebar recent={data.recent} /></div></aside>
	{/if}
</div>
<footer class="mt-6 border-t" style="background: var(--kk-surface); border-color: var(--kk-line)">
	<div class="mx-auto {ui.wide ? '' : 'max-w-[1400px]'} px-4 py-5 pr-16 text-sm sm:px-5 sm:pr-16">
		<div class="flex flex-wrap items-center gap-x-5 gap-y-1">
			<span class="font-bold">{data.site.sitename}</span>
			{#each data.site.footer as f (f.href)}<a class="hover:underline" style="color: var(--kk-blue)" href={f.href} target={f.external ? '_blank' : undefined} rel={f.external ? 'noopener' : undefined}>{f.label}</a>{/each}
			{#if data.site.poweredBy}<a class="ml-auto" href={data.site.poweredBy.href} target="_blank" rel="noopener"><img class="h-[31px] w-[88px]" src={data.site.poweredBy.src} alt={data.site.poweredBy.alt} loading="lazy" /></a>{/if}
		</div>
	</div>
</footer>

{#if tocOpen && prefs.tocButton === 'popup' && ui.toc.length}
	<nav class="kk-card fixed bottom-24 z-30 max-h-[min(60dvh,calc(100dvh-8rem))] w-[min(21rem,calc(100vw-4.5rem))] overflow-auto p-5 shadow-xl" aria-label="목차 팝업" use:outsideToc style="right: {ui.wide ? '3.9rem' : 'max(3.9rem, calc(50vw - 704px))'}">
		<h2 class="mb-3 text-2xl font-extrabold">목차</h2>
		<ol class="text-[0.95rem] leading-7">
			{#each ui.toc as t (t.anchor)}
				<li style="padding-left: {(t.level - 1) * 1.1}rem"><a class="toc-num" href="#{t.anchor}" onclick={() => (tocOpen = false)}>{t.number}.</a> <span class="toc-title" role="link" tabindex="0" onclick={(e) => tocJump(e, t.anchor)} onkeydown={(e) => e.key === 'Enter' && tocJump(e, t.anchor)}>{@html rewriteLinks(t.line)}</span></li>
			{/each}
		</ol>
	</nav>
{/if}

<div class="fab" style="--fab-left: {ui.wide ? 'calc(100% - 3.25rem)' : 'min(calc(50% + 700px + 0.75rem), calc(100% - 3.25rem))'}">
	{#if ui.toc.length && prefs.tocButton !== 'disabled'}
		{#if prefs.tocButton === 'popup'}
			<button type="button" data-toc-button aria-label="목차" aria-expanded={tocOpen} onclick={() => (tocOpen = !tocOpen)}><span class="material-symbols-outlined" aria-hidden="true">format_list_bulleted</span><span class="fab-tip">목차</span></button>
		{:else}
			<a href="#toc" aria-label="목차"><span class="material-symbols-outlined" aria-hidden="true">format_list_bulleted</span><span class="fab-tip">목차</span></a>
		{/if}
	{/if}
	<button type="button" onclick={up} aria-label="맨 위로"><span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span><span class="fab-tip">맨 위로</span></button>
	<button type="button" onclick={down} aria-label="맨 아래로"><span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span><span class="fab-tip">맨 아래로</span></button>
</div>
