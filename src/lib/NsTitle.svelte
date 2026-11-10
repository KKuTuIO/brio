<script lang="ts">
	import { titleParts, type Namespaces } from './ns';
	let { title, ns }: { title: string; ns: Namespaces } = $props();
	const parts = $derived(titleParts(title, ns));
</script>

{#if parts.prefix}<span class="ns-mark">{parts.prefix}</span>:{parts.rest}{:else}{title}{/if}
