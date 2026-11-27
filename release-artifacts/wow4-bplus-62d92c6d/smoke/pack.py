# Deterministic Hosting archive: sorted regular non-dot files, fixed mtime/owner/mode, gzip mtime 0.
# Usage: python3 -I pack.py <srcDir> <out.tar.gz> <MANIFEST.sha256>
import gzip, hashlib, io, os, sys, tarfile
src, out, manifest = sys.argv[1:4]
files = []
for root, dirs, names in os.walk(src):
    dirs[:] = sorted(d for d in dirs if not d.startswith('.'))
    for n in names:
        if n.startswith('.'):
            continue
        p = os.path.join(root, n)
        if os.path.islink(p) or not os.path.isfile(p):
            raise SystemExit(f'refusing non-regular file {p}')
        files.append(os.path.relpath(p, src))
files.sort()
lines = []
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode='w', format=tarfile.USTAR_FORMAT) as tar:
    for rel in files:
        data = open(os.path.join(src, rel), 'rb').read()
        lines.append(f'{hashlib.sha256(data).hexdigest()}  {rel}\n')
        info = tarfile.TarInfo(rel)
        info.size, info.mtime, info.mode, info.uid, info.gid, info.uname, info.gname = len(data), 1795651200, 0o644, 0, 0, '', ''
        tar.addfile(info, io.BytesIO(data))
with open(out, 'wb') as f, gzip.GzipFile(filename='', mode='wb', fileobj=f, mtime=0, compresslevel=9) as gz:
    gz.write(buf.getvalue())
open(manifest, 'w').write(''.join(lines))
print(len(files), 'files')
