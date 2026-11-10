<script lang="ts">
	import type { Seo } from './seo';
	let { seo, site, origin, noindexAll }: { seo: Seo | null; site: { sitename: string }; origin: string; noindexAll: boolean } = $props();
	const brand = $derived(origin + '/brand/bi_profile_main.png');
	const url = $derived(origin + (seo?.path ?? '/'));
	const index = $derived(!noindexAll && !!seo && !seo.noindex);
</script>

<svelte:head>
	<meta name="robots" content={index ? 'index, follow' : 'noindex, nofollow'} />
	{#if seo}
		{#if seo.description}<meta name="description" content={seo.description} />{/if}
		{#if index}<link rel="canonical" href={url} />{/if}
		<meta property="og:site_name" content={site.sitename} />
		<meta property="og:locale" content="ko_KR" />
		<meta property="og:type" content={seo.type} />
		<meta property="og:title" content={seo.title} />
		{#if seo.description}<meta property="og:description" content={seo.description} />{/if}
		<meta property="og:url" content={url} />
		<meta property="og:image" content={seo.image ?? brand} />
		<meta name="twitter:card" content={seo.image ? 'summary_large_image' : 'summary'} />
		<meta name="twitter:title" content={seo.title} />
		{#if seo.description}<meta name="twitter:description" content={seo.description} />{/if}
		<meta name="twitter:image" content={seo.image ?? brand} />
		{#if seo.type === 'article' && seo.modified}<meta property="article:modified_time" content={seo.modified} />{/if}
		{#if seo.type === 'article' && index}
			{@html `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: seo.title, description: seo.description || undefined, image: seo.image ?? brand, dateModified: seo.modified, mainEntityOfPage: url, inLanguage: 'ko-KR', publisher: { '@type': 'Organization', name: site.sitename } }).replace(/</g, '\\u003c')}</script>`}
		{/if}
	{/if}
</svelte:head>
