import { redirect } from '@sveltejs/kit';
import { loadSite } from '$lib/server/site';
import { articlePath } from '$lib/wikitext';

export async function load() {
	redirect(307, articlePath((await loadSite()).mainpage));
}
