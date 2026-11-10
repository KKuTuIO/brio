import { prefs } from './prefs.svelte';

export function headings(root: HTMLElement) {
	for (const h of root.querySelectorAll<HTMLElement>('h2,h3,h4,h5,h6')) {
		if (h.closest('.mw-heading') || h.closest('table,.thumb,.toc,#toc')) continue;
		const w = document.createElement('div');
		w.className = `mw-heading mw-heading${h.tagName[1]}`;
		h.replaceWith(w);
		w.append(h);
	}
	const wraps = [...root.querySelectorAll<HTMLElement>('.mw-heading')].filter((w) => /^H[2-6]$/.test(w.querySelector('h2,h3,h4,h5,h6')?.tagName ?? ''));
	const counters = [0, 0, 0, 0, 0, 0];
	const levelOf = (w: HTMLElement) => Number(w.querySelector('h2,h3,h4,h5,h6')!.tagName[1]);
	for (const w of wraps) {
		const lvl = levelOf(w);
		counters[lvl - 2]++;
		for (let i = lvl - 1; i < counters.length; i++) counters[i] = 0;
		const num = counters.slice(0, lvl - 1).join('.') + '.';
		const h = w.querySelector('h2,h3,h4,h5,h6')!;
		if (h.querySelector('.hnum')) continue;
		const a = document.createElement('a');
		a.className = 'hnum';
		a.textContent = num + ' ';
		a.href = '#toc';
		h.prepend(a);
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'hfold material-symbols-outlined';
		btn.setAttribute('aria-label', '문단 접기/펼치기');
		btn.setAttribute('aria-expanded', 'true');
		btn.textContent = 'expand_more';
		w.prepend(btn);
		btn.addEventListener('click', () => {
			const open = btn.getAttribute('aria-expanded') === 'true';
			btn.setAttribute('aria-expanded', String(!open));
			btn.textContent = open ? 'chevron_right' : 'expand_more';
			let n = w.nextElementSibling as HTMLElement | null;
			while (n) {
				if (n.classList.contains('mw-heading') && levelOf(n) <= lvl) break;
				n.hidden = open;
				n = n.nextElementSibling as HTMLElement | null;
			}
		});
	}
	if (prefs.headingFold === 'fold') for (const b of root.querySelectorAll<HTMLButtonElement>('.hfold')) if (b.closest('.mw-heading')?.querySelector('h2')) b.click();
}

export function headingMarkup(root: HTMLElement, anchors: string[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (const anchor of anchors) {
		const el = root.querySelector<HTMLElement>(`[id="${anchor.replace(/"/g, '\\"')}"]`);
		const h = el?.closest('h1,h2,h3,h4,h5,h6') ?? el;
		if (!h) continue;
		const copy = h.cloneNode(true) as HTMLElement;
		copy.querySelectorAll('.mw-editsection, .hnum, .hfold, button, script, style, .mw-headline-anchor').forEach((n) => n.remove());
		const html = copy.innerHTML.trim();
		if (html && /<a\b/i.test(html)) out[anchor] = html;
	}
	return out;
}
