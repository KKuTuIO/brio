<script lang="ts">
	import { page } from '$app/state';
	import MwFrame from '$lib/MwFrame.svelte';
	let { data } = $props();
	let title = $state('');
</script>

<svelte:head><title>{title || '위키'} - {page.data.site.sitename}</title></svelte:head>
<article class="kk-card min-w-0 p-4 sm:p-7">
	<h1 class="text-[2rem] leading-tight font-extrabold">{title || ' '}</h1>
	<div class="relative mt-4"><MwFrame src={data.src} specialNames={data.specialNames} ontitle={(t) => (title = t)} /></div>
</article>
