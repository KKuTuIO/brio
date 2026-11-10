<script lang="ts">
	import { fmtBytes, type FileInfo } from './files';
	import { articlePath } from './wikitext';
	import { userPage, type Namespaces } from './ns';
	let { f, ns }: { f: FileInfo; ns: Namespaces } = $props();
	const pad = (n: number) => String(n).padStart(2, '0');
	const fmt = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
</script>

<section class="file-view mt-5" aria-label="파일">
	<a class="file-stage" href={f.url} target="_blank" rel="noopener" title="원본 보기">
		<img src={f.thumb || f.url} alt="" width={f.width} height={f.height} />
	</a>
	<p class="mt-2 text-sm" style="color: var(--kk-muted)">
		<a style="color: var(--kk-blue)" href={f.url} target="_blank" rel="noopener">원본 파일</a>
		({f.width}×{f.height} 픽셀, 파일 크기: {fmtBytes(f.size)}, MIME 종류: {f.mime})
	</p>

	<h2 class="file-h">파일 역사</h2>
	<div class="overflow-x-auto">
		<table class="w-full min-w-[28rem] text-sm">
			<thead><tr class="border-b-2 text-left" style="border-color: var(--kk-line-strong)"><th class="py-2 pr-3">날짜/시간</th><th class="px-3">크기</th><th class="px-3">올린 이</th><th class="pl-3">설명</th></tr></thead>
			<tbody>
				{#each f.versions as v, i (v.ts + i)}
					<tr class="border-b align-top" style="border-color: var(--kk-line)">
						<td class="py-2 pr-3 whitespace-nowrap tabular-nums"><a style="color: var(--kk-blue)" href={v.url} target="_blank" rel="noopener">{fmt(v.ts)}</a>{#if i === 0} <span class="kk-chip">현재</span>{/if}</td>
						<td class="px-3 whitespace-nowrap">{v.width}×{v.height} ({fmtBytes(v.size)})</td>
						<td class="px-3"><a style="color: var(--kk-blue)" href={articlePath(userPage(v.user, ns))}>{v.user}</a></td>
						<td class="pl-3" style="color: var(--kk-muted)">{v.comment.replace(/==[^=]+==\s*/g, '').trim()}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<h2 class="file-h">이 파일을 사용하는 문서</h2>
	{#if f.usage.length}
		<ul class="list-disc pl-6 leading-8" style="columns: 2 14rem">{#each f.usage as t (t)}<li><a style="color: var(--kk-blue)" href={articlePath(t)}>{t}</a></li>{/each}</ul>
	{:else}
		<p class="text-sm" style="color: var(--kk-muted)">이 파일을 사용하는 문서가 없어요.</p>
	{/if}
</section>

<style>
	.file-stage { display: grid; place-items: center; padding: 1rem; border: 1px solid var(--kk-line); border-radius: 0.375rem; background: repeating-conic-gradient(var(--kk-surface-2) 0% 25%, var(--kk-surface) 0% 50%) 50% / 20px 20px; }
	.file-stage img { max-width: 100%; max-height: 70dvh; width: auto; height: auto; object-fit: contain; }
	.file-h { margin: 1.6em 0 0.5em; padding-bottom: 0.2em; border-bottom: 1px solid var(--kk-line-strong); font-size: 1.25rem; font-weight: 800; }
</style>
