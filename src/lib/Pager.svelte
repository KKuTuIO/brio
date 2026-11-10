<script lang="ts">
	let { base, prev, next }: { base: string; prev: string | null | undefined; next: string | null } = $props();
</script>

<div class="seg" role="navigation" aria-label="쪽 이동">
	{#if prev === undefined}<span class="opacity-40">‹ 이전</span>{:else}<a href={prev === null ? base : `${base}?start=${prev}`} data-sveltekit-noscroll>‹ 이전</a>{/if}
	{#if next === null}<span class="opacity-40">다음 ›</span>{:else}<a href={`${base}?start=${next}`} data-sveltekit-noscroll>다음 ›</a>{/if}
</div>

<style>
	.seg > span { display: inline-flex; align-items: center; height: 2.25rem; padding: 0 0.75rem; font-size: 0.875rem; font-weight: 700; background: var(--kk-surface-2); }
</style>
