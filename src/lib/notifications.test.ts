import { describe, expect, it } from 'vitest';
import { localHref, noteIcon, parseFlyout, toNote } from './notifications';

const html = `<div class="mw-echo-state"><img class="mw-echo-icon" src="/extensions/Echo/x.svg"><div class="mw-echo-content"><div class="mw-echo-title">‪E2e‬님이 <strong>당신의 토론 문서</strong>의 "<strong>안부</strong>" 문단에 글을 남겼습니다.</div>
<div class="mw-echo-payload">안녕하세요, Admin님! &amp; 반가워요.</div>
<div class="mw-echo-notification-footer">방금</div>
<a class="mw-echo-notification-primary-link" href="http://wiki.example/w/%EC%82%AC%EC%9A%A9%EC%9E%90:Admin?markasread=1#안부">메시지 보기</a>
</div></div>`;

describe('Echo flyout → plain pieces', () => {
	it('keeps bold segments, drops bidi marks and tags, decodes entities', () => {
		const f = parseFlyout(html);
		expect(f.title.map((p) => p.text).join('')).toBe('E2e님이 당신의 토론 문서의 "안부" 문단에 글을 남겼습니다.');
		expect(f.title.filter((p) => p.bold).map((p) => p.text)).toEqual(['당신의 토론 문서', '안부']);
		expect(f.body).toBe('안녕하세요, Admin님! & 반가워요.');
	});
	it('turns the absolute link into a local one without the markasread switch', () => {
		expect(parseFlyout(html).href).toBe('/w/%EC%82%AC%EC%9A%A9%EC%9E%90:Admin#안부');
		expect(localHref('https://kkutu.wiki/index.php?title=A&amp;diff=3&markasread=1')).toBe('/index.php?title=A&diff=3');
		expect(localHref('https://elsewhere.example/page')).toBe('https://elsewhere.example/page');
		expect(localHref(undefined)).toBeNull();
	});
	it('tells read from unread, and picks an icon', () => {
		expect(toNote({ id: 4, type: 'edit-user-talk', timestamp: { unix: '1794305174' }, '*': html, agent: { name: 'X' } })).toMatchObject({ id: 4, unread: true, unix: 1794305174, agent: 'X' });
		expect(toNote({ id: 5, type: 'mention', read: { unix: '1' }, timestamp: { unix: '2' }, '*': '' }).unread).toBe(false);
		expect(noteIcon('edit-user-talk')).toBe('forum');
		expect(noteIcon('something-new')).toBe('notifications');
	});
});
