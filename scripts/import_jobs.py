"""Import a private NDJSON dataset in idempotent batches. Never logs credentials."""
import argparse, json, os, time, urllib.request, urllib.error
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--url',required=True);p.add_argument('--file',default='data/jobs.ndjson');p.add_argument('--env-file',default='.dev.vars');a=p.parse_args()
env=dict(os.environ)
for line in Path(a.env_file).read_text(encoding='utf-8-sig').splitlines():
 if '=' in line and not line.lstrip().startswith('#'):
  k,v=line.split('=',1)
  try:env[k]=json.loads(v)
  except ValueError:env[k]=v.strip()
if not a.url.startswith(('https://','http://127.0.0.1:','http://localhost:')):raise ValueError('Only HTTPS or local loopback allowed')
rows=[json.loads(l) for l in Path(a.file).read_text(encoding='utf-8').split('\n') if l.strip()]
headers={'Content-Type':'application/json','Authorization':'Bearer '+env['DATA_IMPORT_TOKEN']}
if env.get('SITES_SERVICE_TOKEN'):headers['OAI-Sites-Authorization']='Bearer '+env['SITES_SERVICE_TOKEN']
for start in range(0,len(rows),80):
 batch=rows[start:start+80]
 for attempt in range(3):
  try:
   req=urllib.request.Request(a.url.rstrip('/')+'/api/admin/import',data=json.dumps(batch,ensure_ascii=False).encode(),headers=headers,method='POST')
   with urllib.request.urlopen(req,timeout=60) as r:result=json.load(r)
   break
  except urllib.error.HTTPError as e:
   if e.code<500 or attempt==2:raise RuntimeError(f'Import HTTP {e.code}; dataset and credentials were not logged') from None
   time.sleep(2)
  except (TimeoutError,urllib.error.URLError):
   if attempt==2:raise RuntimeError('Import network error') from None
   time.sleep(2)
 if start%800==0 or start+80>=len(rows):print(json.dumps({'processed':min(start+80,len(rows)),'stored':result.get('count')}),flush=True)

