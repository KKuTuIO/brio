import { expect, it } from 'vitest';
import { categoryPage, isTalk, splitTitle, talkOf, titleParts, userPage } from './ns';
const ns = {
	'-1': { id: -1, name: '특수', canonical: 'Special' }, '0': { id: 0, name: '' }, '1': { id: 1, name: '토론', canonical: 'Talk' }, '2': { id: 2, name: '사용자', canonical: 'User' },
	'3': { id: 3, name: '사용자토론', canonical: 'User talk' }, '14': { id: 14, name: '분류', canonical: 'Category' }
};
it('maps pairs both ways using the wiki names', () => {
	expect(talkOf('대문', ns)).toBe('토론:대문');
	expect(talkOf('토론:대문', ns)).toBe('대문');
	expect(talkOf('User:Foo', ns)).toBe('사용자토론:Foo');
	expect(talkOf('특수:최근바뀜', ns)).toBeNull();
	expect(isTalk('사용자토론:Foo', ns)).toBe(true);
	expect(splitTitle('Foo: bar', ns)).toEqual({ id: 0, base: 'Foo: bar' });
	expect(userPage('A', ns)).toBe('사용자:A');
	expect(categoryPage('안내', ns)).toBe('분류:안내');
});

it('splits the namespace prefix off a title (for the highlight)', () => {
	expect(titleParts('분류:안내', ns)).toEqual({ prefix: '분류', rest: '안내' });
	expect(titleParts('User:Foo', ns)).toEqual({ prefix: 'User', rest: 'Foo' });
	expect(titleParts('Foo: bar', ns)).toEqual({ prefix: null, rest: 'Foo: bar' });
});
