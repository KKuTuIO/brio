export const DEFAULTS = {
	theme: 'auto' as 'auto' | 'light' | 'dark',
	nowrapTable: false,
	headingFold: 'default' as 'default' | 'fold' | 'unfold',
	unfoldCollapsible: false,
	strike: 'show' as 'show' | 'remove' | 'hide',
	footnote: 'popover' as 'browser' | 'popover' | 'popup' | 'expand',
	image: 'show' as 'show' | 'hide',
	categoryPos: 'top' as 'top' | 'bottom' | 'both',
	fontSize: '0' as '-2' | '-1' | '0' | '1' | '2' | '3',
	extIcon: true,
	absoluteTime: false,
	dStrike: 'show' as 'show' | 'remove' | 'hide',
	dBold: 'show' as 'show' | 'remove' | 'hide',
	black: false,
	font: 'auto' as 'auto' | 'pretendard' | 'browser' | 'apple' | 'malgun' | 'nanum',
	navFixed: false,
	sidebar: 'default' as 'default' | 'left' | 'vertical',
	tocButton: 'default' as 'default' | 'link' | 'popup' | 'disabled'
};
export type Prefs = typeof DEFAULTS;
export const STORAGE_KEY = 'brio_settings';

export const prefs = $state<Prefs>({ ...DEFAULTS });

export function loadPrefs() {
	try {
		const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
		for (const k of Object.keys(DEFAULTS) as (keyof Prefs)[]) if (k in raw && typeof raw[k] === typeof DEFAULTS[k]) (prefs as any)[k] = raw[k];
	} catch {
	}
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
	prefs[key] = value;
	try {
		const diff: Record<string, unknown> = {};
		for (const k of Object.keys(DEFAULTS) as (keyof Prefs)[]) if (prefs[k] !== DEFAULTS[k]) diff[k] = prefs[k];
		if (Object.keys(diff).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(diff));
		else localStorage.removeItem(STORAGE_KEY);
	} catch {
	}
}

export function applyPrefs() {
	const r = document.documentElement;
	const set = (k: string, v: string | boolean) => (v === false || v === '' ? r.removeAttribute('data-' + k) : r.setAttribute('data-' + k, v === true ? '1' : v));
	if (prefs.theme === 'auto') r.removeAttribute('data-theme');
	else r.dataset.theme = prefs.theme;
	set('nowrap-table', prefs.nowrapTable);
	set('strike', prefs.strike === 'show' ? '' : prefs.strike);
	set('img', prefs.image === 'show' ? '' : prefs.image);
	set('fs', prefs.fontSize === '0' ? '' : prefs.fontSize);
	set('no-ext-icon', !prefs.extIcon);
	set('d-strike', prefs.dStrike === 'show' ? '' : prefs.dStrike);
	set('d-bold', prefs.dBold === 'show' ? '' : prefs.dBold);
	set('black', prefs.black);
	set('font', prefs.font === 'auto' ? '' : prefs.font);
}
