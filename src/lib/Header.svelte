<script lang="ts">
	import SearchBox from './SearchBox.svelte';
	import NotificationBell from './NotificationBell.svelte';
	import { session, logout, toggleTheme, toggleWide, isDark, ui } from './session.svelte';
	import { articlePath } from './wikitext';
	import { userPage } from './ns';
	import { identiconUrl } from './identicon';
	let avatarFailed = $state(false);
	const avatarSrc = $derived(!session.avatar || avatarFailed ? identiconUrl(session.name) : session.avatar);
	import type { NavItem } from './navbar';
	import type { Namespaces } from './ns';

	let { sitename, navbar, ns, specialNames }: { sitename: string; navbar: NavItem[]; ns: Namespaces; specialNames: string[] } = $props();
	let userMenu = $state(false);
	let dark = $state(false);
	let openGroup = $state<number | null>(null);

	function outside(node: HTMLElement, fn: () => void) {
		const on = (e: Event) => !node.contains(e.target as Node) && fn();
		document.addEventListener('pointerdown', on);
		return { destroy: () => document.removeEventListener('pointerdown', on) };
	}
	const item = 'flex items-center gap-3 rounded px-3 py-2 hover:bg-(--kk-accent-soft)';
</script>

<header class="relative z-40 text-white" style="background: var(--nm-bar)">
	<div class="mx-auto flex h-14 {ui.wide ? '' : 'max-w-[1400px]'} items-center gap-0.5 px-2 sm:gap-1 sm:px-5">
		<a href="/" class="mr-1 flex shrink-0 items-center gap-2 sm:mr-2" aria-label="{sitename} 홈">
			<img class="h-7 sm:hidden" src="/brand/bi_white.svg" alt="" />
			<img class="hidden h-7 sm:block" src="/brand/bi_vertical_white.png" alt="" />
		</a>
		<nav class="flex items-center" aria-label="위키">
			<a href="/recent" class="inline-flex h-10 items-center gap-1.5 rounded-md px-1.5 font-bold hover:bg-white/15 sm:px-2.5" aria-label="최근 변경"><span class="material-symbols-outlined" aria-hidden="true">history</span><span class="hidden lg:inline">최근 변경</span></a>
			<a href="/recent?talk=1" class="inline-flex h-10 items-center gap-1.5 rounded-md px-1.5 font-bold hover:bg-white/15 sm:px-2.5" aria-label="최근 토론"><span class="material-symbols-outlined" aria-hidden="true">forum</span><span class="hidden lg:inline">최근 토론</span></a>
			{#each navbar as g, gi (gi)}
				<div class="relative" use:outside={() => openGroup === gi && (openGroup = null)}>
					{#if g.children.length}
						<button class="inline-flex h-10 items-center rounded-md px-1.5 font-bold hover:bg-white/15 sm:gap-1 sm:px-2.5" aria-expanded={openGroup === gi} onclick={() => (openGroup = openGroup === gi ? null : gi)} aria-label={g.display}>
							{#if g.iconFa}<i class={g.iconFa} aria-hidden="true"></i>{:else}<span class="material-symbols-outlined" aria-hidden="true">{g.icon}</span>{/if}<span class="hidden xl:inline">{g.display}</span><span class="material-symbols-outlined hidden sm:inline" style="font-size:18px" aria-hidden="true">arrow_drop_down</span>
						</button>
						{#if openGroup === gi}
							<div class="kk-card absolute top-11 left-0 z-50 flex w-56 flex-col p-1 text-sm font-bold shadow-lg" style="color: var(--kk-text)" role="menu">
								{#each g.children as c}
									<a role="menuitem" class={item} href={c.href ?? '#'} title={c.title} data-sveltekit-reload={c.external || c.reload ? '' : undefined} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener' : undefined} onclick={() => (openGroup = null)}>
										{#if c.iconFa}<i class="{c.iconFa} w-5 text-center" style="color: var(--kk-muted)" aria-hidden="true"></i>{:else}<span class="material-symbols-outlined" style="font-size:20px; color: var(--kk-muted)" aria-hidden="true">{c.icon}</span>{/if}{c.display}
									</a>
								{/each}
							</div>
						{/if}
					{:else if g.href}
						<a href={g.href} class="inline-flex h-10 items-center gap-1.5 rounded-md px-1.5 font-bold hover:bg-white/15 sm:px-2.5" data-sveltekit-reload={g.external || g.reload ? '' : undefined} aria-label={g.display}>{#if g.iconFa}<i class={g.iconFa} aria-hidden="true"></i>{:else}<span class="material-symbols-outlined" aria-hidden="true">{g.icon}</span>{/if}<span class="hidden xl:inline">{g.display}</span></a>
					{/if}
				</div>
			{/each}
		</nav>

		<div class="ml-auto flex min-w-0 items-center gap-1.5">
			<a href="/random" class="hidden h-9 w-9 shrink-0 place-items-center rounded-md hover:brightness-95 sm:grid" style="background: var(--nm-field); color: var(--kk-accent-strong)" aria-label="아무 문서로 이동" title="아무 문서로 이동"><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">shuffle</span></a>
			<SearchBox variant="desktop" />
			<NotificationBell {specialNames} />
			<div class="relative" use:outside={() => (userMenu = false)}>
				{#if !session.loaded}
					<div class="h-9 w-9 animate-pulse rounded-full bg-white/25"></div>
				{:else}
					<button class="grid h-10 w-9 place-items-center rounded-md hover:bg-white/15 sm:w-10" aria-expanded={userMenu} aria-label={session.anon ? '사용자 메뉴' : session.name + ' 메뉴'} onclick={() => { userMenu = !userMenu; dark = isDark(); }}>
						{#if session.anon}<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1" aria-hidden="true">person</span>{:else}<img class="size-9 rounded-md" src={avatarSrc} data-gravatar={session.avatar} onerror={() => (avatarFailed = true)} alt="" />{/if}
					</button>
					{#if userMenu}
						<div class="kk-card absolute top-11 right-0 z-50 flex w-60 flex-col p-1 text-sm font-bold shadow-lg" style="color: var(--kk-text)" role="menu">
							<div class="flex items-center gap-3 border-b px-3 py-2" style="border-color: var(--kk-line)">
								{#if !session.anon}<img class="size-10 shrink-0 rounded-md" src={avatarSrc} onerror={() => (avatarFailed = true)} alt="" />{/if}
								<div class="min-w-0">
									<p class="text-xs font-normal" style="color: var(--kk-muted)">{session.anon ? '아이피' : '사용자'}</p>
									<p class="truncate text-base font-extrabold">{session.name}</p>
								</div>
							</div>
							<button role="menuitem" class="{item} text-left" onclick={() => { userMenu = false; ui.settingsOpen = true; }}><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">settings</span>설정</button>
							<button role="menuitem" class="{item} text-left" onclick={() => { toggleTheme(); dark = isDark(); }}><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">{dark ? 'light_mode' : 'dark_mode'}</span>{dark ? '밝은 화면으로' : '어두운 화면으로'}</button>
							<button role="menuitem" class="{item} text-left" onclick={toggleWide}><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">{ui.wide ? 'close_fullscreen' : 'open_in_full'}</span>{ui.wide ? '좁은 화면으로' : '넓은 화면으로'}</button>
							{#if !session.anon}
								<div class="my-1 border-t" style="border-color: var(--kk-line)"></div>
								<a role="menuitem" class={item} href="/w/Special:Preferences" data-sveltekit-reload onclick={() => (userMenu = false)}><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">info</span>내 정보</a>
								<a role="menuitem" class={item} href={articlePath(userPage(session.name, ns))} onclick={() => (userMenu = false)}><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">home_work</span>내 사용자 문서</a>
								<a role="menuitem" class={item} href="/w/Special:Watchlist" data-sveltekit-reload onclick={() => (userMenu = false)}><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">book_2</span>내 문서함</a>
							{/if}
							<div class="my-1 border-t" style="border-color: var(--kk-line)"></div>
							<a role="menuitem" class={item} href="/w/Special:Contributions/{encodeURIComponent(session.name)}" data-sveltekit-reload onclick={() => (userMenu = false)}><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">description</span>내 기여 목록</a>
							<div class="my-1 border-t" style="border-color: var(--kk-line)"></div>
							{#if session.anon}
								<button role="menuitem" class="{item} text-left" onclick={() => { userMenu = false; ui.loginOpen = true; }}><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">login</span>로그인</button>
							{:else}
								<button role="menuitem" class="{item} text-left" onclick={() => { userMenu = false; logout(); }}><span class="material-symbols-outlined" style="font-size:20px" aria-hidden="true">logout</span>로그아웃</button>
							{/if}
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
	
	<SearchBox variant="mobile" />
</header>
