import { logEvents, revisionPage, type Rev, type TitleEvent } from '$lib/server/history';

export type Activity = { kind: 'edit'; ts: string; rev: Rev; parent: number | null } | { kind: 'log'; ts: string; event: TitleEvent };

export async function load({ params, url, request, isDataRequest }) {
	const title = params.title.replace(/_/g, ' ');
	const cookie = request.headers.get('cookie') ?? undefined;
	const run = Promise.all([revisionPage(title, cookie, url.searchParams.get('start')), logEvents(title, cookie)]).then(([pg, events]) => {
		const oldest = pg.revs.at(-1)?.ts ?? '';
		const items: Activity[] = [
			...pg.revs.map((rev, i): Activity => ({ kind: 'edit', ts: rev.ts, rev, parent: pg.revs[i + 1]?.id ?? null })),
			...events.filter((e) => !pg.next || e.ts >= oldest).filter((e) => !url.searchParams.get('start') || e.ts <= pg.revs[0]?.ts).map((event): Activity => ({ kind: 'log', ts: event.ts, event }))
		].sort((a, b) => b.ts.localeCompare(a.ts));
		return { items, next: pg.next, prev: pg.prev };
	});
	if (!isDataRequest) return { title, activity: await run };
	run.catch(() => {});
	return { title, activity: run };
}
