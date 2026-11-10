import { prefs } from './prefs.svelte';

export function relativeTime(iso: string, now = Date.now()): string {
	if (prefs.absoluteTime) {
		const d = new Date(iso);
		const p = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
	}
	const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
	if (s < 5) return '방금 전';
	if (s < 60) return `${s}초 전`;
	if (s < 3600) return `${Math.floor(s / 60)}분 전`;
	if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
	if (s < 86400 * 30) return `${Math.floor(s / 86400)}일 전`;
	return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
}
