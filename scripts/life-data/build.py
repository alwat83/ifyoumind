#!/usr/bin/env python3
"""Build the ifYouMind Life place dataset from official files (standard library only).

Inputs (all listed with SHA-256 in data/life/raw/MANIFEST.json or data/life/extracts/EXTRACTS.json):
  BEA Regional Price Parities 2024: MARPP (metro areas), PARPP (state metro/nonmetro portions)
  ACS 2020-2024 5-year median gross rent: B25031 (by bedrooms), B25064 (all units), CBSA rows
  OMB July 2023 delineations: list1 (CBSA -> counties/states), list2 (principal cities)
Output: data/life/build/life-places-v2024-1.json (deterministic; no timestamps).

Usage: python3 -I scripts/life-data/build.py          (writes the output)
       python3 -I scripts/life-data/build.py --check  (fails if the output is not up to date)
"""
import csv, hashlib, io, json, math, pathlib, sys, zipfile

sys.dont_write_bytecode = True

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import xlsx  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / 'data/life/raw'
EXTRACTS = ROOT / 'data/life/extracts'
OUT = ROOT / 'data/life/build/life-places-v2024-1.json'
YEAR = '2024'
VERSION = '2024-1'

# Standard USPS codes for the FIPS state codes in the OMB files (fixed reference, not survey data).
USPS = {'01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE',
        '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA',
        '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
        '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM',
        '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
        '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
        '54': 'WV', '55': 'WI', '56': 'WY', '72': 'PR'}

LINES = {'1': 'all', '2': 'goods', '3': 'housing', '4': 'utilities', '5': 'other'}

# ACS table-based summary file codes (ACS Summary File technical documentation, "annotation values").
ACS_NO_ESTIMATE = -666666666   # estimate could not be computed (too few sample observations)
ACS_OPEN_ENDED = -333333333    # MOE code: the median falls in an open-ended interval (e.g. 3,500+)
ACS_NO_MOE = -222222222        # MOE could not be computed
ACS_CODES = {-999999999, -888888888, -666666666, -555555555, -333333333, -222222222}


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verified(name, registry):
    path = (EXTRACTS if name.endswith('-cbsa.dat') else RAW) / name
    expected = registry[name]
    actual = sha256(path)
    if actual != expected:
        sys.exit(f'{name}: sha256 {actual} does not match the recorded {expected}')
    return path


def read_rpp(zip_path, member):
    """{geo: {'name':..., 'all':..., 'goods':..., ...}} for the data year.

    '(NA)' and 0.000 become None: BEA prints 0.000 for state portions that do not exist
    (e.g. the nonmetropolitan portion of New Jersey, Delaware, Rhode Island, D.C.)."""
    with zipfile.ZipFile(zip_path) as z:
        text = z.read(member).decode('utf-8-sig')
    out = {}
    for row in csv.DictReader(io.StringIO(text)):
        geo = (row.get('GeoFIPS') or '').strip().strip('"')
        line = (row.get('LineCode') or '').strip()
        if not geo.isdigit() or line not in LINES:
            continue
        rec = out.setdefault(geo, {'name': row['GeoName'].strip()})
        value = row[YEAR].strip()
        rec[LINES[line]] = None if value == '(NA)' or float(value) <= 0 else float(value)
    return out


def solve(a, b):
    """Gaussian elimination with partial pivoting for a small dense system."""
    n = len(b)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(m[r][c]))
        m[c], m[p] = m[p], m[c]
        for r in range(n):
            if r != c:
                f = m[r][c] / m[c][c]
                m[r] = [x - f * y for x, y in zip(m[r], m[c])]
    return [m[i][n] / m[i][i] for i in range(n)]


