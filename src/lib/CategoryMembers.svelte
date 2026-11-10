<script lang="ts">
	import { groupByInitial } from './initial';
	import { splitTitle, type Namespaces } from './ns';
	import { articlePath } from './wikitext';
	import type { Members } from '../routes/w/[...title]/+page.server';

	let { members, ns }: { members: Members; ns: Namespaces } = $props();
	const strip = (t: string) => splitTitle(t, ns).base;
	const pages = $derived(groupByInitial(members.pages));
	const subs = $derived(groupByInitial(members.subcats));
</script>

{#if members.subcats.length}
	<h2 class="cat-h">하위 분류</h2>
	<p class="mb-3 text-sm">전체 {members.subcats.length}개 분류</p>
	{#each subs as g (g.key)}
		<h3 class="cat-letter">{g.key}</h3>
		<ul class="cat-list">{#each g.items as t (t)}<li><a href={articlePath(t)}>{strip(t)}</a></li>{/each}</ul>
	{/each}
{/if}
{#if members.pages.length}
	<h2 class="cat-h">이 분류에 속하는 문서</h2>
	<p class="mb-3 text-sm">전체 {members.pages.length}개 문서</p>
	{#each pages as g (g.key)}
		<h3 class="cat-letter">{g.key}</h3>
		<ul class="cat-list">{#each g.items as t (t)}<li><a href={articlePath(t)}>{t}</a></li>{/each}</ul>
	{/each}
{/if}
{#if members.files.length}
	<h2 class="cat-h">파일</h2>
	<ul class="cat-list">{#each members.files as t (t)}<li><a href={articlePath(t)}>{strip(t)}</a></li>{/each}</ul>
{/if}

<style>
	.cat-h { font-size: 1.35rem; font-weight: 800; margin: 1.6em 0 0.5em; padding-bottom: 0.2em; border-bottom: 1px solid var(--kk-line-strong); }
	.cat-letter { font-size: 1.15rem; font-weight: 800; margin: 1.1em 0 0.35em; padding-bottom: 0.2em; border-bottom: 1px solid var(--kk-line); }
	.cat-list { list-style: disc; padding-left: 1.4rem; line-height: 1.8; columns: 3 14rem; }
	.cat-list a { color: var(--kk-blue); }
</style>
