import { CharacterProfile, InteractionPoint } from '../types';

export const defaultCharacters: CharacterProfile[] = [
  { id:'teacher', name:'Thầy giáo', role:'teacher', description:'Thân thiện, kính tròn, áo cardigan màu be; hướng dẫn rõ ràng, gần gũi.', voiceURI:'', lang:'vi-VN', rate:1, pitch:1 },
  { id:'boy', name:'Học sinh nam', role:'boy', description:'Tò mò, năng động, đồng phục học sinh; đặt câu hỏi và khám phá.', voiceURI:'', lang:'vi-VN', rate:1, pitch:1.1 },
  { id:'girl', name:'Học sinh nữ', role:'girl', description:'Tự tin, thân thiện, đồng phục học sinh; chia sẻ và giải thích.', voiceURI:'', lang:'vi-VN', rate:1, pitch:1.15 },
  { id:'robot', name:'Trợ lý AI', role:'robot', description:'Robot nhỏ màu mint; gợi ý ngắn gọn và khích lệ học sinh.', voiceURI:'', lang:'vi-VN', rate:.95, pitch:1 },
];
const clamp=(value:unknown,min:number,max:number)=>Math.max(min,Math.min(max,Number.isFinite(Number(value))?Number(value):1));
export function normalizeCharacters(value:unknown): CharacterProfile[] {
  if(!Array.isArray(value))return structuredClone(defaultCharacters);
  const seen=new Set<string>();
  return value.filter(v=>v&&typeof v==='object').slice(0,12).map((v,i)=>({
    id:String(v.id||`character-${i}`).slice(0,80),name:String(v.name||'Nhân vật').slice(0,80),
    role:(['teacher','boy','girl','robot'].includes(v.role)?v.role:'teacher') as CharacterProfile['role'],
    description:String(v.description||'').slice(0,2000),voiceURI:String(v.voiceURI||'').slice(0,300),lang:String(v.lang||'vi-VN').slice(0,30),rate:clamp(v.rate,.5,2),pitch:clamp(v.pitch,.5,2),
  })).filter(v=>{if(seen.has(v.id))return false;seen.add(v.id);return true});
}
export function normalizeNarration(value:unknown):InteractionPoint['narration'] {
  if(!value||typeof value!=='object')return undefined;
  const v=value as Record<string,unknown>;
  return {characterId:String(v.characterId||'').slice(0,80),name:String(v.name||'Nhân vật').slice(0,80),text:String(v.text||'').slice(0,4000),voiceURI:String(v.voiceURI||'').slice(0,300),lang:String(v.lang||'vi-VN').slice(0,30),rate:clamp(v.rate,.5,2),pitch:clamp(v.pitch,.5,2)};
}
