import { expect, it } from 'vitest';
import { scrapeFooter } from './footerHtml';

const html = `<ul id="footer-info"><li id="footer-info-lastmod"> 이 문서는 마지막으로 편집되었습니다.</li><li id="footer-info-copyright">별도로 명시하지 않은 경우, 내용은 <a class="external" rel="nofollow" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">크리에이티브 커먼즈 저작자표시-비영리-동일조건변경허락</a>에 따라 사용할 수 있습니다.</li></ul>
<ul id="footer-places"><li id="footer-places-privacy"><a href="/w/%EA%B0%9C%EC%9D%B8">개인정보처리방침</a></li><li id="footer-places-about"><a href="/w/%EC%86%8C%EA%B0%9C">리오위키 소개</a></li></ul>
<ul id="footer-icons"><li id="footer-copyrightico"><a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" class="cdx-button"><img src="/resources/assets/licenses/cc-by-nc-sa.png" alt="CC &amp; co" width="88" height="31"></a></li>
<li id="footer-poweredbyico"><a href="https://www.mediawiki.org/"><img src="/resources/assets/poweredby_mediawiki.svg" alt="Powered by MediaWiki"></a></li></ul>`;

it("reads the license sentence, badge, places and powered-by from MediaWiki's own footer", () => {
	const f = scrapeFooter(html);
	expect(f.copyright).toEqual({ before: '별도로 명시하지 않은 경우, 내용은', label: '크리에이티브 커먼즈 저작자표시-비영리-동일조건변경허락', href: 'https://creativecommons.org/licenses/by-nc-sa/4.0/', after: '에 따라 사용할 수 있습니다.' });
	expect(f.copyrightIcon).toEqual({ src: '/resources/assets/licenses/cc-by-nc-sa.png', alt: 'CC & co', href: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' });
	expect(f.places.map((p) => p.label)).toEqual(['개인정보처리방침', '리오위키 소개']);
	expect(f.poweredBy?.alt).toBe('Powered by MediaWiki');
});
it('returns empty parts when the skin has no footer', () => {
	expect(scrapeFooter('<html><body>nothing</body></html>')).toEqual({ copyright: null, copyrightIcon: null, places: [], poweredBy: null });
});
