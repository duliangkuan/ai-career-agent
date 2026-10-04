import argparse,json,sqlite3,pathlib
p=argparse.ArgumentParser(description='Export public AI job fields from an existing local SQLite snapshot. Does not export resumes or raw vendor responses.')
p.add_argument('database');p.add_argument('--output',default='data/jobs.ndjson');a=p.parse_args()
fields='id company title role_family recruitment_type locations responsibilities requirements education_evidence major_evidence experience_evidence graduation_evidence internship_time_evidence salary_evidence skills_json source_url collected_on status'.split()
c=sqlite3.connect(f'file:{pathlib.Path(a.database).resolve().as_posix()}?mode=ro',uri=True);c.row_factory=sqlite3.Row
out=pathlib.Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
with out.open('w',encoding='utf-8') as f:
 for row in c.execute('SELECT '+','.join(fields)+' FROM jobs ORDER BY id'):
  j={k:row[k] or '' for k in fields}
  if j['id'].endswith('a544ada9-5ab6-409d-a698-168a96f6b19a'):j['status']='pause (live verified 2026-10-04)'
  f.write(json.dumps(j,ensure_ascii=False)+'\n')
print(json.dumps({'rows':c.execute('SELECT count(*) FROM jobs').fetchone()[0],'output':str(out),'bytes':out.stat().st_size}))
