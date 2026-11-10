import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation';
import { setPref } from './prefs.svelte';
import { avatarFor } from './gravatar';

type Info = { loaded: boolean; id: number; name: string; anon: boolean; rights: string[]; avatar: string };
export const session = $state<Info>({ loaded: false, id: 0, name: '', anon: true, rights: [], avatar: '' });

export const ui = $state<{ loginOpen: boolean; settingsOpen: boolean; wide: boolean; toc: { anchor: string; number: string; line: string; level: number }[] }>({ loginOpen: false, settingsOpen: false, wide: false, toc: [] });

export async function api(params: Record<string, string>, post = false): Promise<any> {
	const body = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
	const res = await fetch(post ? '/api.php' : `/api.php?${body}`, post ? { method: 'POST', body, credentials: 'same-origin' } : { credentials: 'same-origin' });
	const json = await res.json();
	if (json.error) throw Object.assign(new Error(json.error.info), { code: json.error.code, data: json });
	return json;
}

export async function refreshSession() {
	if (!browser) return;
	try {
		const j = await api({ action: 'query', meta: 'userinfo', uiprop: 'rights|email' });
		const u = j.query.userinfo;
		Object.assign(session, { loaded: true, id: u.id, name: u.name, anon: !!u.anon, rights: u.rights ?? [], avatar: u.anon ? '' : await avatarFor(u.email, u.emailauthenticated) });
	} catch {
		session.loaded = true;
	}
}

export async function login(username: string, password: string): Promise<void> {
	const t = await api({ action: 'query', meta: 'tokens', type: 'login' });
	const r = await api(
		{ action: 'clientlogin', username, password, logintoken: t.query.tokens.logintoken, loginreturnurl: location.origin + '/' },
		true
	);
	const c = r.clientlogin;
	if (c.status !== 'PASS') throw new Error(c.message || '로그인에 실패했어요. (' + c.status + ')');
	await refreshSession();
	await invalidateAll();
}

export async function logout() {
	const t = await api({ action: 'query', meta: 'tokens', type: 'csrf' });
	await api({ action: 'logout', token: t.query.tokens.csrftoken }, true);
	await refreshSession();
	await invalidateAll();
}

export function toggleTheme() {
	setPref('theme', isDark() ? 'light' : 'dark');
}

export function isDark(): boolean {
	const t = document.documentElement.dataset.theme;
	return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}
export function toggleWide() {
	ui.wide = !ui.wide;
	try {
		localStorage.setItem('brio.wide', ui.wide ? '1' : '0');
	} catch {}
}
export function restoreWide() {
	try {
		ui.wide = localStorage.getItem('brio.wide') === '1';
	} catch {}
}
