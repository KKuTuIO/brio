import { mwRead, MwError } from '$lib/server/mw';

export type Diff = { fromrev: number; torev: number; fromuser: string; touser: string; fromtimestamp: string; totimestamp: string; tocomment: string; html: string };

export async function load({ params, url, request, isDataRequest }) {
	const title = params.title.replace(/_/g, ' ');
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to') ?? url.searchParams.get('rev');
	const cookie = request.headers.get('cookie') ?? undefined;
	const query = async (): Promise<Record<string, string>> => {
		const base = { action: 'compare', prop: 'diff|ids|user|comment|timestamp|title', difftype: 'table' };
		if (from && to) return { ...base, fromrev: from, torev: to };
		if (to) {
			const r = await mwRead({ action: 'query', prop: 'revisions', revids: to, rvprop: 'ids' }, { cookie, tag: title });
			const parent = r.query.pages?.[0]?.revisions?.[0]?.parentid ?? 0;
			return parent ? { ...base, fromrev: String(parent), torev: to } : { ...base, fromslots: 'main', 'fromtext-main': '', 'fromcontentmodel-main': 'wikitext', torev: to };
		}
		return { ...base, fromtitle: title, totitle: title };
	};
	const run = query()
		.then((q) => mwRead(q, { cookie, tag: title }))
		.then((j) => {
			const c = j.compare;
			return { fromrev: c.fromrevid ?? 0, torev: c.torevid ?? 0, fromuser: c.fromuser ?? '', touser: c.touser ?? '', fromtimestamp: c.fromtimestamp ?? '', totimestamp: c.totimestamp ?? '', tocomment: c.tocomment ?? '', html: c.body ?? '' } as Diff;
		})
		.catch((e) => {
			if (e instanceof MwError) return null;
			throw e;
		});
	if (!isDataRequest) return { title, diff: await run };
	run.catch(() => {});
	return { title, diff: run };
}
