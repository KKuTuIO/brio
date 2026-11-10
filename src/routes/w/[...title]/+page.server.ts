import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { loadArticle, mwRead, redirectTarget } from '$lib/server/mw';
import { isSpecialTitle, loadSite } from '$lib/server/site';
import { splitTitle } from '$lib/ns';
import { articlePath } from '$lib/wikitext';
import { embedSrc } from '$lib/mwUrl';
import { loadFile } from '$lib/server/files';
import { descriptionOf, firstImage, type Seo } from '$lib/seo';

export type Members = { subcats: string[]; pages: string[]; files: string[]; total: number };
export type Reroute = { to: string; hard: boolean } | null;

export async function load({ params, request, url, locals, isDataRequest, setHeaders }) {
	const title = params.title.replace(/_/g, ' ');
	const cookie = request.headers.get('cookie') ?? undefined;
	const noRedirect = url.searchParams.get('redirect') === 'no';
	setHeaders({ 'cache-control': 'private, no-cache' });

	const siteP = loadSite();
	const embed: Promise<string | null> = isSpecialTitle(title).then((special) => (special ? embedSrc(title, url.search) : null));
	const reroute: Promise<Reroute> = (async () => {
		const target = noRedirect ? null : await redirectTarget(title, cookie);
		return target ? { to: `${articlePath(target)}?from=${encodeURIComponent(title)}`, hard: false } : null;
	})();
	const rev = url.searchParams.get('rev');
	const article = loadArticle(title, cookie, { noRedirect, oldid: rev });
	const members: Promise<Members | null> = siteP.then((site) =>
		splitTitle(title, site.ns).id === 14
			? mwRead({ action: 'query', list: 'categorymembers', cmtitle: title, cmlimit: '500', cmprop: 'title|type', cmsort: 'sortkey' }, { cookie, tag: title }).then((j) => {
					const m: any[] = j.query.categorymembers;
					return { subcats: m.filter((x) => x.type === 'subcat').map((x) => x.title), pages: m.filter((x) => x.type === 'page').map((x) => x.title), files: m.filter((x) => x.type === 'file').map((x) => x.title), total: m.length };
				})
			: null
	);
	const file = siteP.then((site) => (splitTitle(title, site.ns).id === 6 ? loadFile(title, cookie, site.server) : null));
	const from = url.searchParams.get('from');
	for (const p of [article, members, reroute, embed, file]) p.catch(() => {});

	if (!isDataRequest) {
		const e = await embed;
		if (e) return { title, article: null, members: null, from, rev, embed: e, reroute: null as Reroute, file: null, seo: { title, description: '', image: null, type: 'website', path: articlePath(title), noindex: true } as Seo };
		const r = await reroute;
		if (r) redirect(302, r.to);
		const [a, m] = await Promise.all([article, members]);
		if (!a && !m?.total) locals.status = 404;
		const origin = (env.SITE_ORIGIN || url.origin).replace(/\/$/, '');
		const site = await siteP;
		const seo: Seo = a
			? { title: `${a.title} - ${site.sitename}`, description: descriptionOf(a.html), image: firstImage(a.html, origin), type: 'article', path: articlePath(a.title), modified: a.touched, noindex: !!rev || url.searchParams.has('from') ? true : false }
			: { title: `${title} - ${site.sitename}`, description: '', image: null, type: 'website', path: articlePath(title), noindex: true };
		return { title, article: a, members: m, from, rev, embed: null as string | null, reroute: null as Reroute, file: await file.catch(() => null), seo };
	}
	return { title, article, members, from, rev, embed, reroute, file };
}
