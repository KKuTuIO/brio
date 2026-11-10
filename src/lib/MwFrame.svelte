<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { SKIN, toShellPath } from './mwUrl';

	let { src, specialNames, ontitle }: { src: string; specialNames: string[]; ontitle?: (t: string) => void } = $props();
	let frame: HTMLIFrameElement | undefined = $state();
	let loaded = $state(false);
	let height = $state(360);
	let cleanup: (() => void) | undefined;

	const VARS = ['--kk-bg', '--kk-surface', '--kk-surface-2', '--kk-line', '--kk-line-strong', '--kk-text', '--kk-muted', '--kk-accent', '--kk-accent-strong', '--kk-accent-soft', '--kk-fill', '--kk-fill-edge', '--kk-warn', '--kk-warn-soft', '--kk-danger', '--kk-danger-soft', '--kk-blue', '--kk-red-link', '--font-body', '--font-mono'];
	function syncTheme(doc: Document) {
		const cs = getComputedStyle(document.documentElement);
		const root = doc.documentElement;
		for (const v of VARS) root.style.setProperty(v, cs.getPropertyValue(v));
		root.style.colorScheme = cs.colorScheme || 'light';
	}

	function prepare() {
		cleanup?.();
		const doc = frame?.contentDocument;
		if (!doc || !doc.body) return;
		if (!doc.getElementById('brio-embed-css')) {
			const l = doc.createElement('link');
			l.id = 'brio-embed-css';
			l.rel = 'stylesheet';
			l.href = '/embed.css';
			doc.head.append(l);
		}
		doc.documentElement.classList.add('brio-embed');
		syncTheme(doc);
		const mo = new MutationObserver(() => syncTheme(doc));
		mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-black', 'data-font'] });
		const heading = doc.getElementById('firstHeading')?.textContent?.trim() || doc.title.replace(/\s*[-–|].*$/, '');
		if (heading) ontitle?.(heading);

		const origin = location.origin;
		const onClick = (e: MouseEvent) => {
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
			const a = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
			if (!a) return;
			const raw = a.getAttribute('href')!;
			if (raw.startsWith('#') || raw.startsWith('javascript:') || a.hasAttribute('download')) return;
			const to = toShellPath(a.href, origin, specialNames);
			if (to) {
				e.preventDefault();
				goto(to);
			} else if (a.origin !== origin || /action=(raw|render)/.test(a.search)) {
				a.target = '_blank';
				a.rel = 'noopener';
			}
		};
		const onSubmit = (e: SubmitEvent) => {
			const form = e.target as HTMLFormElement;
			const action = new URL(form.getAttribute('action') || doc.location.href, doc.location.href);
			if ((form.method || 'get').toLowerCase() === 'get') {
				const data = new FormData(form);
				for (const [k, v] of data) if (typeof v === 'string') action.searchParams.set(k, v);
				const to = toShellPath(action.href, origin, specialNames);
				if (to) {
					e.preventDefault();
					goto(to);
				}
			} else if (action.pathname === '/index.php' && !action.searchParams.has('useskin')) {
				action.searchParams.set('useskin', SKIN);
				form.action = action.pathname + action.search;
			}
		};
		doc.addEventListener('click', onClick, true);
		doc.addEventListener('submit', onSubmit, true);
		const fit = () => (height = Math.max(240, doc.documentElement.scrollHeight));
		const ro = new ResizeObserver(fit);
		ro.observe(doc.body);
		fit();
		loaded = true;
		cleanup = () => {
			mo.disconnect();
			ro.disconnect();
			doc.removeEventListener('click', onClick, true);
			doc.removeEventListener('submit', onSubmit, true);
		};
	}
	onMount(() => () => cleanup?.());
	$effect(() => {
		void src;
		loaded = false;
	});
</script>

{#if !loaded}
	<div class="flex flex-col gap-3" role="status" aria-label="불러오는 중">
		<div class="kk-skeleton h-8 w-1/2"></div>
		{#each [95, 80, 90, 60] as w}<div class="kk-skeleton h-5" style="width: {w}%"></div>{/each}
	</div>
{/if}

<iframe bind:this={frame} {src} title="위키 화면" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads" class="w-full border-0 {loaded ? '' : 'absolute h-0 w-0 opacity-0'}" style={loaded ? `height: ${height}px` : ''} onload={prepare}></iframe>