def fit_weights(metros):
    """Least squares, no intercept: ln(all/100) = sum_k w_k ln(component_k/100) over the metros."""
    keys = ['goods', 'housing', 'utilities', 'other']
    rows = [r for r in metros.values() if all(r.get(k) for k in keys + ['all'])]
    x = [[math.log(r[k] / 100) for k in keys] for r in rows]
    y = [math.log(r['all'] / 100) for r in rows]
    xtx = [[sum(xi[i] * xi[j] for xi in x) for j in range(4)] for i in range(4)]
    xty = [sum(xi[i] * yi for xi, yi in zip(x, y)) for i in range(4)]
    w = dict(zip(keys, solve(xtx, xty)))
    resid = [100 * math.exp(sum(w[k] * v for k, v in zip(keys, xi))) - r['all'] for xi, r in zip(x, rows)]
    return w, {'n': len(rows), 'rmse': math.sqrt(sum(e * e for e in resid) / len(resid)), 'maxAbs': max(abs(e) for e in resid)}


def price(rec, weights):
    """Published components plus the derived non-housing composite; None if a component is missing."""
    if rec is None or any(rec.get(k) is None for k in ('all', 'goods', 'housing', 'utilities', 'other')):
        return None
    wg, wo = weights['goods'], weights['other']
    non_housing = math.exp(wg * math.log(rec['goods']) + wo * math.log(rec['other']))
    return {k: rec[k] for k in ('all', 'goods', 'housing', 'utilities', 'other')} | {'nonHousing': round(non_housing, 3)}


def read_acs(path, columns):
    """{cbsa: {name: (estimate, moe) | None, ...}, ...} plus a list of exclusions with reasons."""
    out, excluded = {}, []
    with open(path, encoding='utf-8') as f:
        header = f.readline().rstrip('\n').split('|')
        for line in f:
            cells = dict(zip(header, line.rstrip('\n').split('|')))
            cbsa = cells['GEO_ID'][-5:]
            rec = out.setdefault(cbsa, {})
            for key, (e_col, m_col) in columns.items():
                e, m = int(cells[e_col]), int(cells[m_col])
                if e == ACS_NO_ESTIMATE or e in ACS_CODES:
                    rec[key] = None
                    excluded.append([cbsa, key, 'no_estimate'])
                elif m == ACS_OPEN_ENDED:
                    rec[key] = None   # the published value is only a bound such as "3,500+" or "<100"
                    excluded.append([cbsa, key, 'open_ended'])
                elif m in ACS_CODES or m < 0:
                    rec[key] = {'e': e, 'm': None}
                    excluded.append([cbsa, key, 'no_moe'])
                else:
                    rec[key] = {'e': e, 'm': m}
    return out, excluded


