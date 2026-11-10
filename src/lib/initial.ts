const CHO = ['ㄱ', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅂ', 'ㅅ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export function initialOf(title: string): string {
	const c = title.trim()[0] ?? '';
	const code = c.charCodeAt(0);
	if (code >= 0xac00 && code <= 0xd7a3) return CHO[Math.floor((code - 0xac00) / 588)];
	if (/[A-Za-z]/.test(c)) return c.toUpperCase();
	if (/[0-9]/.test(c)) return '0-9';
	if (code >= 0x3131 && code <= 0x314e) return CHO[[...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'].indexOf(c)] ?? c;
	return '기타';
}
const order = (k: string) => (k === '0-9' ? 0 : /^[A-Z]$/.test(k) ? 1 : k === '기타' ? 3 : 2);

export function groupByInitial(titles: string[]): { key: string; items: string[] }[] {
	const m = new Map<string, string[]>();
	for (const t of titles) m.set(initialOf(t), [...(m.get(initialOf(t)) ?? []), t]);
	return [...m.entries()]
		.sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b, 'ko'))
		.map(([key, items]) => ({ key, items: items.sort((a, b) => a.localeCompare(b, 'ko')) }));
}
