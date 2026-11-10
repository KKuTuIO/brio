import { expect, it } from 'vitest';
import { parseNavbar } from './navbar';
import { articlePath } from './wikitext';

const sp = new Set(['특수', 'special']);
it('parses groups, icons and the three link kinds', () => {
	const t = '* icon=paper-plane | display=바로가기 | link=#\n** icon=gamepad | display=끄투리오 | link=https://kkutu.io | title=x\n\n* icon=wrench | display=도구 | link=#\n** display=특수 문서 | link=특수:특수문서\n** display=도움말 | link=리오위키:도움말';
	const n = parseNavbar(t, sp, articlePath);
	expect(n.map((g) => g.display)).toEqual(['바로가기', '도구']);
	expect(n[0].iconFa).toBe('fa fa-paper-plane');
	expect(n[0].href).toBeNull();
	expect(n[0].children[0]).toMatchObject({ href: 'https://kkutu.io', external: true, iconFa: 'fa fa-gamepad' });
	expect(n[1].children[0]).toMatchObject({ reload: true, iconFa: null, icon: 'link' });
	expect(n[1].children[1]).toMatchObject({ href: '/w/%EB%A6%AC%EC%98%A4%EC%9C%84%ED%82%A4%3A%EB%8F%84%EC%9B%80%EB%A7%90', reload: false });
});

it('reads Font Awesome names as written, and Material only on request', async () => {
	const { iconFor } = await import('./navbar');
	expect(iconFor('comments-o').fa).toBe('fa fa-comments-o');
	expect(iconFor('fa-gamepad').fa).toBe('fa fa-gamepad');
	expect(iconFor('fa fa-gamepad').fa).toBe('fa fa-gamepad');
	expect(iconFor('fab fa-discord').fa).toBe('fab fa-discord');
	expect(iconFor('material:sports_esports')).toEqual({ fa: null, material: 'sports_esports' });
	expect(iconFor('material:not_real')).toEqual({ fa: null, material: 'link' });
	expect(iconFor('"><script>').fa).toBeNull();
});
