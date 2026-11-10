export type FooterScrape = {
	copyright: { before: string; label: string; href: string; after: string } | null;
	copyrightIcon: { src: string; alt: string; href: string } | null;
	places: { label: string; href: string }[];
	poweredBy: { src: string; alt: string; href: string } | null;
};

const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#160;': ' ', '&nbsp;': ' ' };
const text = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&#?\w+;/g, (e) => entities[e] ?? e).replace(/\s+/g, ' ').trim();
const attr = (tag: string, name: string) => {
	const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'));
	return m ? m[1].replace(/&#?\w+;/g, (e) => entities[e] ?? e) : '';
};
const li = (html: string, id: string) => html.match(new RegExp(`<li[^>]*\\sid="${id}"[^>]*>([\\s\\S]*?)</li>`, 'i'))?.[1] ?? null;

export function scrapeFooter(html: string): FooterScrape {
	const out: FooterScrape = { copyright: null, copyrightIcon: null, places: [], poweredBy: null };
	const c = li(html, 'footer-info-copyright');
	if (c) {
		const m = c.match(/^([\s\S]*?)<a\b([^>]*)>([\s\S]*?)<\/a>([\s\S]*)$/i);
		out.copyright = m ? { before: text(m[1]), label: text(m[3]), href: attr(m[2], 'href'), after: text(m[4]) } : null;
	}
	const icon = (id: string) => {
		const x = li(html, id);
		const a = x?.match(/<a\b([^>]*)>/i);
		const img = x?.match(/<img\b([^>]*)>/i);
		return x && a && img ? { src: attr(img[1], 'src'), alt: attr(img[1], 'alt'), href: attr(a[1], 'href') } : null;
	};
	out.copyrightIcon = icon('footer-copyrightico');
	out.poweredBy = icon('footer-poweredbyico');
	for (const m of html.matchAll(/<li[^>]*\sid="footer-places-[a-z-]+"[^>]*>\s*<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) out.places.push({ label: text(m[2]), href: attr(m[1], 'href') });
	return out;
}
