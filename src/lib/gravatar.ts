export const PLACEHOLDER_HASH = '0'.repeat(32);

export async function emailHash(email: string): Promise<string> {
	const bytes = new TextEncoder().encode(email.trim().toLowerCase());
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function gravatarUrl(hash: string, size = 96): string {
	const forced = hash === PLACEHOLDER_HASH ? '&f=y' : '';
	return `https://secure.gravatar.com/avatar/${hash}?d=identicon&s=${size}${forced}`;
}

export async function avatarFor(email: string | undefined, confirmedAt: string | undefined | null): Promise<string> {
	return gravatarUrl(email && confirmedAt ? await emailHash(email) : PLACEHOLDER_HASH);
}
