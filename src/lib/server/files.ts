import { env } from '$env/dynamic/private';
import { mwRead } from './mw';
import { localMedia, type FileInfo } from '../files';

export async function loadFile(title: string, cookie: string | undefined, server: string | null): Promise<FileInfo | null> {
	const hosts = [new URL(env.MW_ORIGIN ?? 'http://127.0.0.1:18088').host, ...(server ? [new URL(server).host] : [])];
	const [info, usage] = await Promise.all([
		mwRead({ action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|size|mime|user|timestamp|comment', iilimit: '10', iiurlwidth: '1280' }, { cookie, tag: title }).catch(() => null),
		mwRead({ action: 'query', list: 'imageusage', iutitle: title, iulimit: '30' }, { cookie, tag: title }).catch(() => null)
	]);
	const ii: any[] = info?.query?.pages?.[0]?.imageinfo ?? [];
	if (!ii.length) return null;
	const cur = ii[0];
	return {
		url: localMedia(cur.url, hosts), thumb: localMedia(cur.thumburl ?? cur.url, hosts), width: cur.width, height: cur.height, size: cur.size, mime: cur.mime, user: cur.user ?? '', ts: cur.timestamp, comment: cur.comment ?? '',
		versions: ii.map((v) => ({ ts: v.timestamp, user: v.user ?? '', comment: v.comment ?? '', width: v.width, height: v.height, size: v.size, url: localMedia(v.url, hosts) })),
		usage: (usage?.query?.imageusage ?? []).map((u: any) => u.title)
	};
}
