import json
from fontTools.ttLib import TTFont

font = TTFont('static/fonts/MaterialSymbolsRounded.woff2')
glyph_char = {}
for cp, g in font.getBestCmap().items():
    glyph_char.setdefault(g, chr(cp))

names = set()
for lookup in font['GSUB'].table.LookupList.Lookup:
    for st in lookup.SubTable:
        st = getattr(st, 'ExtSubTable', st)
        for first, ligs in getattr(st, 'ligatures', {}).items():
            for lig in ligs:
                chars = [glyph_char.get(first)] + [glyph_char.get(c) for c in lig.Component]
                if all(chars):
                    n = ''.join(chars).lower()
                    if n.replace('_', '').isalnum():
                        names.add(n)
json.dump(sorted(names), open('src/lib/materialIcons.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(names), 'icon names written')
