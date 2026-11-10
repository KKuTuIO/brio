import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import { LANG, darkTheme, lightTheme, monarch } from './wikitextLanguage';

let ready = false;
export function setup() {
	if (ready) return monaco;
	ready = true;
	(self as any).MonacoEnvironment = { getWorker: () => new EditorWorker() };
	monaco.languages.register({ id: LANG, aliases: ['Wikitext', 'mediawiki'] });
	monaco.languages.setMonarchTokensProvider(LANG, monarch);
	monaco.languages.setLanguageConfiguration(LANG, {
		comments: { blockComment: ['<!--', '-->'] },
		brackets: [['[[', ']]'], ['{{', '}}'], ['[', ']'], ['(', ')']],
		autoClosingPairs: [
			{ open: '[[', close: ']]' },
			{ open: '{{', close: '}}' },
			{ open: '[', close: ']' },
			{ open: '(', close: ')' },
			{ open: '<!--', close: '-->' }
		],
		surroundingPairs: [{ open: "'''", close: "'''" }, { open: "''", close: "''" }, { open: '[[', close: ']]' }, { open: '{{', close: '}}' }, { open: '<', close: '>' }]
	});
	monaco.editor.defineTheme('brio-light', lightTheme);
	monaco.editor.defineTheme('brio-dark', darkTheme);
	return monaco;
}
export { LANG };
export type { monaco };
