import type { Handle } from '@sveltejs/kit';
import { mwProxy } from '$lib/server/mw';
import { loadSite } from '$lib/server/site';
import { embedSrc, SKIN, toShellPath } from '$lib/mwUrl';

const PASS = /^\/(?:api|index|load|rest|opensearch_desc)\.php$|^\/(?:images|resources|extensions|skins)\//;

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;
	if (PASS.test(pathname)) {
		const dest = event.request.headers.get('sec-fetch-dest');
		const inFrame = dest === 'iframe' && event.request.headers.get('sec-fetch-site') === 'same-origin';
		const skinned = event.url.searchParams.get('useskin') === SKIN;

		if (pathname === '/index.php' && event.request.method === 'GET' && dest === 'document' && !skinned) {
			const to = toShellPath(event.url.pathname + search, event.url.origin, (await loadSite()).specialNames);
			if (to) return new Response(null, { status: 302, headers: { location: to } });
		}

		let clientIp: string | undefined;
		try {
			clientIp = event.getClientAddress();
		} catch {
		}
		const res = await mwProxy(pathname.slice(1), { method: event.request.method, headers: event.request.headers, body: event.request.body, search, clientIp });
		const headers = new Headers(res.headers);
		headers.delete('content-encoding');
		headers.delete('content-length');
		headers.delete('transfer-encoding');
		let loc = headers.get('location');
		if (loc) {
			loc = loc.replace(/^https?:\/\/[^/]+/, '');
			if (inFrame || skinned) {
				const m = loc.match(/^\/w\/([^?#]*)(\?[^#]*)?(#.*)?$/);
				if (m) loc = embedSrc(decodeURIComponent(m[1]).replace(/_/g, ' '), m[2] ?? '') + (m[3] ?? '');
				else if (loc.startsWith('/index.php?') && !/[?&]useskin=/.test(loc)) loc += (loc.includes('#') ? '' : '') + '&useskin=' + SKIN;
			}
			headers.set('location', loc);
		}
		if (inFrame) {
			headers.delete('x-frame-options');
			const csp = headers.get('content-security-policy');
			if (csp) headers.set('content-security-policy', csp.replace(/frame-ancestors[^;]*;?/gi, ''));
		}
		const out = new Headers();
		for (const [k, v] of headers) if (k !== 'set-cookie') out.append(k, v);
		for (const c of res.headers.getSetCookie()) out.append('set-cookie', c);
		if (inFrame && /text\/html/.test(out.get('content-type') ?? '')) {
			const html = (await res.text()).replace(/"wgBreakFrames":true/g, '"wgBreakFrames":false');
			return new Response(html, { status: res.status, headers: out });
		}
		return new Response(res.body, { status: res.status, headers: out });
	}
	const res = await resolve(event);
	if (event.locals.status && event.locals.status !== res.status) {
		return new Response(res.body, { status: event.locals.status, headers: res.headers });
	}
	return res;
};
