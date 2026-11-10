import { revisionPage } from '$lib/server/history';

export async function load({ params, url, request, isDataRequest }) {
	const title = params.title.replace(/_/g, ' ');
	const run = revisionPage(title, request.headers.get('cookie') ?? undefined, url.searchParams.get('start'));
	if (!isDataRequest) return { title, revs: await run };
	run.catch(() => {});
	return { title, revs: run };
}
