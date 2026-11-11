import csv, random, datetime, math, sys
random.seed(20261014)
out=sys.argv[1]
start=datetime.date(2025,4,1); end=datetime.date(2026,9,30)
holidays={datetime.date(2025,7,4),datetime.date(2025,11,27),datetime.date(2025,12,25),datetime.date(2026,1,1),datetime.date(2026,7,4)}
missing={datetime.date(2026,2,10),datetime.date(2026,2,11),datetime.date(2026,2,12)}  # POS outage
rows=[]
d=start
while d<=end:
    if d in holidays: d+=datetime.timedelta(1); continue
    dow=d.weekday()  # 0 Mon
    season=1+0.08*math.sin((d.timetuple().tm_yday-100)/365*2*math.pi)
    for daypart in ('lunch','dinner'):
        if d in missing: continue
        weekend=dow>=5
        base_tx={'lunch':(95 if not weekend else 70),'dinner':(110 if not weekend else 150)}[daypart]
        ticket={'lunch':16.5,'dinner':27.0}[daypart]
        effect=1.0
        # Planted change: from 2026-04-01 weekday lunch traffic falls ~20%; weekday dinner ~3%.
        if d>=datetime.date(2026,4,1) and not weekend:
            effect=0.80 if daypart=='lunch' else 0.97
        tx=max(0,int(random.gauss(base_tx*season*effect,base_tx*0.09)))
        avg=random.gauss(ticket,ticket*0.04)
        sales=round(tx*avg,2)
        rows.append([d.isoformat(),daypart,f"{sales:.2f}",tx])
    d+=datetime.timedelta(1)
# data-quality issues a real export has
rows.insert(200,rows[199][:])                       # exact duplicate row
rows.append(['2026-05-14','lunch','-48.50',0])      # refund adjustment row
rows.append(['14/05/2026','dinner','1250.00',44])   # date in another format
rows.sort(key=lambda r:(r[0],r[1]))
with open(out,'w',newline='') as f:
    w=csv.writer(f); w.writerow(['date','daypart','net_sales_usd','transactions']); w.writerows(rows)
print(len(rows))
