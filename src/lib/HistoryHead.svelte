<script lang="ts">
	import { articlePath, editPath } from './wikitext';
	import { page } from '$app/state';
	import NsTitle from './NsTitle.svelte';
	let { title, active }: { title: string; active: 'activity' | 'history' | 'title' } = $props();
	const slug = (t: string) => t.replace(/ /g, '_');
	const label = { activity: '문서 활동', history: '문서 역사', title: '표제어 역사' };
</script>

<div class="flex flex-wrap items-start justify-between gap-3">
	<h1 class="text-[2rem] leading-tight font-extrabold"><a href={articlePath(title)}><NsTitle {title} ns={page.data.site.ns} /></a> <span class="text-xl">({label[active]})</span></h1>
	<div class="seg">
		<a href={editPath(title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">edit_square</span>편집</a>
		<a href={'/backlink/' + slug(title)}><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">anchor</span>역링크</a>
	</div>
</div>
<div class="seg mt-5" role="tablist" aria-label="문서 기록">
	<a role="tab" href={'/activity/' + slug(title)} aria-selected={active === 'activity'} aria-current={active === 'activity' ? 'page' : undefined}>활동</a>
	<a role="tab" href={'/history/' + slug(title)} aria-selected={active === 'history'} aria-current={active === 'history' ? 'page' : undefined}>역사</a>
	<a role="tab" href={'/title_history/' + slug(title)} aria-selected={active === 'title'} aria-current={active === 'title' ? 'page' : undefined}>표제어 역사</a>
</div>
