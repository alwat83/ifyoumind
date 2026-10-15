#!/usr/bin/env python3
"""Keep only the metro/micro (summary level 310) rows of the ACS table-based summary files.

The full files (38 MB and 17 MB) are listed in data/life/raw/MANIFEST.json with their SHA-256
but are not committed. This script reads them, verifies their hashes against the manifest, and
writes the header line plus every line whose GEO_ID starts with "310M" unchanged, byte for byte.
Usage: python3 scripts/life-data/extract_acs.py <dir with the full .dat files>
"""
import hashlib, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / 'data/life/raw'
OUT = ROOT / 'data/life/extracts'
TABLES = ['acsdt5y2024-b25031.dat', 'acsdt5y2024-b25064.dat']

def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1 << 20), b''):
            h.update(block)
    return h.hexdigest()

def main(src):
    manifest = {f['filename']: f for f in json.loads((RAW / 'MANIFEST.json').read_text())['files']}
    OUT.mkdir(parents=True, exist_ok=True)
    record = []
    for name in TABLES:
        full = pathlib.Path(src) / name
        expected = manifest[name]['sha256']
        actual = sha256(full)
        if actual != expected:
            sys.exit(f'{name}: sha256 {actual} does not match the manifest {expected}')
        target = OUT / name.replace('.dat', '-cbsa.dat')
        kept = 0
        with open(full, 'rb') as f, open(target, 'wb') as out:
            out.write(f.readline())
            for line in f:
                if line.startswith(b'310M'):
                    out.write(line)
                    kept += 1
        record.append({'source': name, 'source_sha256': expected, 'source_url': manifest[name]['url'],
                       'extract': target.name, 'extract_sha256': sha256(target), 'rows': kept,
                       'rule': 'header line + lines whose GEO_ID starts with "310M" (CBSA, summary level 310), bytes unchanged'})
    (OUT / 'EXTRACTS.json').write_text(json.dumps(record, indent=1) + '\n')
    print(json.dumps(record, indent=1))

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
