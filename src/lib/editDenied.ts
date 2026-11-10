export function editDeniedOf(edit: unknown): string | null {
	if (edit === undefined || edit === true) return null;
	if (Array.isArray(edit)) return edit.length ? String((edit[0] as any).text ?? (edit[0] as any).code ?? '편집할 수 없어요.') : null;
	return edit === false ? '편집할 수 없어요.' : null;
}
