import { mwRead } from '$lib/server/mw';

export async function load({ url, request, isDataRequest }) {
	const q = (url.searchParams.get('q') ?? '').trim();
	if (!q) return { q, results: Promise.resolve({ total: 0, hits: [] as Hit[] }) };
	const run = mwRead(
		{ action: 'query', list: 'search', srsearch: q, srlimit: '20', srprop: 'snippet|wordcount|timestamp', srenablerewrites: '1' },
		{ cookie: request.headers.get('cookie') ?? undefined }
	).then((j) => ({
		total: (j.query.searchinfo?.totalhits ?? 0) as number,
		hits: j.query.search.map((s: any) => ({ title: s.title, snippet: s.snippet, words: s.wordcount, ts: s.timestamp })) as Hit[]
	}));
	if (!isDataRequest) return { q, results: await run };
	run.catch(() => {});
	return { q, results: run };
}
type Hit = { title: string; snippet: string; words: number; ts: string };
