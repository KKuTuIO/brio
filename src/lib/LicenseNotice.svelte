<script lang="ts">
	import type { Site } from './server/site';
	let { site }: { site: Pick<Site, 'license' | 'licenseNotice' | 'licenseIcon' | 'disclaimer'> } = $props();
	const n = $derived(site.licenseNotice);
	const icon = $derived(site.licenseIcon);
</script>

{#if n || icon || site.license || site.disclaimer.length}
	<div class="mt-10 border-t pt-6 text-right text-sm leading-6" style="border-color: var(--kk-line-strong)">
		{#if icon}
			<a class="ml-auto inline-block" href={icon.href} target="_blank" rel="noopener" title={icon.alt}><img class="h-[31px] w-[88px]" src={icon.src} alt={icon.alt} loading="lazy" /></a>
		{/if}
		{#if n}
			<p class="mt-2">{n.before} <a style="color: var(--kk-blue)" href={n.href} target="_blank" rel="noopener">{n.label}</a>{n.after}</p>
		{:else if site.license}
			<p class="mt-2"><a style="color: var(--kk-blue)" href={site.license.url} target="_blank" rel="noopener">{site.license.text}</a></p>
		{/if}
		{#each site.disclaimer as line}<p class="mt-3" style="color: var(--kk-muted)">{line}</p>{/each}
	</div>
{/if}
