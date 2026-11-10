import { describe, expect, it } from 'vitest';
import { articlePath, editPath, rewriteLinks } from './wikitext';

describe('rewriteLinks', () => {
	it('sends red links and section edits to our editor', () => {
		const html = '<a href="/index.php?title=%EB%81%84%ED%88%AC&amp;action=edit&amp;redlink=1" class="new">x</a><a href="/index.php?title=A&amp;action=edit&amp;section=2">e</a>';
		const out = rewriteLinks(html);
		expect(out).toContain('href="/edit/%EB%81%84%ED%88%AC"');
		expect(out).toContain('href="/edit/A?section=2"');
	});
	it('maps history and plain title links, leaves others', () => {
		expect(rewriteLinks('<a href="/index.php?title=A_b&amp;action=history">h</a>')).toContain('/history/A_b');
		expect(rewriteLinks('<a href="/index.php?title=Special:RecentChanges">r</a>')).toContain('/w/Special%3ARecentChanges');
		const keep = '<a href="/index.php?title=A&amp;oldid=3">o</a>';
		expect(rewriteLinks(keep)).toBe(keep);
	});
});
describe('paths', () => {
	it('keeps slashes, encodes the rest', () => {
		expect(articlePath('가 나/다')).toBe('/w/%EA%B0%80_%EB%82%98/%EB%8B%A4');
		expect(editPath('A', 3)).toBe('/edit/A?section=3');
	});
});
