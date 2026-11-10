<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { api, login, session } from '$lib/session.svelte';

	type Captcha = { type: string; key: string } | null;
	let username = $state('');
	let password = $state('');
	let retype = $state('');
	let email = $state('');
	let agree = $state(false);
	let busy = $state(false);
	let error = $state('');
	let ready = $state(false);
	let canCreate = $state(true);
	let captcha = $state<Captcha>(null);
	let unsupported = $state(false);
	let token = $state('');
	let widget: HTMLDivElement | undefined = $state();
	let widgetId: string | undefined;

	const KNOWN = ['MediaWiki\\Auth\\PasswordAuthenticationRequest', 'MediaWiki\\Auth\\UsernameAuthenticationRequest', 'MediaWiki\\Auth\\UserDataAuthenticationRequest', 'CaptchaAuthenticationRequest'];

	function loadTurnstile(): Promise<any> {
		const w = window as any;
		if (w.turnstile) return Promise.resolve(w.turnstile);
		return new Promise((resolve, reject) => {
			const s = document.createElement('script');
			s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			s.async = true;
			s.onload = () => resolve(w.turnstile);
			s.onerror = reject;
			document.head.append(s);
		});
	}

	onMount(async () => {
		try {
			const j = await api({ action: 'query', meta: 'authmanagerinfo', amirequestsfor: 'create' });
			const info = j.query.authmanagerinfo;
			canCreate = info.cancreateaccounts !== false;
			for (const r of info.requests as any[]) {
				if (!KNOWN.includes(r.id)) unsupported = true;
				if (r.id === 'CaptchaAuthenticationRequest') captcha = r.metadata?.type === 'turnstile' && r.metadata.key ? { type: 'turnstile', key: r.metadata.key } : null;
				if (r.id === 'CaptchaAuthenticationRequest' && !captcha) unsupported = true;
			}
		} catch {
			unsupported = true;
		}
		ready = true;
	});

	$effect(() => {
		const c = captcha;
		const el = widget;
		if (!c || !el) return;
		let gone = false;
		loadTurnstile().then((t) => {
			if (!gone && t) widgetId = t.render(el, { sitekey: c.key, callback: (v: string) => (token = v), 'expired-callback': () => (token = '') });
		}).catch(() => (error = '보안 확인 위젯을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'));
		return () => {
			gone = true;
			const t = (window as any).turnstile;
			if (widgetId && t) t.remove(widgetId);
			widgetId = undefined;
		};
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (password !== retype) return (error = '비밀번호가 서로 달라요.');
		if (captcha && !token) return (error = '보안 확인을 먼저 완료해 주세요.');
		busy = true;
		try {
			const t = await api({ action: 'query', meta: 'tokens', type: 'createaccount' });
			const r = await api(
				{
					action: 'createaccount', username, password, retype, ...(email ? { email } : {}), ...(captcha ? { captchaWord: token } : {}),
					createreturnurl: location.origin + '/', createtoken: t.query.tokens.createaccounttoken
				},
				true
			);
			const c = r.createaccount;
			if (c.status === 'PASS') {
				await login(username, password).catch(() => {});
				await goto('/');
				return;
			}
			error = c.message || '계정을 만들지 못했어요. (' + c.status + ')';
			if (c.status === 'UI') unsupported = true;
		} catch (err) {
			error = (err as Error).message;
		} finally {
			busy = false;
			token = '';
			const t = (window as any).turnstile;
			if (widgetId && t) t.reset(widgetId);
		}
	}
</script>

<svelte:head><title>계정 만들기 - {page.data.site.sitename}</title></svelte:head>

<article class="kk-card mx-auto max-w-xl p-5 sm:p-8">
	<h1 class="text-[2rem] leading-tight font-extrabold">계정 만들기</h1>
	{#if session.loaded && !session.anon}
		<p class="mt-5">이미 <b>{session.name}</b> 계정으로 로그인했어요. <a class="font-bold" style="color: var(--kk-blue)" href="/">처음으로</a></p>
	{:else if !ready}
		<div class="mt-6 flex flex-col gap-3" role="status" aria-label="불러오는 중">{#each [100, 100, 100, 60] as w}<div class="kk-skeleton h-11" style="width: {w}%"></div>{/each}</div>
	{:else if !canCreate}
		<p class="mt-5">이 위키는 지금 새 계정을 받지 않아요.</p>
	{:else}
		<form class="mt-6 flex flex-col gap-4" onsubmit={submit}>
			<label class="flex flex-col gap-1.5 text-sm font-bold">사용자 이름
				<input class="kk-input h-11 px-3 text-base font-normal" bind:value={username} autocomplete="username" required />
			</label>
			<label class="flex flex-col gap-1.5 text-sm font-bold">비밀번호
				<input class="kk-input h-11 px-3 text-base font-normal" type="password" bind:value={password} autocomplete="new-password" required />
			</label>
			<label class="flex flex-col gap-1.5 text-sm font-bold">비밀번호 확인
				<input class="kk-input h-11 px-3 text-base font-normal" type="password" bind:value={retype} autocomplete="new-password" required />
			</label>
			<label class="flex flex-col gap-1.5 text-sm font-bold">이메일 (선택)
				<input class="kk-input h-11 px-3 text-base font-normal" type="email" bind:value={email} autocomplete="email" />
				<span class="text-xs font-normal" style="color: var(--kk-muted)">비밀번호를 잃어버렸을 때 계정을 찾는 데 쓰여요.</span>
			</label>
			{#if captcha}<div bind:this={widget} aria-label="보안 확인"></div>{/if}
			<label class="flex items-start gap-2 text-sm"><input class="mt-1" type="checkbox" bind:checked={agree} required />
				<span>이 위키에 남기는 기여가{#if page.data.site.license} <a class="underline" href={page.data.site.license.url} target="_blank" rel="noopener">{page.data.site.license.text}</a>{:else} 이 위키의 라이선스{/if}로 공개되는 데 동의합니다.</span>
			</label>
			{#if error}<p role="alert" class="alert font-bold" style="background: var(--kk-danger-soft); color: var(--kk-danger)">{error}</p>{/if}
			{#if unsupported}
				<p class="alert text-sm" style="background: var(--kk-warn-soft); color: var(--kk-warn)">이 위키가 요구하는 가입 절차를 여기서 다 처리하지 못할 수 있어요. 그럴 땐 <a class="font-bold underline" href="/w/Special:CreateAccount" data-sveltekit-reload>위키의 가입 화면</a>을 이용해 주세요.</p>
			{/if}
			<button class="kk-btn kk-btn-primary h-11" disabled={busy || (captcha !== null && !token)}>{busy ? '만드는 중…' : '가입'}</button>
		</form>
	{/if}
</article>
