import { env } from '$env/dynamic/private';
import { mwHtml, mwRead } from './mw';
import { scrapeFooter, type FooterScrape } from '../footerHtml';
import { parseNavbar, type NavItem } from '../navbar';
import type { Namespaces } from '../ns';
import { articlePath } from '../wikitext';

export type FooterLink = { label: string; href: string; external: boolean };

export type Site = {
	server: string | null;
	sitename: string;
	mainpage: string;
	favicon: string | null;
	license: { url: string; text: string } | null;
	ns: Namespaces;
	specialNames: string[];
	navbar: NavItem[];
	footer: FooterLink[];
	disclaimer: string[];
	generator: string;
	licenseNotice: FooterScrape['copyright'];
	licenseIcon: FooterScrape['copyrightIcon'];
	poweredBy: FooterScrape['poweredBy'];
	rcNamespaces: string;
};

const FALLBACK: Site = { server: null, sitename: 'Wiki', mainpage: 'Main Page', favicon: null, license: null, ns: {}, specialNames: ['special'], navbar: [], footer: [], disclaimer: [], generator: '', licenseNotice: null, licenseIcon: null, poweredBy: null, rcNamespaces: '0' };

export async function loadSite(): Promise<Site> {
	try {
		const [info, nav, msgs] = await Promise.all([
			mwRead({ action: 'query', meta: 'siteinfo', siprop: 'general|namespaces|namespacealiases|rightsinfo' }, { tag: '__site' }),
			mwRead({ action: 'query', prop: 'revisions', titles: env.NAVBAR_PAGE || 'MediaWiki:Navbar', rvprop: 'content', rvslots: 'main' }, { tag: '__site' }).catch(() => null),
			mwRead({ action: 'query', meta: 'allmessages', ammessages: 'privacy|privacypage|aboutsite|aboutpage|disclaimers|disclaimerpage', amenableparser: '1' }, { tag: '__site' }).catch(() => null)
		]);
		const scraped = await mwHtml(`/index.php?title=${encodeURIComponent(info.query.general.mainpage)}&useskin=vector-2022`).then(scrapeFooter).catch((): FooterScrape | null => null);
		const m: Record<string, string> = {};
		for (const x of msgs?.query?.allmessages ?? []) if (x.content) m[x.name] = String(x.content).trim();
		const footer: FooterLink[] = [];
		for (const [label, page] of [['privacy', 'privacypage'], ['aboutsite', 'aboutpage'], ['disclaimers', 'disclaimerpage']]) {
			const text = m[label];
			const target = m[page];
			if (!text || !target || text === '-' || target === '-') continue;
			const external = /^(https?:)?\/\//.test(target);
			footer.push({ label: text, href: external ? target : articlePath(target.replace(/ /g, '_')), external });
		}
		if (scraped?.places.length) {
			footer.length = 0;
			for (const pl of scraped.places) footer.push({ label: pl.label, href: pl.href, external: /^(https?:)?\/\//.test(pl.href) });
		}
		const disclaimerTarget = m['disclaimerpage'];
		const disclaimer = disclaimerTarget && disclaimerTarget !== '-' && !/^(https?:)?\/\//.test(disclaimerTarget) ? await disclaimerText(disclaimerTarget) : [];
		const q = info.query;
		const ns: Namespaces = {};
		for (const [k, v] of Object.entries<any>(q.namespaces)) ns[k] = { id: v.id, name: v.name, canonical: v.canonical };
		const special = new Set<string>(['special']);
		if (ns['-1']) {
			special.add(ns['-1'].name.toLowerCase());
			if (ns['-1'].canonical) special.add(ns['-1'].canonical.toLowerCase());
		}
		for (const a of q.namespacealiases ?? []) if (a.id === -1) special.add(String(a.alias).toLowerCase());
		const text: string = nav?.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content ?? '';
		const g = q.general;
		return {
			server: g.server ?? null,
			sitename: g.sitename,
			mainpage: env.MAIN_PAGE || g.mainpage,
			favicon: g.favicon ?? null,
			license: q.rightsinfo?.url ? { url: q.rightsinfo.url, text: q.rightsinfo.text } : null,
			ns,
			specialNames: [...special],
			navbar: parseNavbar(text, special, articlePath),
			footer,
			disclaimer,
			generator: String(q.general.generator ?? ''),
			licenseNotice: scraped?.copyright ?? null,
			licenseIcon: scraped?.copyrightIcon ?? null,
			poweredBy: scraped?.poweredBy ?? null,
			rcNamespaces: env.RC_NAMESPACES || '0|4|10|12|14'
		};
	} catch {
		return FALLBACK;
	}
}

export async function isSpecialTitle(title: string): Promise<boolean> {
	const i = title.indexOf(':');
	if (i < 1) return false;
	return (await loadSite()).specialNames.includes(title.slice(0, i).replace(/_/g, ' ').trim().toLowerCase());
}

const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#160;': ' ', '&nbsp;': ' ' };
async function disclaimerText(title: string): Promise<string[]> {
	try {
		const j = await mwRead({ action: 'parse', page: title, prop: 'text', disablelimitreport: '1', disableeditsection: '1', disabletoc: '1' }, { tag: '__site' });
		const html: string = j.parse.text;
		const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
			.map((x) => x[1].replace(/<[^>]+>/g, '').replace(/&#?\w+;/g, (e) => entities[e] ?? e).replace(/\s+/g, ' ').trim())
			.filter(Boolean);
		return paras.slice(0, 2);
	} catch {
		return [];
	}
}
