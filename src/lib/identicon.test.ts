import { expect, it } from 'vitest';
import { identiconSvg, identiconUrl } from './identicon';

it('is deterministic and mirrored', () => {
	expect(identiconSvg('Admin')).toBe(identiconSvg('admin '));
	const svg = identiconSvg('Admin');
	const xs = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="4"/g)].map((m) => [Number(m[1]), Number(m[2])]);
	for (const [x, y] of xs) expect(xs.some(([x2, y2]) => y2 === y && x2 === 24 - 4 - x)).toBe(true);
});
it('differs between users and is a usable image url', () => {
	expect(identiconSvg('Admin')).not.toBe(identiconSvg('Zeta'));
	expect(identiconUrl('Admin').startsWith('data:image/svg+xml,')).toBe(true);
});
