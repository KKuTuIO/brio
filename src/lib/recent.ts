export type Change = { title: string; user: string; anon: boolean; comment: string; ts: string; delta: number | null; kind: 'edit' | 'new' | 'delete' | 'move' | 'log'; revid: number; old_revid: number; logtype?: string };
export const TABS = [
	{ key: 'all', label: '전체' },
	{ key: 'create', label: '새 문서' },
	{ key: 'delete', label: '삭제' },
	{ key: 'move', label: '이동' },
	{ key: 'revert', label: '되돌림' }
] as const;

