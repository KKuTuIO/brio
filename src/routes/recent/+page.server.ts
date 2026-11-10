import { mwRead } from '$lib/server/mw';
import { loadSite } from '$lib/server/site';

import { TABS, type Change } from '$lib/recent';

export async function load({ url, request, isDataRequest }) {
	const type = TABS.find((t) => t.key === url.searchParams.get('logtype'))?.key ?? 'all';
	const talk = url.searchParams.get('talk') === '1';
	const site = await loadSite();
	const params: Record<string, string> = {
		action: 'query', list: 'recentchanges', rclimit: '100', rcprop: 'title|user|comment|timestamp|sizes|ids|loginfo|tags', rcshow: '!bot'
	};
	if (type === 'create') params.rctype = 'new';
	else if (type === 'delete' || type === 'move') Object.assign(params, { rctype: 'log' });
	else if (type === 'revert') Object.assign(params, { rctype: 'edit', rctag: 'mw-undo' });
	else params.rctype = 'edit|new|log';
	if (talk) params.rcnamespace = Object.values(site.ns).filter((n) => n.id > 0 && n.id % 2 === 1).map((n) => n.id).join('|');
	const run = mwRead(params, { cookie: request.headers.get('cookie') ?? undefined, tag: '__recent' }).then((j) =>
		(j.query.recentchanges as any[])
			.filter((c) => (type === 'delete' ? c.logtype === 'delete' : type === 'move' ? c.logtype === 'move' : true))
			.map((c): Change => ({
				title: c.title, user: c.user ?? '', anon: !!c.anon, comment: c.comment ?? '', ts: c.timestamp, revid: c.revid ?? 0, old_revid: c.old_revid ?? 0,
				delta: c.type === 'log' ? null : (c.newlen ?? 0) - (c.oldlen ?? 0),
				kind: c.type === 'new' ? 'new' : c.type === 'log' ? (c.logtype === 'delete' ? 'delete' : c.logtype === 'move' ? 'move' : 'log') : 'edit', logtype: c.logtype
			}))
	);
	if (!isDataRequest) return { type, talk, changes: await run };
	run.catch(() => {});
	return { type, talk, changes: run };
}
