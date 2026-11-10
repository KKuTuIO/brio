import { env } from '$env/dynamic/private';

export function GET({ url }) {
	const origin = (env.SITE_ORIGIN || url.origin).replace(/\/$/, '');
	const body =
		env.NOINDEX === '1'
			? 'User-agent: *\nDisallow: /\n'
			: `User-agent: *\nAllow: /w/\nDisallow: /edit/\nDisallow: /history/\nDisallow: /diff/\nDisallow: /backlink/\nDisallow: /discuss/\nDisallow: /thread/\nDisallow: /mw\nDisallow: /search\nDisallow: /recent\nDisallow: /signup\nDisallow: /api.php\nDisallow: /index.php\nDisallow: /random\n\nSitemap: ${origin}/sitemap.xml\n`;
	return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
