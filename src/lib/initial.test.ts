import { expect, it } from 'vitest';
import { groupByInitial, initialOf } from './initial';
it('files titles under their initial', () => {
	expect(initialOf('까치')).toBe('ㄱ');
	expect(initialOf('크레이지')).toBe('ㅋ');
	expect(initialOf('bgm')).toBe('B');
	expect(initialOf('2004년')).toBe('0-9');
	expect(initialOf('~x')).toBe('기타');
	expect(groupByInitial(['크레이지', 'BGM', '가', '나', '1등']).map((g) => g.key)).toEqual(['0-9', 'B', 'ㄱ', 'ㄴ', 'ㅋ']);
});
