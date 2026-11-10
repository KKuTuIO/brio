import { articlePath, editPath } from './wikitext';

const enc = encodeURIComponent;
export const SKIN = 'monobook';

export function embedSrc(title: string, search = ''): string {
	const q = new URLSearchParams(search);
	q.set('title', title);
	q.set('useskin', SKIN);
	q.delete('redirect');
	return '/index.php?' + q;
}

export function embedFrom(indexUrl: string): string | null {
	if (!indexUrl.startsWith('/index.php?')) return null;
	const q = new URLSearchParams(indexUrl.slice('/index.php?'.length));
	if (!q.get('title')) return null;
	q.set('useskin', SKIN);
	return '/index.php?' + q;
}

export const wrapperPath = (indexUrl: string) => '/mw?src=' + enc(indexUrl);

export function toShellPath(href: string, origin: string, specialNames: string[]): string | null {
	let u: URL;
	try {
		u = new URL(href, origin + '/');
	} catch {
		return null;
	}
	if (u.origin !== origin) return null;
	const isSpecial = (t: string) => {
		const i = t.indexOf(':');
		return i > 0 && specialNames.includes(t.slice(0, i).replace(/_/g, ' ').trim().toLowerCase());
	};
	if (u.pathname.startsWith('/w/')) return u.pathname + (u.search.replace(/[?&]useskin=[^&]*/g, '').replace(/^&/, '?') || '') + u.hash;
	if (u.pathname !== '/index.php') return null;
	const q = new URLSearchParams(u.search);
	q.delete('useskin');
	const title = q.get('title');
	if (!title) return null;
	const action = q.get('action');
	if (action === 'raw' || action === 'render') return null;
	q.delete('title');
	if (action === 'edit' && !q.get('undo') && !q.get('undoafter')) {
		const section = q.get('section');
		return editPath(title, section);
	}
	if (action === 'history') return '/history/' + enc(title.replace(/ /g, '_'));
	if (q.get('oldid') && !action && !q.get('diff')) return articlePath(title) + '?rev=' + q.get('oldid') + u.hash;
	if (!action && !q.get('diff') && !q.get('oldid')) {
		const rest = q.toString();
		return articlePath(title) + (rest ? '?' + rest : '') + u.hash;
	}
	if (isSpecial(title) && !action) return articlePath(title) + (q.toString() ? '?' + q : '') + u.hash;
	return wrapperPath('/index.php?' + new URLSearchParams({ title, ...Object.fromEntries(q) })) + u.hash;
}
