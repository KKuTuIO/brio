import { loadArticle } from '$lib/server/mw';
import { loadSite } from '$lib/server/site';
import { talkOf, splitTitle } from '$lib/ns';

export async function load({ params, request, isDataRequest }) {
	const site = await loadSite();
	const subject = params.title.replace(/_/g, ' ');
	const base = splitTitle(subject, site.ns).id % 2 === 1 ? (talkOf(subject, site.ns) ?? subject) : subject;
	const talkTitle = talkOf(base, site.ns) ?? base;
	const run = loadArticle(talkTitle, request.headers.get('cookie') ?? undefined).then((t) => ({ exists: !!t, topics: (t?.sections ?? []).filter((x) => x.toclevel === 1 && !x.index.startsWith('T-')).map((x) => ({ index: x.index, title: x.line })) }));
	if (!isDataRequest) return { subject: base, talkTitle, talk: await run };
	run.catch(() => {});
	return { subject: base, talkTitle, talk: run };
}
