import {boundedBody,checkOrigin,errorResponse,runtime,sharedAllowed} from '../../../lib/server';
import {requestSchema,profileSchema,reviewSchema,groundedMatches} from '../../../lib/contracts';
import {deepseek} from '../../../lib/providers';
import {retrieveJobs} from '../../../lib/jobs';
export async function POST(req:Request){let input;try{checkOrigin(req);input=requestSchema.parse(JSON.parse(new TextDecoder().decode(await boundedBody(req,150000))));}catch(e){return errorResponse(e);}
 const key=input.deepseekKey||(sharedAllowed(req)?runtime.DEEPSEEK_API_KEY:'');if(!key)return errorResponse(new Error('请在 API 设置中填写 DeepSeek 密钥'));
 const data=input;const encoder=new TextEncoder();const stream=new ReadableStream({async start(controller){const send=(event:unknown)=>controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'));try{
 send({type:'progress',message:'正在梳理简历中的经历与技能…'});
 const profile=await deepseek(key,runtime.DEEPSEEK_MODEL||'deepseek-flash','你是有据的职业分析助手。只提取简历明确提供的信息。返回 {summary:string, keywords:string[],skills:[{name:string,evidence:简历原文}],unknowns:string[]}。keywords 选取 5–10 个适合检索 AI 招聘的具体技能或岗位词，中英均可，不要把姓名、联系方式、学校名称当检索词。不能把兴趣或学习意愿当成已掌握技能。', {resume:data.text},profileSchema,req.signal);
 send({type:'progress',message:'正在检索招聘数据库中的真实岗位…'});const jobs=await retrieveJobs(profile.keywords,data.city,data.stage,30);
 if(!jobs.length)throw new Error('当前筛选下没有检索到相关岗位，请放宽城市或招聘类型后重试');
 send({type:'progress',message:`已检索 ${jobs.length} 条候选岗位，正在逐项比对并制定计划…`});
 const review=await deepseek(key,runtime.DEEPSEEK_MODEL||'deepseek-flash',`你是审慎的 AI 求职 Agent。仅从候选岗位中选最多 8 个，不得编造 ID、岗位或简历经历。学历层次、毕业届别、专业或到岗时长等明确不符合硬性条件的岗位不要推荐；技能和项目经验不足可列为补齐后尝试，不能声称现已符合。未明确毕业年份、专业要求、实习到岗时间或学历时注明待确认。不根据年龄性别户籍作就业判断。不提供录用概率或未经来源支持的薪资。推荐证据必须逐字摘录简历和 JD，各不超过 80 字。学历未知不能视为本科。没有足够匹配岗位允许空列表。规划区分短期可投与长期方向，用可验证作品和具体任务，不承诺前景。岗位快照不能代表仍开放。返回 JSON：{matches:[{id:string,reason:string,verdict:"可优先尝试"|"补齐后尝试"|"条件待确认",evidence:[{resume:string,jd:string}],gaps:string[],conditions:string[]}],direction:string,plan:[{period:string,goal:string,actions:string[],deliverable:string}],caveats:string[]}。计划覆盖未来30天、90天、180天。`,{resume:data.text,profile,preferences:{city:data.city,stage:data.stage},candidates:jobs.map(j=>({...j,full_jd:undefined,responsibilities:j.responsibilities.slice(0,2500),requirements:j.requirements.slice(0,3500)}))},reviewSchema,req.signal);
 send({type:'result',profile, ...review,matches:groundedMatches(review.matches,jobs,data.text),candidateCount:jobs.length,generatedAt:new Date().toISOString()});
 }catch(e){send({type:'error',message:e instanceof Error?e.message:'分析失败，请重试'});}finally{controller.close();}}});return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

