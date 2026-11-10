import { env } from '$env/dynamic/private';
import { mwRead } from '$lib/server/mw';
import { loadSite } from '$lib/server/site';

export async function load({ request, url }) {
	const site = await loadSite();
	const recent = mwRead(
		{ action: 'query', list: 'recentchanges', rclimit: '10', rcprop: 'title|timestamp', rctype: 'edit|new', rcshow: '!bot', rcnamespace: site.rcNamespaces },
		{ cookie: request.headers.get('cookie') ?? undefined, tag: '__recent' }
	).then((j) => j.query.recentchanges.map((c: any) => ({ title: c.title as string, ts: c.timestamp as string })));
	recent.catch(() => {});
	return { site, recent, origin: (env.SITE_ORIGIN || url.origin).replace(/\/$/, ''), noindexAll: env.NOINDEX === '1' };
}
