import { redirect } from '@sveltejs/kit';
import { mwFresh } from '$lib/server/mw';
import { articlePath } from '$lib/wikitext';

export async function GET() {
	const j = await mwFresh({ action: 'query', list: 'random', rnnamespace: '0', rnlimit: '1' });
	const t = j.query.random?.[0]?.title;
	redirect(307, t ? articlePath(t) : '/');
}
