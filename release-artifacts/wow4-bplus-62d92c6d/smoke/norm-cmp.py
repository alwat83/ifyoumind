# Content comparison of two Hosting trees modulo esbuild hashed filenames (chunk-/main-/polyfills-/styles-XXXXXXXX).
# Usage: python3 -I norm-cmp.py <liveDir-or-sha-list-dir> <dist>   Both args are directories.
import hashlib, os, re, sys
H=re.compile(rb'(chunk|main|polyfills|styles)-[A-Z0-9]{8}')
def tree(d):
    out={}
    for r,ds,ns in os.walk(d):
        ds[:]=[x for x in ds if not x.startswith('.') and x!='__']
        for n in ns:
            if n.startswith('.'): continue
            p=os.path.join(r,n); rel=os.path.relpath(p,d); b=open(p,'rb').read()
            key=H.sub(lambda m:m.group(1)+b'-*',rel.encode()).decode()
            nb=H.sub(lambda m:m.group(1)+b'-*',b)
            out.setdefault(key,[]).append((hashlib.sha256(nb).hexdigest(),rel))
    return out
A,B=tree(sys.argv[1]),tree(sys.argv[2])
def ms(x): return sorted(h for h,_ in x)
same=diff=0; rows=[]
for k in sorted(set(A)|set(B)):
    a,b=A.get(k,[]),B.get(k,[])
    if not a: rows.append(('only-new',k,[r for _,r in b])); continue
    if not b: rows.append(('only-live',k,[r for _,r in a])); continue
    if ms(a)==ms(b): same+=len(a)
    else:
        # for chunk-* bucket, report unmatched members
        ah,bh=ms(a),ms(b); ua=[r for h,r in a if h not in bh]; ub=[r for h,r in b if h not in ah]
        rows.append(('changed',k,{'live':ua,'new':ub})); diff+=1
print('identical (modulo hashed names):',same)
for r in rows: print(*r)
