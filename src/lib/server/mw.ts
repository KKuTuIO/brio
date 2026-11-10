import { editDeniedOf } from '../editDenied';
import { env } from '$env/dynamic/private';

const origin = () => (env.MW_ORIGIN ?? 'http://127.0.0.1:8080').replace(/\/$/, '');

type Entry = { value: unknown; at: number; tag: string };
const cache = new Map<string, Entry>();
const refreshing = new Set<string>();

const FRESH_MS = 30_000;
const STALE_MS = 10 * 60_000;
const MAX_ENTRIES = 2000;

export class MwError extends Error {
	constructor(public code: string, message: string) {
		super(message);
	}
}

async function rawApi(params: Record<string, string>, cookie?: string): Promise<any> {
	const lag = Number(env.MW_DEBUG_DELAY_MS);
	if (lag > 0) await new Promise((r) => setTimeout(r, lag));
	const body = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
	const res = await fetch(`${origin()}/api.php?${body}`, {
		headers: cookie ? { cookie } : {},
		signal: AbortSignal.timeout(15_000)
	});
	if (!res.ok) throw new MwError('http' + res.status, `MediaWiki answered ${res.status}`);
	const json = await res.json();
	if (json.error) throw new MwError(json.error.code, json.error.info);
	return json;
}

export async function mwRead(params: Record<string, string>, opts: { cookie?: string; tag?: string } = {}): Promise<any> {
	if (opts.cookie && /(_session|UserID|Token)=/.test(opts.cookie)) return rawApi(params, opts.cookie);
	const key = JSON.stringify(params);
	const hit = cache.get(key);
	const age = hit ? Date.now() - hit.at : Infinity;
	if (hit && age < FRESH_MS) return hit.value;
	if (hit && age < STALE_MS) {
		if (!refreshing.has(key)) {
			refreshing.add(key);
			rawApi(params)
				.then((value) => cache.set(key, { value, at: Date.now(), tag: hit.tag }))
				.catch(() => {})
				.finally(() => refreshing.delete(key));
		}
		return hit.value;
	}
	const value = await rawApi(params);
	if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
	cache.set(key, { value, at: Date.now(), tag: opts.tag ?? '' });
	return value;
}

const htmlCache = new Map<string, { value: string; at: number }>();
export async function mwHtml(path: string): Promise<string> {
	const hit = htmlCache.get(path);
	if (hit && Date.now() - hit.at < 5 * 60_000) return hit.value;
	const res = await fetch(`${origin()}${path}`, { signal: AbortSignal.timeout(15_000), headers: { 'accept-language': 'ko' } });
	if (!res.ok) throw new MwError('http' + res.status, `MediaWiki answered ${res.status}`);
	const value = await res.text();
	htmlCache.set(path, { value, at: Date.now() });
	return value;
}

export const mwFresh = rawApi;

export function purge(tag?: string) {
	if (!tag || tag === '__site') htmlCache.clear();
	for (const [k, e] of cache) if (!tag || e.tag === tag) cache.delete(k);
}

export async function mwProxy(path: string, init: { method: string; headers: Headers; body?: BodyInit | null; search: string; clientIp?: string }) {
	const headers = new Headers();
	for (const h of ['cookie', 'content-type', 'user-agent', 'accept-language']) {
		const v = init.headers.get(h);
		if (v) headers.set(h, v);
	}
	if (init.clientIp) headers.set('x-forwarded-for', init.clientIp);
	const request: RequestInit & { duplex: 'half' } = {
		method: init.method,
		headers,
		body: init.method === 'GET' || init.method === 'HEAD' ? undefined : init.body,
		redirect: 'manual',
		duplex: 'half',
		signal: AbortSignal.timeout(30_000)
	};
	return fetch(`${origin()}/${path}${init.search}`, request);
}

export type Article = {
	title: string;
	displaytitle: string;
	pageid: number;
	revid: number;
	html: string;
	sections: import('../wikitext').Section[];
	categories: string[];
	redirectedFrom?: string;
	touched?: string;
	lastUser?: string;
	protection: string | null;
	watched: boolean;
	talkExists: boolean;
	editDenied: string | null;
};

export async function redirectTarget(title: string, cookie?: string): Promise<string | null> {
	const j = await mwRead({ action: 'query', titles: title, redirects: '1' }, { cookie, tag: title }).catch(() => null);
	return j?.query?.redirects?.[0]?.to ?? null;
}

export async function loadArticle(title: string, cookie?: string, opts: { noRedirect?: boolean; oldid?: string | null } = {}): Promise<Article | null> {
	const rd: Record<string, string> = opts.noRedirect ? {} : { redirects: '1' };
	const [parsed, info] = await Promise.all([
		mwRead(
			{ action: 'parse', ...(opts.oldid ? { oldid: opts.oldid } : { page: title, ...rd }), prop: 'text|displaytitle|categories|sections|revid|properties', disablelimitreport: '1', disabletoc: '1', useskin: 'vector-2022' },
			{ cookie, tag: title }
		).catch((e) => {
			if (e instanceof MwError && ['missingtitle', 'invalidtitle', 'pagecannotexist'].includes(e.code)) return null;
			throw e;
		}),
		mwRead({ action: 'query', titles: title, ...rd, prop: 'revisions|info', rvprop: 'timestamp|user', rvslots: 'main', inprop: 'protection|watched|talkid', intestactions: 'edit', intestactionsdetail: 'full', errorformat: 'plaintext', errorlang: 'ko' }, { cookie, tag: title }).catch(() => null)
	]);
	if (!parsed) return null;
	const p = parsed.parse;
	const page = info?.query?.pages?.[0];
	const rev = page?.revisions?.[0];
	return {
		title: p.title,
		displaytitle: p.displaytitle,
		pageid: p.pageid,
		revid: p.revid,
		html: p.text,
		sections: p.sections ?? [],
		categories: (p.categories ?? []).filter((c: any) => !c.hidden).map((c: any) => c.category),
		redirectedFrom: info?.query?.redirects?.[0]?.from,
		touched: rev?.timestamp,
		lastUser: rev?.user,
		protection: page?.protection?.find((x: any) => x.type === 'edit')?.level ?? null,
		watched: !!page?.watched,
		talkExists: !!page?.talkid,
		editDenied: editDeniedOf(page?.actions?.edit)
	};
}
