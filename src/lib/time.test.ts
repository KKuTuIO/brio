import { expect, it } from 'vitest';
import { relativeTime } from './time';
const now = Date.parse('2026-11-10T12:00:00Z');
it('formats ages', () => {
	expect(relativeTime('2026-11-10T11:59:59Z', now)).toBe('방금 전');
	expect(relativeTime('2026-11-10T11:59:41Z', now)).toBe('19초 전');
	expect(relativeTime('2026-11-10T11:55:00Z', now)).toBe('5분 전');
	expect(relativeTime('2026-11-10T09:00:00Z', now)).toBe('3시간 전');
	expect(relativeTime('2026-11-08T12:00:00Z', now)).toBe('2일 전');
});