def build():
    manifest = {f['filename']: f for f in json.loads((RAW / 'MANIFEST.json').read_text())['files']}
    extracts = {e['extract']: e for e in json.loads((EXTRACTS / 'EXTRACTS.json').read_text())}
    registry = {k: v['sha256'] for k, v in manifest.items()} | {k: v['extract_sha256'] for k, v in extracts.items()}

    metros = read_rpp(verified('MARPP.zip', registry), 'MARPP_MSA_2008_2024.csv')
    portions = read_rpp(verified('PARPP.zip', registry), 'PARPP_PORT_2008_2024.csv')
    raw_w, fit = fit_weights({g: r for g, r in metros.items() if g not in ('00000', '00999')})
    share = raw_w['goods'] + raw_w['other']
    weights = {'goods': round(raw_w['goods'] / share, 3)}
    weights['other'] = round(1 - weights['goods'], 3)

    rents, excl31 = read_acs(verified('acsdt5y2024-b25031-cbsa.dat', registry),
                             {'br1': ('B25031_E003', 'B25031_M003'), 'br2': ('B25031_E004', 'B25031_M004')})
    overall, excl64 = read_acs(verified('acsdt5y2024-b25064-cbsa.dat', registry), {'all': ('B25064_E001', 'B25064_M001')})

    # OMB list 1: CBSA title, type and the states its counties are in.
    cbsas = {}
    for row in list(xlsx.rows(verified('list1_2023.xlsx', registry)))[3:]:
        if len(row) < 12 or not row[0].isdigit():
            continue
        c = cbsas.setdefault(row[0], {'name': row[3], 'type': 'metro' if row[4].startswith('Metro') else 'micro', 'states': [], 'counties': 0})
        if row[9] not in c['states']:
            c['states'].append(row[9])
        c['counties'] += 1
    # OMB list 2: principal cities. The first principal city's state is the area's primary state.
    places = []
    for row in list(xlsx.rows(verified('list2_2023.xlsx', registry)))[3:]:
        if len(row) < 6 or not row[0].isdigit():
            continue
        places.append([row[3], USPS[row[4]], row[0]])
        cbsas[row[0]].setdefault('primaryState', row[4])

    state_nonmetro = {}
    for geo, rec in sorted(portions.items()):
        if geo.endswith('999') and geo != '00999':
            p = price(rec, weights)
            if p:
                state_nonmetro[geo[:2]] = {'name': rec['name'].rstrip(' *'), 'geo': geo} | p

    areas, gaps = {}, []
    for code in sorted(cbsas):
        c = cbsas[code]
        primary = c.get('primaryState') or c['states'][0]
        metro_price = price(metros.get(code), weights) if c['type'] == 'metro' else None
        if metro_price:
            px = {'source': 'metro', 'geo': code} | metro_price
        elif primary in state_nonmetro:
            # BEA: the nonmetropolitan portion of a state includes its micropolitan counties.
            px = {'source': 'state_nonmetro'} | state_nonmetro[primary]
            px.pop('name')
        else:
            px = None
            gaps.append([code, 'price', 'BEA price parities do not cover Puerto Rico' if primary == '72' else
                         f'BEA publishes no metro value for this area and no nonmetropolitan value for {USPS[primary]}'])
        rent = {k: (overall.get(code) or {}).get(k) if k == 'all' else (rents.get(code) or {}).get(k) for k in ('all', 'br1', 'br2')}
        if code not in rents:
            gaps.append([code, 'rent', 'no ACS row for this area'])
        areas[code] = {'name': c['name'], 'type': c['type'], 'states': [USPS[s] for s in c['states']],
                       'primaryState': USPS[primary], 'price': px, 'rent': rent}

    rpp_metros = sorted(g for g in metros if g not in ('00000', '00999'))
    if any(g not in areas for g in rpp_metros):
        sys.exit('BEA metro not found in the OMB 2023 delineation: ' + ', '.join(g for g in rpp_metros if g not in areas))

    src = lambda name: {'file': name, 'url': manifest[name]['url'], 'sha256': manifest[name]['sha256'],
                        'lastModified': manifest[name].get('last_modified')}
    return {
        'schema': 'ifyoumind.life.places/1',
        'version': VERSION,
        'sources': {
            'bea-rpp-2024': {'title': 'BEA Regional Price Parities by MSA and by state portion (MARPP, PARPP)', 'dataYear': 2024,
                             'released': '2026-02-19', 'unit': 'index, U.S. = 100',
                             'files': [src('MARPP.zip'), src('PARPP.zip')],
                             'definitions': {'all': 'RPPs: All items', 'goods': 'RPPs: Goods', 'housing': 'RPPs: Services: Housing (tenant rents)',
                                             'utilities': 'RPPs: Services: Utilities', 'other': 'RPPs: Services: Other (services except rents and utilities)'},
                             'notes': ['Nonmetropolitan portion includes micropolitan counties (BEA footnote).',
                                       'Metropolitan areas follow OMB bulletin 23-01, July 21, 2023.']},
            'acs5-2024-b25031': {'title': 'ACS 2020-2024 5-year, B25031 Median gross rent by bedrooms', 'period': '2020-2024',
                                 'released': '2026-01-29', 'unit': 'dollars per month (2024 inflation-adjusted)', 'moe': '90 percent margin of error',
                                 'files': [src('acsdt5y2024-b25031.dat') | {'extract': extracts['acsdt5y2024-b25031-cbsa.dat']['extract'],
                                                                            'extractSha256': extracts['acsdt5y2024-b25031-cbsa.dat']['extract_sha256']}]},
            'acs5-2024-b25064': {'title': 'ACS 2020-2024 5-year, B25064 Median gross rent', 'period': '2020-2024',
                                 'released': '2026-01-29', 'unit': 'dollars per month (2024 inflation-adjusted)', 'moe': '90 percent margin of error',
                                 'files': [src('acsdt5y2024-b25064.dat') | {'extract': extracts['acsdt5y2024-b25064-cbsa.dat']['extract'],
                                                                            'extractSha256': extracts['acsdt5y2024-b25064-cbsa.dat']['extract_sha256']}]},
            'omb-cbsa-2023': {'title': 'OMB CBSA delineations and principal cities, July 2023 (Census lists 1 and 2)',
                              'files': [src('list1_2023.xlsx'), src('list2_2023.xlsx')]},
        },
        'method': {
            'priceLevel': 'nonHousing',
            'nonHousing': {
                'status': 'proposed, pending founder approval',
                'formula': 'exp(wGoods*ln(goods) + wOther*ln(other)); utilities and housing excluded',
                'weights': weights,
                'derivation': 'Goods and other-services shares from a least-squares fit of ln(all items) on the four published '
                              'components across the BEA metros; BEA does not publish area expenditure weights.',
                'fit': {'n': fit['n'], 'rmse': round(fit['rmse'], 3), 'maxAbs': round(fit['maxAbs'], 3),
                        'rawWeights': {k: round(v, 4) for k, v in raw_w.items()}},
                'whyUtilitiesExcluded': 'ACS gross rent already includes utilities paid by the renter.',
            },
            'priceFallback': ['metro', 'state_nonmetro', 'none'],
            'rent': 'ACS median gross rent (contract rent plus renter-paid utilities and fuels). Values published only as a bound '
                    '(open-ended interval) or without an estimate are left out (null).',
        },
        'national': {'us': price(metros['00000'], weights), 'usNonmetro': price(metros['00999'], weights)},
        'stateNonmetro': state_nonmetro,
        'areas': areas,
        'places': sorted(places, key=lambda p: (p[1], p[0], p[2])),
        'gaps': gaps,
        'excluded': sorted(excl31 + excl64),
    }


