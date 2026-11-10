import { mwRead } from '$lib/server/mw';
import { loadSite } from '$lib/server/site';

export type Backlink = { title: string; redirect: boolean; ns: number };

export async function load({ params, request, isDataRequest }) {
	const title = params.title.replace(/_/g, ' ');
	const site = await loadSite();
	const run = mwRead({ action: 'query', list: 'backlinks', bltitle: title, bllimit: '500', blredirect: '1' }, { cookie: request.headers.get('cookie') ?? undefined, tag: title }).then((j) =>
		(j.query.backlinks as any[]).map((b): Backlink => ({ title: b.title, redirect: !!b.redirect, ns: b.ns }))
	);
	if (!isDataRequest) return { title, links: await run, site };
	run.catch(() => {});
	return { title, links: run };
}
