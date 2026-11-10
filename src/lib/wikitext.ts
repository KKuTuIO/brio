
const enc = encodeURIComponent;

export function articlePath(title: string): string {
	return '/w/' + title.replace(/ /g, '_').split('/').map(enc).join('/');
}

export function editPath(title: string, section?: string | number | null): string {
	const base = '/edit/' + title.replace(/ /g, '_').split('/').map(enc).join('/');
	return section != null && section !== '' ? `${base}?section=${section}` : base;
}

export function rewriteLinks(html: string): string {
	return html.replace(/href="(\/index\.php\?[^"]*)"/g, (whole, href: string) => {
		const q = new URLSearchParams(decodeHtml(href).split('?')[1] ?? '');
		const title = q.get('title');
		if (!title) return whole;
		if (q.get('action') === 'edit') return `href="${attr(editPath(title, q.get('section')))}"`;
		if (q.get('action') === 'history') return `href="${attr('/history/' + title.replace(/ /g, '_').split('/').map(enc).join('/'))}"`;
		if (!q.get('action') && !q.get('oldid') && !q.get('diff')) return `href="${attr(articlePath(title))}"`;
		return whole;
	});
}

function decodeHtml(s: string): string {
	return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
function attr(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export type Section = { toclevel: number; level: string; line: string; number: string; index: string; anchor: string };

export function tocOf(sections: Section[]): Section[] {
	return sections.filter((s) => !s.index.startsWith('T-') && s.index !== '');
}
