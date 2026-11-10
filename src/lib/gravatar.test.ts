import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { avatarFor, emailHash, gravatarUrl, PLACEHOLDER_HASH } from './gravatar';

describe('gravatar', () => {
	it('hashes the lower-cased, trimmed email', async () => {
		const want = createHash('sha256').update('myemailaddress@example.com').digest('hex');
		expect(await emailHash('  MyEmailAddress@Example.com ')).toBe(want);
	});
	it('uses the identicon default, and the forced placeholder when there is no confirmed email', async () => {
		expect(await avatarFor(undefined, undefined)).toBe(`https://secure.gravatar.com/avatar/${PLACEHOLDER_HASH}?d=identicon&s=96&f=y`);
		expect(await avatarFor('a@b.c', null)).toBe(await avatarFor(undefined, undefined));
		const url = await avatarFor('a@b.c', '2026-01-01T00:00:00Z');
		expect(url).toMatch(/^https:\/\/secure\.gravatar\.com\/avatar\/[0-9a-f]{64}\?d=identicon&s=96$/);
	});
	it('sizes it', () => expect(gravatarUrl('ab', 40)).toContain('s=40'));
});
