import {mkdirSync,writeFileSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
mkdirSync('work',{recursive:true});
writeFileSync('work/wrangler.local.json',JSON.stringify({name:'ai-career-agent-local',main:'../build/sites-worker.ts',compatibility_date:'2026-09-01',compatibility_flags:['nodejs_compat'],d1_databases:[{binding:'DB',database_name:'site-creator-d1',database_id:'00000000-0000-4000-8000-000000000000'}]}));
// This command applies the generated schema to local storage only.
for(const file of readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort()){
 const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','work/wrangler.local.json','--local','--persist-to','.wrangler/state','--file',`drizzle/${file}`],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status||1);
}
