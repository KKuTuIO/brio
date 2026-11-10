import type * as Monaco from 'monaco-editor';

export const LANG = 'wikitext';

export const monarch: Monaco.languages.IMonarchLanguage = {
	defaultToken: '',
	tokenPostfix: '.wiki',
	brackets: [
		{ open: '[[', close: ']]', token: 'delimiter.square' },
		{ open: '{{', close: '}}', token: 'delimiter.curly' }
	],
	tokenizer: {
		root: [
			[/<!--/, 'comment', '@comment'],
			[/^(={1,6})(.+?)(\1)\s*$/, ['keyword.heading', 'keyword.heading', 'keyword.heading']],
			[/^[*#:;]+/, 'keyword.list'],
			[/^-{4,}/, 'keyword.rule'],
			[/^\{\|/, { token: 'keyword.table', next: '@table' }],
			[/\{\{\{[^}|]*(\|[^}]*)?\}\}\}/, 'variable.parameter'],
			[/\{\{/, { token: 'delimiter.curly', next: '@template' }],
			[/\[\[/, { token: 'delimiter.square', next: '@link' }],
			[/\[(https?:|\/\/)[^\s\]]+/, { token: 'string.link', next: '@extlink' }],
			[/'''''.+?'''''/, 'strong.emphasis'],
			[/'''.+?'''/, 'strong'],
			[/''.+?''/, 'emphasis'],
			[/<\/?(nowiki|pre|ref|references|gallery|syntaxhighlight|source|math|noinclude|includeonly|onlyinclude)\b[^>]*>/, 'tag.special'],
			[/<\/?[a-zA-Z][\w-]*[^>]*>/, 'tag'],
			[/__[A-Z]+__/, 'constant'],
			[/&[#\w]+;/, 'string.escape'],
			[/~{3,5}/, 'constant']
		],
		comment: [
			[/-->/, 'comment', '@pop'],
			[/[^-]+/, 'comment'],
			[/-/, 'comment']
		],
		template: [
			[/\}\}/, { token: 'delimiter.curly', next: '@pop' }],
			[/\{\{/, { token: 'delimiter.curly', next: '@template' }],
			[/\|/, 'delimiter'],
			[/[^|{}=]+(?==)/, 'attribute.name'],
			[/\[\[/, { token: 'delimiter.square', next: '@link' }],
			[/[^|{}]+/, 'type.identifier']
		],
		link: [
			[/\]\]/, { token: 'delimiter.square', next: '@pop' }],
			[/\|/, 'delimiter'],
			[/[^|\]]+/, 'string.link']
		],
		extlink: [
			[/\]/, { token: 'string.link', next: '@pop' }],
			[/[^\]]+/, 'string.link']
		],
		table: [
			[/^\|\}/, { token: 'keyword.table', next: '@pop' }],
			[/^(\|[-+]?|!)/, 'keyword.table'],
			[/\|\|/, 'keyword.table'],
			{ include: 'root' }
		]
	}
};

export const lightTheme: Monaco.editor.IStandaloneThemeData = {
	base: 'vs',
	inherit: true,
	colors: { 'editor.background': '#ffffff', 'editorLineNumber.foreground': '#9fb2a0' },
	rules: themeRules(false)
};
export const darkTheme: Monaco.editor.IStandaloneThemeData = {
	base: 'vs-dark',
	inherit: true,
	colors: { 'editor.background': '#172019', 'editorLineNumber.foreground': '#56705a', 'editor.lineHighlightBackground': '#1d2820' },
	rules: themeRules(true)
};

function themeRules(dark: boolean): Monaco.editor.ITokenThemeRule[] {
	const c = dark
		? { head: '4ade80', link: '7db3ff', tpl: 'fbbf24', cmt: '6b8a70', tag: 'c084fc', tbl: 'f472b6', str: 'a3e635' }
		: { head: '15803d', link: '2563eb', tpl: 'b45309', cmt: '8aa08d', tag: '7c3aed', tbl: 'be185d', str: '4d7c0f' };
	return [
		{ token: 'keyword.heading.wiki', foreground: c.head, fontStyle: 'bold' },
		{ token: 'keyword.list.wiki', foreground: c.head },
		{ token: 'keyword.rule.wiki', foreground: c.head },
		{ token: 'keyword.table.wiki', foreground: c.tbl, fontStyle: 'bold' },
		{ token: 'string.link.wiki', foreground: c.link },
		{ token: 'delimiter.square.wiki', foreground: c.link, fontStyle: 'bold' },
		{ token: 'delimiter.curly.wiki', foreground: c.tpl, fontStyle: 'bold' },
		{ token: 'type.identifier.wiki', foreground: c.tpl },
		{ token: 'attribute.name.wiki', foreground: c.str },
		{ token: 'variable.parameter.wiki', foreground: c.tpl },
		{ token: 'comment.wiki', foreground: c.cmt, fontStyle: 'italic' },
		{ token: 'tag.wiki', foreground: c.tag },
		{ token: 'tag.special.wiki', foreground: c.tag, fontStyle: 'bold' },
		{ token: 'strong.wiki', fontStyle: 'bold' },
		{ token: 'emphasis.wiki', fontStyle: 'italic' },
		{ token: 'strong.emphasis.wiki', fontStyle: 'bold italic' },
		{ token: 'constant.wiki', foreground: c.str }
	];
}
