import { describe, expect, it } from 'vitest';
import { embedFrom, embedSrc, toShellPath } from './mwUrl';

const O = 'http://x';
const sp = ['특수', 'special'];
describe('toShellPath', () => {
	it('keeps pretty article/special paths and drops the skin switch', () => {
		expect(toShellPath('/w/Special:Preferences?useskin=monobook', O, sp)).toBe('/w/Special:Preferences');
		expect(toShellPath('/w/%EB%8C%80%EB%AC%B8', O, sp)).toBe('/w/%EB%8C%80%EB%AC%B8');
	});
	it('maps index.php views to our screens', () => {
		expect(toShellPath('/index.php?title=A&action=edit&section=2', O, sp)).toBe('/edit/A?section=2');
		expect(toShellPath('/index.php?title=A_b&action=history', O, sp)).toBe('/history/A_b');
		expect(toShellPath('/index.php?title=A&oldid=7', O, sp)).toBe('/w/A?rev=7');
		expect(toShellPath('/index.php?title=Special:Foo&x=1', O, sp)).toBe('/w/Special%3AFoo?x=1');
	});
	it('wraps what we do not render ourselves, and leaves raw/external alone', () => {
		expect(toShellPath('/index.php?title=A&action=protect', O, sp)).toBe('/mw?src=' + encodeURIComponent('/index.php?title=A&action=protect'));
		expect(toShellPath('/index.php?title=A&action=edit&undo=3&undoafter=2', O, sp)).toContain('/mw?src=');
		expect(toShellPath('/index.php?title=A&action=raw', O, sp)).toBeNull();
		expect(toShellPath('https://elsewhere.example/x', O, sp)).toBeNull();
	});
});
describe('embed addresses', () => {
	it('adds the bare skin', () => {
		expect(embedSrc('Special:Contributions/Admin', '?limit=50')).toBe('/index.php?limit=50&title=Special%3AContributions%2FAdmin&useskin=monobook');
		expect(embedFrom('/index.php?title=A&action=protect')).toBe('/index.php?title=A&action=protect&useskin=monobook');
		expect(embedFrom('/elsewhere')).toBeNull();
	});
});
