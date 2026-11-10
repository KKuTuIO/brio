<script lang="ts">
	import { login, ui } from './session.svelte';
	const open = $derived(ui.loginOpen);
	let username = $state('');
	let password = $state('');
	let busy = $state(false);
	let error = $state('');
	let dlg: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dlg) return;
		if (open && !dlg.open) dlg.showModal();
		if (!open && dlg.open) dlg.close();
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = '';
		try {
			await login(username, password);
			password = '';
			ui.loginOpen = false;
		} catch (err) {
			error = (err as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<dialog bind:this={dlg} onclose={() => (ui.loginOpen = false)} class="kk-card m-auto w-[min(92vw,24rem)] p-0 backdrop:bg-black/50" style="color: var(--kk-text)">
	<form onsubmit={submit} class="flex flex-col gap-3 p-6">
		<h2 class="text-lg font-extrabold">로그인</h2>
		<label class="flex flex-col gap-1 text-sm font-bold">
			사용자 이름
			<input class="kk-input h-11 px-3 text-base font-normal" bind:value={username} autocomplete="username" required />
		</label>
		<label class="flex flex-col gap-1 text-sm font-bold">
			비밀번호
			<input class="kk-input h-11 px-3 text-base font-normal" type="password" bind:value={password} autocomplete="current-password" required />
		</label>
		{#if error}<p role="alert" class="rounded-lg px-3 py-2 text-sm font-bold" style="background: var(--kk-danger-soft); color: var(--kk-danger)">{error}</p>{/if}
		<div class="flex items-center justify-between text-sm">
			<a class="font-bold" style="color: var(--kk-blue)" href="/w/Special:PasswordReset" data-sveltekit-reload onclick={() => (ui.loginOpen = false)}>계정 찾기</a>
			<a class="font-bold" style="color: var(--kk-blue)" href="/signup" onclick={() => (ui.loginOpen = false)}>새 계정 만들기</a>
		</div>
		<div class="mt-2 flex justify-end gap-2">
			<button type="button" class="kk-btn" onclick={() => (ui.loginOpen = false)}>취소</button>
			<button class="kk-btn kk-btn-primary" disabled={busy}>{busy ? '확인 중…' : '로그인'}</button>
		</div>
	</form>
</dialog>
