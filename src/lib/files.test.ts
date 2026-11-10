import { expect, it } from 'vitest';
import { fmtBytes, localMedia } from './files';
it('keeps wiki media on this site and CDN media where it is', () => {
	expect(localMedia('http://127.0.0.1:18088/images/a/a3/x.png', ['127.0.0.1:18088'])).toBe('/images/a/a3/x.png');
	expect(localMedia('https://cdn.example/thumb/x.png', ['kkutu.wiki'])).toBe('https://cdn.example/thumb/x.png');
	expect(localMedia(undefined, [])).toBe('');
});
it('formats sizes', () => expect([fmtBytes(10236), fmtBytes(500), fmtBytes(3 * 1048576)]).toEqual(['10 KB', '500 B', '3.0 MB']));
