import { env } from '$env/dynamic/private';
import { mwRead } from '$lib/server/mw';
import { loadSite } from '$lib/server/site';
import { articlePath } from '$lib/wikitext';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function GET({ url }) {
	const origin = (env.SITE_ORIGIN || url.origin).replace(/\/$/, '');
	if (env.NOINDEX === '1') return new Response('', { status: 404 });
	const site = await loadSite();
	const titles: string[] = [site.mainpage];
	let cont: Record<string, string> = {};
	for (let i = 0; i < 100; i++) {
		const j = await mwRead({ action: 'query', list: 'allpages', apnamespace: '0', apfilterredir: 'nonredirects', aplimit: '500', ...cont }, { tag: '__sitemap' });
		for (const p of j.query.allpages) titles.push(p.title);
		if (!j.continue) break;
		cont = { apcontinue: j.continue.apcontinue };
	}
	const urls = [...new Set(titles)].map((t) => `<url><loc>${esc(origin + articlePath(t))}</loc></url>`).join('');
	return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
		headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' }
	});
}
