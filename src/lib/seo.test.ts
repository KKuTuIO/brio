import { expect, it } from 'vitest';
import { descriptionOf, firstImage } from './seo';

it('takes the first real paragraph, skipping tables and footnote marks', () => {
	const html = '<table><tr><td><p>표 안의 문장은 건너뛴다 건너뛴다 건너뛴다</p></td></tr></table><p>짧다</p><p><b>끄투리오</b>는 &amp; 끝말잇기를 <a href="#">즐기는</a> 곳이에요.<sup class="reference">[1]</sup></p><p>두 번째 문단도 충분히 길어요 길어요 길어요.</p>';
	expect(descriptionOf(html)).toBe('끄투리오는 & 끝말잇기를 즐기는 곳이에요.');
});
it('truncates long text with an ellipsis', () => {
	const t = descriptionOf('<p>' + '가'.repeat(300) + '</p>', 50);
	expect(t.length).toBe(50);
	expect(t.endsWith('…')).toBe(true);
});
it('picks a content image, not an icon or skin asset', () => {
	const html = '<img src="/resources/assets/x.png" width="200"><img src="/images/a.png" width="16"><img src="/images/thumb/b.jpg" width="320">';
	expect(firstImage(html, 'https://wiki.example')).toBe('https://wiki.example/images/thumb/b.jpg');
	expect(firstImage('<p>no images</p>', 'https://wiki.example')).toBeNull();
});
