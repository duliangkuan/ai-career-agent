import {runtime} from './server';
import type {Job} from './contracts';
export async function retrieveJobs(keywords:string[],city='',stage='全部',limit=30){
 const terms=[...new Set(keywords.map(s=>s.trim().toLowerCase()).filter(Boolean))].slice(0,10);const escaped=(s:string)=>s.replace(/[\\%_]/g,'\\$&');
 const score=terms.length?terms.map(()=>"CASE WHEN search_text LIKE ? ESCAPE '\\' THEN 1 ELSE 0 END").join(' + '):'0';
 const params:unknown[]=terms.map(s=>`%${escaped(s)}%`);let filter="payload NOT LIKE '%pause (live verified%'";if(city){filter+=" AND locations LIKE ? ESCAPE '\\'";params.push(`%${escaped(city)}%`);}if(stage!=='全部'){filter+=' AND recruitment_type LIKE ?';params.push(`%${stage}%`);}
 // Prevent a large employer from taking every candidate slot at the same score.
 const query=`WITH scored AS (SELECT id,company,payload,(${score}) AS score FROM jobs WHERE ${filter}), ranked AS (SELECT *,ROW_NUMBER() OVER (PARTITION BY company ORDER BY score DESC,id) AS company_rank FROM scored) SELECT payload,score FROM ranked WHERE company_rank<=4 AND score>0 ORDER BY score DESC,company,id LIMIT ?`;params.push(limit);
 const rows=await runtime.DB.prepare(query).bind(...params).all<{payload:string;score:number}>();return rows.results.filter(r=>r.score>0||!terms.length).map(r=>JSON.parse(r.payload) as Job);
}
