import { describe,it,expect } from 'vitest';
import { normalizeCharacters,normalizeNarration } from './characters';
import { parseProjectJson,projectFingerprint } from './projectSafety';
import { generateExportHtml } from './exportEngine';
describe('character projects',()=>{
 it('opens legacy projects with four default profiles',()=>{
   expect(parseProjectJson(JSON.stringify({interactions:[]})).characters).toHaveLength(4);
 });
 it('normalizes malformed profiles and bounds voice controls',()=>{
   const c=normalizeCharacters([{id:'a',rate:50,pitch:-2},{id:'a'},null]);
   expect(c).toHaveLength(1);expect(c[0].rate).toBe(2);expect(c[0].pitch).toBe(.5);
 });
 it('preserves narration and characters through project JSON and invalidates review',()=>{
   const p=parseProjectJson(JSON.stringify({interactions:[{id:'a',timestamp:10,title:'Q',data:{type:'quiz',question:'Q?',options:['A','B'],correctAnswer:0},narration:normalizeNarration({characterId:'teacher',name:'Teacher',text:'Xin chào',rate:1,pitch:1})}]}));
   const roundtrip=parseProjectJson(JSON.stringify(p));expect(roundtrip.characters).toEqual(p.characters);expect(roundtrip.interactions[0].narration?.text).toBe('Xin chào');
   roundtrip.interactions[0].narration!.text='Thay đổi';expect(projectFingerprint(roundtrip)).not.toBe(projectFingerprint(p));
 });
 it('exports narration safely and keeps inline scripts valid',()=>{
   const p=parseProjectJson(JSON.stringify({interactions:[{id:'a',timestamp:10,title:'Q',data:{type:'quiz',question:'Q?',options:['A','B'],correctAnswer:0},narration:{text:'</script><img onerror=alert(1)>',name:'N',lang:'vi-VN',rate:1,pitch:1}}]}));
   const html=generateExportHtml('Test',p.interactions);expect(html).toContain('Nghe lời dẫn');expect(html).not.toContain('</script><img onerror');
   for(const [,attrs,code] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(!attrs.includes('src='))expect(()=>new Function(code)).not.toThrow()}
 });
});
