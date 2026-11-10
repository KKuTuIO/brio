import { prefs } from './prefs.svelte';

type Opts = { onRemovedHeading?: (anchor: string) => void };

const dec = (s: string) => {
	try {
		return decodeURIComponent(s);
	} catch {
		return s;
	}
};
const isHeading = (e: Element | null) => !!e && e.matches('.mw-heading, h2, h3, h4, h5, h6');

export function footnotes(root: HTMLElement, opts: Opts = {}) {
	const label = new Map<string, string>();
	for (const a of root.querySelectorAll<HTMLAnchorElement>('sup.reference > a[href^="#"]')) {
		const id = dec(a.getAttribute('href')!.slice(1));
		if (!label.has(id)) label.set(id, a.textContent!.replace(/\s+/g, '').trim());
	}

	const lists = [...root.querySelectorAll<HTMLElement>('ol.references')];
	let area: HTMLElement | null = null;
	if (lists.length) {
		area = document.createElement('div');
		area.className = 'fn-area';
		const wraps = new Set<Element>();
		for (const ol of lists) {
			wraps.add(ol.closest('.mw-references-wrap') ?? ol);
			for (const li of ol.querySelectorAll<HTMLElement>(':scope > li[id]')) {
				const back = li.querySelector<HTMLAnchorElement>('.mw-cite-backlink a[href^="#"]');
				const item = document.createElement('div');
				item.className = 'fn-item';
				item.id = li.id;
				const num = document.createElement('a');
				num.className = 'fn-num';
				num.href = back?.getAttribute('href') ?? '#';
				num.textContent = label.get(li.id) ?? '[•]';
				const text = document.createElement('span');
				text.className = 'fn-text';
				text.innerHTML = li.querySelector('.reference-text')?.innerHTML ?? li.innerHTML;
				item.append(num, ' ', text);
				area.append(item);
			}
		}
		for (const w of wraps) {
			const prev = w.previousElementSibling;
			w.remove();
			if (prev && isHeading(prev) && (!prev.nextElementSibling || isHeading(prev.nextElementSibling))) {
				const h = prev.matches('h2,h3,h4,h5,h6') ? prev : prev.querySelector('h2,h3,h4,h5,h6');
				const anchor = h?.id || h?.querySelector('.mw-headline')?.id;
				prev.remove();
				if (anchor) opts.onRemovedHeading?.(anchor);
			}
		}
		if (area.childElementCount) root.append(area);
		else area = null;
	}

	const pop = document.createElement('div');
	pop.className = 'fn-pop';
	pop.hidden = true;
	pop.setAttribute('role', 'tooltip');
	const sheet = document.createElement('div');
	sheet.className = 'fn-sheet';
	sheet.hidden = true;
	sheet.innerHTML = '<div class="fn-sheet-body"></div><button type="button" class="fn-sheet-close">닫기</button>';
	document.body.append(pop, sheet);
	const sheetBody = sheet.querySelector<HTMLElement>('.fn-sheet-body')!;

	const noteOf = (a: HTMLAnchorElement) => {
		const id = dec(a.getAttribute('href')!.slice(1));
		const item = document.getElementById(id);
		if (!item) return null;
		const html = item.matches('.fn-item') ? item.querySelector('.fn-text')!.innerHTML : (item.querySelector('.reference-text')?.innerHTML ?? '');
		const n = document.createElement('a');
		n.className = 'fn-num';
		n.href = '#' + id;
		n.textContent = label.get(id) ?? a.textContent!.trim();
		return { n, html };
	};
	const fill = (host: HTMLElement, a: HTMLAnchorElement) => {
		const note = noteOf(a);
		if (!note) return false;
		host.replaceChildren(note.n, ' ');
		const t = document.createElement('span');
		t.innerHTML = note.html;
		host.append(t);
		return true;
	};

	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	let lastPointer = 'mouse';
	const hidePop = () => {
		clearTimeout(hideTimer);
		pop.hidden = true;
	};
	const later = () => {
		clearTimeout(hideTimer);
		hideTimer = setTimeout(hidePop, 140);
	};
	function showPop(a: HTMLAnchorElement) {
		clearTimeout(hideTimer);
		if (!fill(pop, a)) return;
		pop.hidden = false;
		const r = a.getBoundingClientRect();
		const w = Math.min(36 * 16, innerWidth - 16);
		pop.style.width = 'auto';
		pop.style.maxWidth = w + 'px';
		const pw = pop.offsetWidth;
		const ph = pop.offsetHeight;
		const left = Math.max(8, Math.min(r.left + r.width / 2 - pw / 2, innerWidth - pw - 8));
		const above = r.top - ph - 12 >= 64;
		pop.style.left = left + 'px';
		pop.style.top = (above ? r.top - ph - 10 : r.bottom + 10) + 'px';
		pop.style.setProperty('--ax', Math.max(14, Math.min(r.left + r.width / 2 - left, pw - 14)) + 'px');
		pop.dataset.side = above ? 'top' : 'bottom';
	}
	const closeSheet = () => (sheet.hidden = true);
	const markerOf = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.<HTMLAnchorElement>('sup.reference > a[href^="#"]') ?? null;

	const onDown = (e: PointerEvent) => (lastPointer = e.pointerType);
	const onOver = (e: PointerEvent) => {
		if (e.pointerType !== 'mouse' || prefs.footnote !== 'popover') return;
		const a = markerOf(e.target);
		if (a) showPop(a);
	};
	const onOut = (e: PointerEvent) => {
		if (e.pointerType === 'mouse' && markerOf(e.target)) later();
	};
	const toggleInline = (a: HTMLAnchorElement) => {
		const host = a.closest<HTMLElement>('p, li, td, dd, div') ?? a;
		const id = a.getAttribute('href')!;
		const existing = host.nextElementSibling as HTMLElement | null;
		if (existing?.classList.contains('fn-inline') && existing.dataset.for === id) return existing.remove();
		const box = document.createElement('div');
		box.className = 'fn-inline';
		box.dataset.for = id;
		fill(box, a);
		host.after(box);
	};
	const onClick = (e: MouseEvent) => {
		const a = markerOf(e.target);
		if (!a || prefs.footnote === 'browser') return;
		if (prefs.footnote === 'expand') {
			e.preventDefault();
			return toggleInline(a);
		}
		if (prefs.footnote === 'popover' && lastPointer === 'mouse') return;
		e.preventDefault();
		hidePop();
		if (fill(sheetBody, a)) sheet.hidden = false;
	};
	const onFocusIn = (e: FocusEvent) => {
		const a = markerOf(e.target);
		if (a) showPop(a);
	};
	const onFocusOut = (e: FocusEvent) => markerOf(e.target) && later();
	const onKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			hidePop();
			closeSheet();
		}
	};
	const onSheetClick = (e: MouseEvent) => {
		const t = e.target as HTMLElement;
		if (t === sheet || t.closest('.fn-sheet-close')) closeSheet();
		else if (t.closest('.fn-num')) closeSheet();
	};

	root.addEventListener('pointerdown', onDown, true);
	root.addEventListener('pointerover', onOver);
	root.addEventListener('pointerout', onOut);
	root.addEventListener('click', onClick);
	root.addEventListener('focusin', onFocusIn);
	root.addEventListener('focusout', onFocusOut);
	pop.addEventListener('pointerenter', () => clearTimeout(hideTimer));
	pop.addEventListener('pointerleave', later);
	sheet.addEventListener('click', onSheetClick);
	document.addEventListener('keydown', onKey);
	addEventListener('scroll', hidePop, { passive: true });

	return () => {
		root.removeEventListener('pointerdown', onDown, true);
		root.removeEventListener('pointerover', onOver);
		root.removeEventListener('pointerout', onOut);
		root.removeEventListener('click', onClick);
		root.removeEventListener('focusin', onFocusIn);
		root.removeEventListener('focusout', onFocusOut);
		document.removeEventListener('keydown', onKey);
		removeEventListener('scroll', hidePop);
		clearTimeout(hideTimer);
		pop.remove();
		sheet.remove();
	};
}
