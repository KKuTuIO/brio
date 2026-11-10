import { mwRead, MwError } from '$lib/server/mw';
import { loadSite } from '$lib/server/site';
import { splitTitle, talkOf } from '$lib/ns';

export type Thread = { html: string; heading: string };

export async function load({ params, url, request, isDataRequest }) {
	const site = await loadSite();
	const talkTitle = params.title.replace(/_/g, ' ');
	const subject = splitTitle(talkTitle, site.ns).id % 2 === 1 ? (talkOf(talkTitle, site.ns) ?? talkTitle) : talkTitle;
	const section = url.searchParams.get('s') ?? '1';
	const run = mwRead({ action: 'parse', page: talkTitle, section, prop: 'text|sections', disablelimitreport: '1', disabletoc: '1', disableeditsection: '1' }, { cookie: request.headers.get('cookie') ?? undefined, tag: talkTitle })
		.then((j) => {
			const html: string = j.parse.text;
			return { html: html.replace(/<div class="mw-heading[^>]*>.*?<\/div>/s, '').replace(/<h[1-6][^>]*>.*?<\/h[1-6]>/s, ''), heading: j.parse.sections?.[0]?.line ?? '' } as Thread;
		})
		.catch((e) => {
			if (e instanceof MwError) return null;
			throw e;
		});
	if (!isDataRequest) return { subject, talkTitle, section, thread: await run };
	run.catch(() => {});
	return { subject, talkTitle, section, thread: run };
}
