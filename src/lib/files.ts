export type FileVersion = { ts: string; user: string; comment: string; width: number; height: number; size: number; url: string };
export type FileInfo = { url: string; thumb: string; width: number; height: number; size: number; mime: string; user: string; ts: string; comment: string; versions: FileVersion[]; usage: string[] };

export function localMedia(url: string | undefined | null, wikiHosts: string[]): string {
	if (!url) return '';
	try {
		const u = new URL(url);
		return wikiHosts.includes(u.host) ? u.pathname + u.search : url;
	} catch {
		return url;
	}
}

export const fmtBytes = (n: number) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : n >= 1024 ? Math.round(n / 1024) + ' KB' : n + ' B');
