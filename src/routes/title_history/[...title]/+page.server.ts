import { firstRevision, logEvents } from '$lib/server/history';

export async function load({ params, request, isDataRequest }) {
	const title = params.title.replace(/_/g, ' ');
	const cookie = request.headers.get('cookie') ?? undefined;
	const run = Promise.all([firstRevision(title, cookie), logEvents(title, cookie, ['move', 'delete'])]).then(([first, events]) => ({ first, events }));
	if (!isDataRequest) return { title, life: await run };
	run.catch(() => {});
	return { title, life: run };
}
