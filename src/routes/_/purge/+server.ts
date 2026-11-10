import { json } from '@sveltejs/kit';
import { purge } from '$lib/server/mw';

export async function POST({ request }) {
	const { title } = (await request.json().catch(() => ({}))) as { title?: string };
	purge(typeof title === 'string' ? title.replace(/_/g, ' ') : undefined);
	return json({ ok: true });
}
