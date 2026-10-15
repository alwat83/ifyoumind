import csv, datetime, statistics as st, math, sys, collections
path=sys.argv[1]
raw=list(csv.DictReader(open(path)))
issues=collections.Counter(); rows=[]; seen=set(); keys=collections.Counter()
for r in raw:
    t=tuple(r.values())
    if t in seen: issues['exact_duplicate']+=1; continue
    seen.add(t)
    ds=r['date']
    try: d=datetime.date.fromisoformat(ds)
    except ValueError:
        dd,mm,yy=ds.split('/'); d=datetime.date(int(yy),int(mm),int(dd)); issues['non_iso_date (normalised dd/mm/yyyy; day>12 so unambiguous)']+=1
    s=float(r['net_sales_usd']); tx=int(r['transactions'])
    if s<0: issues['negative_sales (refund adjustment, kept separately)']+=1; continue
    k=(d,r['daypart']); keys[k]+=1
    rows.append(dict(d=d,part=r['daypart'],sales=s,tx=tx))
dups=[k for k,v in keys.items() if v>1]
issues['same_date_and_daypart_twice (kept first, flagged)']+=len(dups)
final={}
for r in rows:
    k=(r['d'],r['part'])
    if k not in final: final[k]=r
rows=list(final.values())
days=sorted({r['d'] for r in rows}); start,end=days[0],days[-1]
alld={start+datetime.timedelta(i) for i in range((end-start).days+1)}
gaps=sorted(alld-set(days))
print('rows read',len(raw),'usable',len(rows),'days',len(days),'range',start,end)
print('issues',dict(issues))
print('missing days',[g.isoformat() for g in gaps])
def window(y): return datetime.date(y,4,1),datetime.date(y,9,30)
def sel(y,part,weekend):
    a,b=window(y); return [r for r in rows if a<=r['d']<=b and r['part']==part and (r['d'].weekday()>=5)==weekend]
def welch(x,y):
    mx,my=st.mean(x),st.mean(y); vx,vy=st.variance(x),st.variance(y)
    se=math.sqrt(vx/len(x)+vy/len(y)); diff=my-mx
    return diff, diff-1.96*se, diff+1.96*se, mx, my
print('\nApr-Sep 2026 vs Apr-Sep 2025, mean per day (95% CI of the change)')
for part in ('lunch','dinner'):
    for weekend in (False,True):
        a=sel(2025,part,weekend); b=sel(2026,part,weekend)
        for metric in ('sales','tx'):
            diff,lo,hi,mx,my=welch([r[metric] for r in a],[r[metric] for r in b])
            print(f"{part:6} {'weekend' if weekend else 'weekday'} {metric:5} 2025={mx:8.1f} 2026={my:8.1f} change={diff/mx*100:6.1f}% CI=[{lo/mx*100:6.1f}%,{hi/mx*100:6.1f}%] n={len(a)},{len(b)}")
        at=[r['sales']/r['tx'] for r in a if r['tx']]; bt=[r['sales']/r['tx'] for r in b if r['tx']]
        diff,lo,hi,mx,my=welch(at,bt); print(f"{part:6} {'weekend' if weekend else 'weekday'} ticket 2025={mx:6.2f} 2026={my:6.2f} change={diff/mx*100:5.1f}% CI=[{lo/mx*100:5.1f}%,{hi/mx*100:5.1f}%]")
# weekly weekday-lunch sales, timing of change
wk=collections.defaultdict(float)
for r in rows:
    if r['part']=='lunch' and r['d'].weekday()<5:
        monday=r['d']-datetime.timedelta(r['d'].weekday()); wk[monday]+=r['sales']
weeks=sorted(wk)
vals=[wk[w] for w in weeks]
chg=[abs(vals[i]-vals[i-1])/vals[i-1] for i in range(1,len(vals))]
print('\nweekday lunch weekly sales: median week-to-week change',round(st.median(chg)*100,1),'%')
# prior-year same week band
prior={w:wk[w] for w in weeks if w.year==2025}
first=None
for w in weeks:
    if w<datetime.date(2026,1,5): continue
    lastyear=[v for k,v in prior.items() if abs((k.replace(year=2026)-w).days)<=21]
    if not lastyear: continue
    rolling=[wk[x] for x in weeks if 0<=(w-x).days<28]
    if len(rolling)==4 and st.mean(rolling)<min(lastyear):
        first=w; break
print('first week where 4-week avg fell below every same-season 2025 week:',first)
