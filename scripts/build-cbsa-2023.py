"""Regenerate functions/src/intelligence/geography/cbsa-2023.ts from the official 2023 CBSA delineation.

Needs network access to www2.census.gov and `pip install openpyxl`. Run from the repository root:
    python3 scripts/build-cbsa-2023.py
Then run `npm --prefix functions test`; the geography test checks counts and the canonical checksum.
"""
import io, json, urllib.request
import openpyxl

SOURCE = 'https://www2.census.gov/programs-surveys/metro-micro/geographies/reference-files/2023/delineation-files/list1_2023.xlsx'
book = openpyxl.load_workbook(io.BytesIO(urllib.request.urlopen(SOURCE, timeout=60).read()), read_only=True)
rows = list(book.active.iter_rows(values_only=True))
head = next(i for i, r in enumerate(rows) if r and 'CBSA Code' in r)
cols = {name: j for j, name in enumerate(rows[head])}
cbsa, county = {}, {}
for r in rows[head + 1:]:
    if not r or not r[cols['CBSA Code']] or not r[cols['FIPS State Code']]:
        continue
    code = str(r[cols['CBSA Code']]).strip()
    kind = 'Metro' if 'Metropolitan' in str(r[cols['Metropolitan/Micropolitan Statistical Area']]) else 'Micro'
    cbsa[code] = [str(r[cols['CBSA Title']]).strip(), kind]
    county[f"{int(r[cols['FIPS State Code']]):02d}{int(r[cols['FIPS County Code']]):03d}"] = code

lines = [
    '// Generated from the U.S. Census Bureau / OMB core-based statistical area delineation file, List 1,',
    '// July 2023 (public domain). Source: ' + SOURCE,
    '// Regenerate with scripts/build-cbsa-2023.py; do not edit by hand.',
    '/* eslint-disable */',
    'export const CBSA_2023_SOURCE=' + json.dumps(SOURCE) + ';',
    'export const CBSA_2023_VINTAGE="July 2023";',
    '/** CBSA code -> [title, "Metro" | "Micro"]. */',
    'export const CBSA_2023:Record<string,[string,"Metro"|"Micro"]>=' + json.dumps(cbsa, separators=(',', ':'), ensure_ascii=False) + ';',
    '/** 5-digit county FIPS (state + county) -> CBSA code. Counties outside every CBSA are absent. */',
    'export const COUNTY_TO_CBSA_2023:Record<string,string>=' + json.dumps(county, separators=(',', ':'), ensure_ascii=False) + ';',
    '',
]
open('functions/src/intelligence/geography/cbsa-2023.ts', 'w', encoding='utf-8').write('\n'.join(lines))
print(f'{len(cbsa)} CBSAs, {len(county)} counties')
