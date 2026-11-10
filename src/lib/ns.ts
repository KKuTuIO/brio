export type Namespaces = Record<string, { id: number; name: string; canonical?: string }>;

const norm = (s: string) => s.replace(/_/g, ' ').trim().toLowerCase();

export function splitTitle(title: string, ns: Namespaces): { id: number; base: string } {
	const i = title.indexOf(':');
	if (i > 0) {
		const p = norm(title.slice(0, i));
		for (const n of Object.values(ns)) {
			if (n.id !== 0 && (norm(n.name) === p || (n.canonical && norm(n.canonical) === p))) return { id: n.id, base: title.slice(i + 1).trim() };
		}
	}
	return { id: 0, base: title };
}
export const nsName = (ns: Namespaces, id: number) => ns[String(id)]?.name ?? '';
const join = (ns: Namespaces, id: number, base: string) => (nsName(ns, id) ? `${nsName(ns, id)}:${base}` : base);

export function talkOf(title: string, ns: Namespaces): string | null {
	const { id, base } = splitTitle(title, ns);
	if (id < 0) return null;
	return join(ns, id % 2 ? id - 1 : id + 1, base);
}
export const isTalk = (title: string, ns: Namespaces) => splitTitle(title, ns).id % 2 === 1;
export const userPage = (name: string, ns: Namespaces) => join(ns, 2, name);
export const categoryPage = (name: string, ns: Namespaces) => join(ns, 14, name);

export function titleParts(title: string, ns: Namespaces): { prefix: string | null; rest: string } {
	const { id } = splitTitle(title, ns);
	const i = title.indexOf(':');
	return id !== 0 && i > 0 ? { prefix: title.slice(0, i), rest: title.slice(i + 1) } : { prefix: null, rest: title };
}
