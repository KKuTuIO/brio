import { prefs } from './prefs.svelte';

export const FOLD_MS = 100;

function wrapTable(table: HTMLTableElement): { fold: HTMLElement; body: HTMLElement } | null {
	const rows = [...table.rows];
	if (rows.length < 2) return null;
	const classes = [...table.classList].filter((c) => c !== 'mw-collapsible' && c !== 'mw-collapsed').join(' ');
	const make = (rs: HTMLTableRowElement[], caption?: HTMLElement | null) => {
		const t = document.createElement('table');
		t.className = classes;
		t.style.cssText = 'width:100%;border:0;margin:0';
		const tb = document.createElement('tbody');
		tb.append(...rs);
		if (caption) t.append(caption);
		t.append(tb);
		return t;
	};
	const fold = document.createElement('div');
	fold.className = 'brio-fold';
	fold.style.cssText = table.getAttribute('style') ?? '';
	const body = document.createElement('div');
	body.className = 'brio-fold-body';
	body.append(make(rows.slice(1)));
	fold.append(make([rows[0]], table.caption), document.createElement('span'), body);
	table.replaceWith(fold);
	return { fold, body };
}

function wrapBlock(el: HTMLElement): { fold: HTMLElement; body: HTMLElement } {
	el.classList.remove('mw-collapsible', 'mw-collapsed');
	el.classList.add('brio-fold');
	const content = el.querySelector<HTMLElement>(':scope > .mw-collapsible-content');
	const body = document.createElement('div');
	body.className = 'brio-fold-body';
	if (content) {
		content.replaceWith(body);
		body.append(content);
	} else {
		body.append(...el.childNodes);
		el.append(body);
	}
	return { fold: el, body };
}

export function collapsibles(root: HTMLElement): () => void {
	const undo: (() => void)[] = [];
	for (const el of [...root.querySelectorAll<HTMLElement>('.mw-collapsible')]) {
		if (!el.isConnected || el.closest('.brio-fold-bar')) continue;
		const startsFolded = el.classList.contains('mw-collapsed') && !prefs.unfoldCollapsible;
		const label = el.dataset.collapsetext || el.dataset.expandtext || '펼치기 · 접기';
		const parts = el instanceof HTMLTableElement ? wrapTable(el) : wrapBlock(el);
		if (!parts) continue;
		const { fold, body } = parts;

		const bar = document.createElement('button');
		bar.type = 'button';
		bar.className = 'brio-fold-bar';
		bar.textContent = `[ ${label} ]`;
		const placeholder = fold.querySelector(':scope > span:empty');
		if (placeholder) placeholder.replaceWith(bar);
		else fold.insertBefore(bar, body);

		let open = !startsFolded;
		let anim: Animation | null = null;
		bar.setAttribute('aria-expanded', String(open));
		if (!open) body.style.display = 'none';

		const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : FOLD_MS;
		const toggle = () => {
			open = !open;
			bar.setAttribute('aria-expanded', String(open));
			anim?.cancel();
			if (open) {
				body.style.display = '';
				const full = body.scrollHeight;
				anim = body.animate([{ height: '0px' }, { height: full + 'px' }], { duration, easing: 'linear' });
				anim.onfinish = () => (anim = null);
			} else {
				const full = body.offsetHeight;
				anim = body.animate([{ height: full + 'px' }, { height: '0px' }], { duration, easing: 'linear', fill: 'forwards' });
				anim.onfinish = () => {
					body.style.display = 'none';
					anim?.cancel();
					anim = null;
				};
			}
		};
		bar.addEventListener('click', toggle);
		undo.push(() => {
			bar.removeEventListener('click', toggle);
			anim?.cancel();
		});
	}
	return () => undo.forEach((u) => u());
}

export function placeToc(body: HTMLElement, toc: HTMLElement) {
	const root = body.querySelector<HTMLElement>(':scope > .mw-parser-output') ?? body;
	root.querySelectorAll(':scope > .toc-clear').forEach((n) => n.remove());
	const clear = document.createElement('div');
	clear.className = 'toc-clear';
	const firstSection = root.querySelector<HTMLElement>(':scope > .mw-heading, :scope > h2, :scope > h3');
	if (firstSection) {
		root.insertBefore(toc, firstSection);
		root.insertBefore(clear, firstSection);
	} else {
		root.prepend(clear);
		root.prepend(toc);
	}
}

export function foldToc(box: HTMLElement, toFolded: boolean): void {
	const was = box.classList.contains('toc-folded');
	if (was === toFolded) return;
	box.getAnimations().forEach((a) => a.cancel());
	const from = box.getBoundingClientRect();
	box.classList.toggle('toc-folded', toFolded);
	const to = box.getBoundingClientRect();
	box.classList.toggle('toc-folded', was);
	const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : FOLD_MS;
	box.style.overflow = 'hidden';
	const anim = box.animate([{ width: from.width + 'px', height: from.height + 'px' }, { width: to.width + 'px', height: to.height + 'px' }], { duration, easing: 'linear' });
	const done = () => {
		box.classList.toggle('toc-folded', toFolded);
		box.style.overflow = '';
	};
	anim.onfinish = done;
	anim.oncancel = () => (box.style.overflow = '');
}
