import { mwRead } from './mw';

export type Rev = { id: number; seq: number; short: string; ts: string; user: string; anon: boolean; comment: string; delta: number; minor: boolean; hidden: boolean };
export type RevPage = { revs: Rev[]; next: string | null; prev: string | null | undefined; total: number };

export const PAGE = 50;

export async function sequence(title: string, cookie?: string): Promise<Map<number, number>> {
	const ids: number[] = [];
	let cont: Record<string, string> = {};
	for (let i = 0; i < 20; i++) {
		const j = await mwRead({ action: 'query', prop: 'revisions', titles: title, rvprop: 'ids', rvlimit: 'max', rvdir: 'newer', ...cont }, { cookie, tag: title });
		for (const r of j.query.pages?.[0]?.revisions ?? []) ids.push(r.revid);
		if (!j.continue) break;
		cont = { rvcontinue: j.continue.rvcontinue };
	}
	return new Map(ids.map((id, i) => [id, i + 1]));
}

export async function revisionPage(title: string, cookie: string | undefined, start?: string | null): Promise<RevPage> {
	const [seq, j] = await Promise.all([
		sequence(title, cookie),
		mwRead({ action: 'query', prop: 'revisions', titles: title, rvprop: 'ids|timestamp|user|comment|size|sha1|flags', rvlimit: String(PAGE + 1), ...(start ? { rvstartid: start } : {}) }, { cookie, tag: title })
	]);
	const raw: any[] = j.query.pages?.[0]?.revisions ?? [];
	const revs = raw.slice(0, PAGE).map((r, i): Rev => ({
		id: r.revid, seq: seq.get(r.revid) ?? 0, short: (r.sha1 ?? '').slice(0, 8), ts: r.timestamp, user: r.user ?? '', anon: !!r.anon, comment: r.comment ?? '',
		delta: (r.size ?? 0) - (raw[i + 1]?.size ?? 0), minor: !!r.minor, hidden: !!r.userhidden
	}));
	const next = raw.length > PAGE ? String(raw[PAGE].revid) : null;
	let prev: string | null | undefined;
	if (start) {
		const k = await mwRead({ action: 'query', prop: 'revisions', titles: title, rvprop: 'ids', rvlimit: String(PAGE + 1), rvdir: 'newer', rvstartid: start }, { cookie, tag: title });
		const newer: any[] = k.query.pages?.[0]?.revisions ?? [];
		prev = newer.length > PAGE ? String(newer[PAGE].revid) : null;
	}
	return { revs, next, prev, total: seq.size };
}

export type TitleEvent = { kind: 'create' | 'move' | 'delete' | 'restore' | 'protect' | 'other'; ts: string; user: string; anon: boolean; comment: string; target: string; revid: number; short: string; current: boolean };

export async function logEvents(title: string, cookie?: string, types?: string[]): Promise<TitleEvent[]> {
	const j = await mwRead({ action: 'query', list: 'logevents', letitle: title, lelimit: '100', leprop: 'ids|type|user|timestamp|comment|details|title' }, { cookie, tag: title });
	return (j.query.logevents as any[])
		.filter((e) => !types || types.includes(e.type))
		.map((e): TitleEvent => ({
			kind: e.type === 'move' ? 'move' : e.type === 'delete' ? (e.action === 'restore' ? 'restore' : 'delete') : e.type === 'protect' ? 'protect' : 'other',
			ts: e.timestamp, user: e.user ?? '', anon: !!e.anon, comment: e.comment ?? '', target: e.params?.target_title ?? '', revid: 0, short: String(e.logid ?? ''), current: false
		}));
}

export async function firstRevision(title: string, cookie?: string): Promise<(Rev & { exists: boolean }) | null> {
	const j = await mwRead({ action: 'query', prop: 'revisions', titles: title, rvprop: 'ids|timestamp|user|comment|size|sha1', rvlimit: '1', rvdir: 'newer' }, { cookie, tag: title });
	const p = j.query.pages?.[0];
	const r = p?.revisions?.[0];
	if (!r) return null;
	return { id: r.revid, seq: 1, short: (r.sha1 ?? '').slice(0, 8), ts: r.timestamp, user: r.user ?? '', anon: !!r.anon, comment: r.comment ?? '', delta: r.size ?? 0, minor: false, hidden: false, exists: !p.missing };
}
