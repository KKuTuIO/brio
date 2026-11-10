const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#160;': ' ', '&nbsp;': ' ' };
const decode = (s: string) => s.replace(/&#?\w+;/g, (e) => entities[e] ?? e);

export type Seo = { title: string; description: string; image: string | null; type: 'website' | 'article'; path: string; noindex?: boolean; modified?: string };

export function descriptionOf(html: string, max = 160): string {
	const body = html.replace(/<(table|style|script|sup)\b[\s\S]*?<\/\1>/gi, '');
	for (const m of body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
		const t = decode(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
		if (t.length >= 20) return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
	}
	return '';
}

export function firstImage(html: string, origin: string): string | null {
	for (const m of html.matchAll(/<img\b([^>]*)>/gi)) {
		const src = m[1].match(/\ssrc="([^"]+)"/i)?.[1];
		const w = Number(m[1].match(/\swidth="(\d+)"/i)?.[1] ?? 999);
		if (!src || w < 100 || /\/(resources|skins|extensions)\//.test(src)) continue;
		try {
			return new URL(decode(src), origin).href;
		} catch {
		}
	}
	return null;
}
