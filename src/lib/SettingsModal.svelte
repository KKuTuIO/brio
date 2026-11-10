<script lang="ts">
	import { DEFAULTS, prefs, setPref, type Prefs } from './prefs.svelte';
	import { ui } from './session.svelte';

	type Row = { key: keyof Prefs; label: string; options?: [string, string][]; note?: string };
	const tabs: { id: string; label: string; rows: Row[] }[] = [
		{
			id: 'wiki', label: '위키',
			rows: [
				{ key: 'theme', label: '테마', options: [['auto', '자동 (시스템 설정)'], ['light', '라이트'], ['dark', '다크']] },
				{ key: 'nowrapTable', label: '표 워드랩 사용 안 함' },
				{ key: 'headingFold', label: '문단 접기', options: [['default', '(기본)'], ['fold', '모든 문단을 접기'], ['unfold', '모든 접힌 문단을 펼치기']] },
				{ key: 'unfoldCollapsible', label: '접기 문법을 기본으로 펼치기' },
				{ key: 'strike', label: '취소선', options: [['show', '보이기'], ['remove', '취소선 제거'], ['hide', '숨기기']] },
				{ key: 'footnote', label: '각주 표시 형식', options: [['browser', '브라우저 기본'], ['popover', '팝오버'], ['popup', '팝업'], ['expand', '펼침']] },
				{ key: 'image', label: '이미지', options: [['show', '보이기'], ['hide', '숨기기']] },
				{ key: 'categoryPos', label: '분류 위치', options: [['top', '상단'], ['bottom', '하단'], ['both', '모두']] },
				{ key: 'fontSize', label: '글자 크기', options: [['-2', '더 작게'], ['-1', '작게'], ['0', '사용하지 않음'], ['1', '크게'], ['2', '더 크게'], ['3', '매우 크게']] },
				{ key: 'extIcon', label: '항상 외부 링크 아이콘을 표시하기' },
				{ key: 'absoluteTime', label: '상대 시간 표기를 사용하지 않음' }
			]
		},
		{
			id: 'discuss', label: '토론',
			rows: [
				{ key: 'dStrike', label: '취소선', options: [['show', '보이기'], ['remove', '속성 제거'], ['hide', '숨기기']] },
				{ key: 'dBold', label: '굵음', options: [['show', '보이기'], ['remove', '속성 제거'], ['hide', '숨기기']] }
			]
		},
		{
			id: 'skin', label: '스킨',
			rows: [
				{ key: 'black', label: '검은 화면 (어두운 화면에서 작동합니다)' },
				{ key: 'font', label: '글꼴 ([*] 표시가 있는 글꼴은 기기에 설치되어 있어야 사용할 수 있습니다)', options: [['auto', '(자동)'], ['pretendard', 'Pretendard'], ['browser', '(브라우저 기본)'], ['nanum', '나눔고딕 [*]'], ['apple', 'Apple SD Gothic Neo [*]'], ['malgun', '맑은 고딕 [*]']] },
				{ key: 'navFixed', label: '내비게이션 바 고정형' },
				{ key: 'sidebar', label: '사이드바 배치', options: [['default', '기본'], ['left', '왼쪽'], ['vertical', '세로형']] },
				{ key: 'tocButton', label: '목차 버튼', options: [['default', '기본'], ['link', '링크'], ['popup', '팝업'], ['disabled', '비활성화']] }
			]
		}
	];
	let tab = $state('wiki');
	let dlg: HTMLDialogElement | undefined = $state();
	$effect(() => {
		if (!dlg) return;
		if (ui.settingsOpen && !dlg.open) dlg.showModal();
		if (!ui.settingsOpen && dlg.open) dlg.close();
	});
	const rows = $derived(tabs.find((t) => t.id === tab)!.rows);
	const pick = (key: keyof Prefs, v: string) => setPref(key, (typeof DEFAULTS[key] === 'boolean' ? v === 'true' : v) as never);
</script>

<dialog bind:this={dlg} onclose={() => (ui.settingsOpen = false)} onclick={(e) => e.target === dlg && (ui.settingsOpen = false)} class="kk-card m-auto max-h-[90dvh] w-[min(94vw,36rem)] overflow-auto p-0 backdrop:bg-black/50" style="color: var(--kk-text)" aria-labelledby="settings-title">
	<div class="p-6">
		<div class="flex items-start justify-between">
			<h2 id="settings-title" class="text-2xl font-extrabold">설정</h2>
			<button type="button" class="grid h-8 w-8 place-items-center rounded hover:bg-(--kk-accent-soft)" aria-label="닫기" onclick={() => (ui.settingsOpen = false)}><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
		</div>
		<div class="seg mt-4 w-full" role="tablist">
			{#each tabs as t (t.id)}<button type="button" role="tab" aria-selected={tab === t.id} aria-current={tab === t.id ? 'page' : undefined} onclick={() => (tab = t.id)}>{t.label}</button>{/each}
		</div>
		<div class="mt-5 flex flex-col gap-5">
			{#each rows as r (r.key)}
				<div>
					<label class="mb-1.5 block text-sm font-bold" for="pref-{r.key}">{r.label}</label>
					{#if r.options}
						<select id="pref-{r.key}" class="kk-input h-10 w-full max-w-72 px-2.5 text-base" value={String(prefs[r.key])} onchange={(e) => pick(r.key, e.currentTarget.value)}>
							{#each r.options as [v, l]}<option value={v}>{l}</option>{/each}
						</select>
					{:else}
						<label class="inline-flex items-center gap-2 text-sm"><input id="pref-{r.key}" type="checkbox" checked={prefs[r.key] as boolean} onchange={(e) => setPref(r.key, e.currentTarget.checked as never)} />사용</label>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</dialog>
