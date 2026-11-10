function hash(s: string): number[] {
	const out: number[] = [];
	for (const seed of [0x811c9dc5, 0x1b873593]) {
		let h = seed;
		for (let i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i);
			h = Math.imul(h, 0x01000193) >>> 0;
		}
		out.push(h);
	}
	return out;
}

export function identiconSvg(name: string): string {
	const [a, b] = hash(name.trim().toLowerCase() || '?');
	const hue = a % 360;
	const bg = `hsl(${hue} 38% 27%)`;
	const fg = `hsl(${(hue + 140 + (b % 60)) % 360} 58% 72%)`;
	let cells = '';
	for (let y = 0; y < 5; y++)
		for (let x = 0; x < 3; x++) {
			if (((b >>> (y * 3 + x)) & 1) === 0) continue;
			for (const cx of x === 2 ? [2] : [x, 4 - x]) cells += `<rect x="${cx * 4 + 2}" y="${y * 4 + 2}" width="4" height="4" rx="0.6"/>`;
		}
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="${bg}"/><g fill="${fg}">${cells}</g></svg>`;
}
export const identiconUrl = (name: string) => 'data:image/svg+xml,' + encodeURIComponent(identiconSvg(name));
