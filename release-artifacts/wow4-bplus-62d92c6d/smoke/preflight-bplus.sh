#!/bin/bash
# Read-only production preflight (GET only). Usage: preflight-bplus.sh <expectedLiveVersion> <outPrefix>
S=/private/tmp/claude-502/-Users-albertwatson-Development-ifyoumind/eb986a14-f6ba-4de2-aff5-a9609cda3555/scratchpad; EXP=$1; OUT=$2
date -u +%FT%TZ
node $S/tools/gget.js "https://firebasehosting.googleapis.com/v1beta1/sites/ifyoumind-473fe/channels/live/releases?pageSize=1" "https://cloudfunctions.googleapis.com/v2/projects/ifyoumind-473fe/locations/-/functions?pageSize=100" > $OUT.jsonl
python3 -I - $OUT.jsonl $S/functions-pre-snapshot.json $EXP <<'PY'
import json,sys,hashlib
L=[json.loads(l) for l in open(sys.argv[1])]
r=L[0]['body']['releases'][0]; v=r['version']['name'].split('/')[-1]; print('LIVE',r['name'].split('/')[-1],v,'PASS' if v==sys.argv[3] else 'FAIL')
pre=json.load(open(sys.argv[2])); now={}; enr={}
for f in L[1]['body']['functions']:
  n=f['name'].split('/')[-1]; sc=f.get('serviceConfig',{}); now[n]=(f['state'],f['updateTime'],sc.get('revision'))
  e=(sc.get('environmentVariables') or {}).get('SUBSCRIPTION_ENROLLMENT')
  if e is not None: enr[n]='empty' if not e.strip() else hashlib.sha256(e.encode()).hexdigest()[:10]
ch=[n for n in set(pre)|set(now) if n not in now or n not in pre or (pre[n]['state'],pre[n]['updateTime'],pre[n]['revision'])!=now[n]]
print('FUNCTIONS',len(now),'changed',ch,'PASS' if len(now)==35 and not ch else 'FAIL')
print('ENROLLMENT','PASS' if sorted({x for x in enr.values() if x!='empty'})==['65c3faa285'] and sum(x!='empty' for x in enr.values())==5 else 'FAIL')
PY
python3 -I - <<'PY'
import urllib.request
for p in ['/','/pricing','/discover/']:
    r=urllib.request.urlopen('https://ifyoumind.com'+p); keys=['strict-transport-security','x-content-type-options','x-frame-options','referrer-policy','permissions-policy']+(['content-security-policy'] if p=='/discover/' else [])
    print('HEADERS',p,'PASS' if all(r.headers.get(k) for k in keys) else 'FAIL')
PY
echo "DISCOVERY_CSP $(curl -sS -o /dev/null -D - https://ifyoumind.com/discover/ | grep -i content-security-policy | shasum -a 256 | cut -c1-16) (expect ee8df606908ccf85)"
