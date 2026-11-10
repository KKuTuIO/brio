export type Part = { text: string; bold: boolean };
export type Note = { id: number; type: string; unread: boolean; unix: number; title: Part[]; body: string; href: string | null; agent: string };

const ENT: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#160;': ' ', '&nbsp;': ' ' };
const decode = (s: string) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#?\w+;/g, (e) => ENT[e] ?? e);
const clean = (s: string) => s.replace(/[‎‏‪-‮⁦-⁩]/g, '');

function parts(html: string): Part[] {
	const out: Part[] = [];
	let bold = false;
	for (const tok of html.split(/(<\/?(?:strong|b)\b[^>]*>)/i)) {
		if (/^<(strong|b)\b/i.test(tok)) bold = true;
		else if (/^<\/(strong|b)/i.test(tok)) bold = false;
		else {
			const text = clean(decode(tok.replace(/<[^>]+>/g, '')));
			if (text) out.push({ text, bold });
		}
	}
	return out;
}
const block = (html: string, cls: string) => html.match(new RegExp(`<div class="${cls}">([\\s\\S]*?)</div>`))?.[1] ?? '';

export function localHref(href: string | undefined | null): string | null {
	if (!href) return null;
	const rel = href.replace(/&amp;/g, '&').replace(/^https?:\/\/[^/]+(?=\/(?:w\/|index\.php))/, '');
	return rel.replace(/([?&])markasread=\d+&?/, '$1').replace(/[?&](?=#|$)/, '');
}

export function parseFlyout(html: string): { title: Part[]; body: string; href: string | null } {
	const href = html.match(/class="mw-echo-notification-primary-link"[^>]*\shref="([^"]*)"/)?.[1] ?? html.match(/<a\b[^>]*\shref="([^"]*)"/)?.[1];
	return {
		title: parts(block(html, 'mw-echo-title')),
		body: parts(block(html, 'mw-echo-payload')).map((p) => p.text).join('').trim(),
		href: localHref(href)
	};
}

export function toNote(item: any): Note {
	const f = parseFlyout(String(item['*'] ?? ''));
	return { id: Number(item.id), type: String(item.type ?? ''), unread: !('read' in item), unix: Number(item.timestamp?.unix ?? item.timestamp?.utcunix ?? 0), title: f.title, body: f.body, href: f.href, agent: item.agent?.name ?? '' };
}

const ICONS: Record<string, string> = {
	'edit-user-talk': 'forum', mention: 'alternate_email', 'mention-failure': 'alternate_email', 'edit-thank': 'favorite', thank: 'favorite', welcome: 'waving_hand', reverted: 'undo',
	'page-linked': 'link', emailuser: 'mail', 'user-rights': 'shield_person', 'page-connection': 'link', 'login-fail-new': 'warning', 'login-fail-known': 'warning', 'login-success': 'verified_user'
};
export const noteIcon = (type: string) => ICONS[type] ?? 'notifications';
