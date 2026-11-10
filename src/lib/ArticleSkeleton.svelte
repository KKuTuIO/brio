
<div class="flex flex-col gap-3" role="status" aria-label="문서를 불러오는 중">
	{#each [100, 96, 88] as w}<div class="kk-skeleton h-4" style="width: {w}%"></div>{/each}
	<div class="kk-skeleton mt-6 h-7 w-1/3"></div>
	{#each [100, 92, 97, 70] as w}<div class="kk-skeleton h-4" style="width: {w}%"></div>{/each}
	<div class="kk-skeleton mt-6 h-7 w-2/5"></div>
	{#each [95, 100, 64] as w}<div class="kk-skeleton h-4" style="width: {w}%"></div>{/each}
	<span class="sr-only">불러오는 중…</span>
</div>
