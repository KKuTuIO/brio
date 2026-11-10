import { expect, it } from 'vitest';
import { editDeniedOf } from './editDenied';
it('reads who may edit from MediaWiki\'s testactions answer', () => {
	expect(editDeniedOf(undefined)).toBeNull();
	expect(editDeniedOf(true)).toBeNull();
	expect(editDeniedOf([])).toBeNull();
	expect(editDeniedOf([{ code: 'protectedpage', text: '이 문서는 보호되어 있어요.' }])).toBe('이 문서는 보호되어 있어요.');
	expect(editDeniedOf([{ code: 'protectedpage' }])).toBe('protectedpage');
	expect(editDeniedOf(false)).toBe('편집할 수 없어요.');
});
