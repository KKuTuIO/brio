export type NavItem = { icon: string; iconFa: string | null; display: string; title: string; href: string | null; external: boolean; reload: boolean; children: NavItem[] };

const FIELDS = ['icon', 'display', 'title', 'link', 'access', 'class'];

import MATERIAL_NAMES from './materialIcons.json';

const MATERIAL = new Set<string>(MATERIAL_NAMES);
export const FALLBACK_ICON = 'link';

export type Icon = { fa: string | null; material: string };

export function iconFor(raw: string): Icon {
	const name = raw.trim().toLowerCase();
	const explicit = name.match(/^(?:material|m)[:\s-]+(.+)$/);
	if (explicit) {
		const m = explicit[1].trim().replace(/[-\s]+/g, '_');
		return { fa: null, material: MATERIAL.has(m) ? m : FALLBACK_ICON };
	}
	if (!/^[a-z0-9 _-]+$/.test(name) || !name) return { fa: null, material: FALLBACK_ICON };
	const tokens = name.split(/\s+/);
	const hasStyle = tokens.some((t) => /^fa[srbl]?$/.test(t));
	const hasName = tokens.some((t) => t.startsWith('fa-'));
	const fa = hasStyle && hasName ? tokens.join(' ') : hasName ? 'fa ' + tokens.join(' ') : 'fa fa-' + tokens.join('-');
	return { fa, material: FALLBACK_ICON };
}

export function resolveLink(link: string, specialNames: Set<string>, articlePath: (t: string) => string): Pick<NavItem, 'href' | 'external' | 'reload'> {
	const l = link.trim();
	if (!l || l === '#') return { href: null, external: false, reload: false };
	if (/^(https?:)?\/\//i.test(l)) return { href: l, external: true, reload: false };
	const i = l.indexOf(':');
	const special = i > 0 && specialNames.has(l.slice(0, i).replace(/_/g, ' ').trim().toLowerCase());
	return { href: articlePath(l.replace(/ /g, '_')), external: false, reload: special };
}

export function parseNavbar(text: string, specialNames: Set<string>, articlePath: (t: string) => string): NavItem[] {
	const out: NavItem[] = [];
	for (const raw of text.split('\n')) {
		const line = raw.replace(/\r$/, '');
		if (line[0] !== '*') continue;
		const child = line[1] === '*';
		const body = line.slice(child ? 2 : 1);
		const f: Record<string, string> = {};
		for (const part of body.split('|')) {
			const eq = part.indexOf('=');
			if (eq < 0) continue;
			const k = part.slice(0, eq).trim();
			if (FIELDS.includes(k)) f[k] = part.slice(eq + 1).trim();
		}
		if (!f.display) continue;
		const ic = iconFor(f.icon ?? '');
		const item: NavItem = { icon: ic.material, iconFa: ic.fa, display: f.display, title: f.title ?? '', ...resolveLink(f.link ?? '', specialNames, articlePath), children: [] };
		if (child) out.at(-1)?.children.push(item);
		else out.push(item);
	}
	return out;
}
