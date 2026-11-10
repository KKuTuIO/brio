import { error } from '@sveltejs/kit';
import { embedFrom } from '$lib/mwUrl';
import { loadSite } from '$lib/server/site';

export async function load({ url }) {
	const src = embedFrom(url.searchParams.get('src') ?? '');
	if (!src) error(400, 'bad address');
	return { src, specialNames: (await loadSite()).specialNames };
}