def dump(data):
    """Sorted, one area per line, so diffs between versions stay readable."""
    lines = ['{']
    keys = list(data)
    for i, key in enumerate(keys):
        comma = ',' if i < len(keys) - 1 else ''
        value = data[key]
        if key in ('areas', 'stateNonmetro'):
            inner = [f'  {json.dumps(k)}:{json.dumps(v, separators=(",", ":"), sort_keys=True)}' for k, v in value.items()]
            lines.append(f' {json.dumps(key)}:{{\n' + ',\n'.join(inner) + f'\n }}{comma}')
        elif key in ('places', 'gaps', 'excluded'):
            inner = [f'  {json.dumps(v, separators=(",", ":"))}' for v in value]
            lines.append(f' {json.dumps(key)}:[\n' + ',\n'.join(inner) + f'\n ]{comma}')
        else:
            lines.append(f' {json.dumps(key)}:{json.dumps(value, indent=1, sort_keys=True)}{comma}'.replace('\n', '\n '))
    lines.append('}')
    return '\n'.join(lines) + '\n'


if __name__ == '__main__':
    text = dump(build())
    if '--check' in sys.argv:
        if not OUT.exists() or OUT.read_text() != text:
            sys.exit(f'{OUT.relative_to(ROOT)} is out of date: run python3 -I scripts/life-data/build.py')
        print('up to date')
    else:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(text)
        print(f'wrote {OUT.relative_to(ROOT)} ({len(text)} bytes)')
