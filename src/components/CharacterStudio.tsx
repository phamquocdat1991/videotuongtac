import React, { useEffect, useState } from 'react';
import { Bot, GraduationCap, UserRound, Volume2, Square } from 'lucide-react';
import { CharacterProfile, InteractionPoint } from '../types';

export function CharacterStudio({characters,onChange,interactions,onAssign}:{characters:CharacterProfile[];onChange:(v:CharacterProfile[])=>void;interactions:InteractionPoint[];onAssign:(id:string,narration:InteractionPoint['narration'])=>void}){
  const [selected,setSelected]=useState(characters[0]?.id||'');
  const [pointId,setPointId]=useState('');
  const [text,setText]=useState('Xin chào các em! Chúng ta cùng khám phá bài học hôm nay nhé.');
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [message,setMessage]=useState('');
  const [speaking,setSpeaking]=useState(false);
  const character=characters.find(c=>c.id===selected)||characters[0];
  useEffect(()=>{
    if(!('speechSynthesis' in window))return;
    const update=()=>setVoices(window.speechSynthesis.getVoices());update();
    window.speechSynthesis.addEventListener('voiceschanged',update);
    return()=>{window.speechSynthesis.removeEventListener('voiceschanged',update);window.speechSynthesis.cancel()};
  },[]);
  useEffect(()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();setSpeaking(false)},[characters,pointId]);
  const change=(patch:Partial<CharacterProfile>)=>{if(character)onChange(characters.map(c=>c.id===character.id?{...c,...patch}:c))};
  const stop=()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();setSpeaking(false)};
  const play=()=>{
    stop();setMessage('');if(!character||!text.trim())return;
    if(!('speechSynthesis' in window)){setMessage('Trình duyệt này chưa hỗ trợ đọc văn bản.');return}
    const available=window.speechSynthesis.getVoices();
    const voice=available.find(v=>v.voiceURI===character.voiceURI)||available.find(v=>v.lang.toLowerCase().startsWith(character.lang.slice(0,2).toLowerCase()));
    if(!voice){setMessage('Thiết bị chưa có giọng phù hợp. Hãy chọn giọng khác hoặc cài giọng tiếng Việt trên thiết bị.');return}
    const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=character.rate;utterance.pitch=character.pitch;
    utterance.onstart=()=>setSpeaking(true);utterance.onend=()=>setSpeaking(false);utterance.onerror=event=>{setSpeaking(false);if(event.error!=='canceled'&&event.error!=='interrupted')setMessage('Không phát được giọng đọc. Hãy thử giọng khác.')};
    window.speechSynthesis.speak(utterance);
  };
  if(!character)return <section id="characters" className="academic-panel rounded-3xl border p-5">Dự án chưa có hồ sơ nhân vật.</section>;
  return <section id="characters" aria-labelledby="characters-title" className="academic-panel rounded-3xl border p-5 space-y-4" style={{scrollMarginTop:100}}>
    <div><h2 id="characters-title" className="text-lg font-bold">Nhân vật & giọng nói</h2><p className="text-sm text-slate-600 mt-1">Giữ hồ sơ và giọng dẫn nhất quán trong bài giảng.</p></div>
    <div className="grid grid-cols-2 gap-2">{characters.map(c=>{const Icon=c.role==='robot'?Bot:c.role==='teacher'?GraduationCap:UserRound;return <button type="button" key={c.id} aria-pressed={c.id===character.id} onClick={()=>{stop();setSelected(c.id);setMessage('')}} className={`rounded-2xl border p-3 text-left ${c.id===character.id?'bg-rose-50 border-rose-300':'bg-white border-slate-200'}`}><Icon className="text-blue-600 mb-2"/><span className="text-sm font-bold">{c.name}</span></button>})}</div>
    <label className="block text-sm">Tên nhân vật<input aria-label="Tên nhân vật" maxLength={80} value={character.name} onChange={e=>change({name:e.target.value})} className="block w-full rounded-xl border p-2 mt-1"/></label>
    <label className="block text-sm">Ngoại hình, trang phục & tính cách<textarea aria-label="Mô tả nhân vật" maxLength={2000} value={character.description} onChange={e=>change({description:e.target.value})} className="block w-full rounded-xl border p-2 mt-1" rows={3}/></label>
    <label className="block text-sm">Giọng đọc<select aria-label="Giọng đọc" value={voices.some(v=>v.voiceURI===character.voiceURI)?character.voiceURI:''} onChange={e=>{const v=voices.find(v=>v.voiceURI===e.target.value);change({voiceURI:e.target.value,lang:v?.lang||'vi-VN'})}} className="block w-full rounded-xl border p-2 mt-1"><option value="">Tự chọn giọng tiếng Việt phù hợp</option>{voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-3"><label className="text-sm">Tốc độ: {character.rate.toFixed(1)}×<input aria-label="Tốc độ đọc" type="range" min="0.5" max="2" step="0.1" value={character.rate} onChange={e=>change({rate:Number(e.target.value)})} className="w-full"/></label><label className="text-sm">Cao độ: {character.pitch.toFixed(1)}<input aria-label="Cao độ" type="range" min="0.5" max="2" step="0.1" value={character.pitch} onChange={e=>change({pitch:Number(e.target.value)})} className="w-full"/></label></div>
    <label className="block text-sm">Mốc tương tác<select aria-label="Mốc gắn lời dẫn" value={interactions.some(p=>p.id===pointId)?pointId:''} onChange={e=>{setPointId(e.target.value);const p=interactions.find(p=>p.id===e.target.value);if(p?.narration){setSelected(p.narration.characterId);setText(p.narration.text)}setMessage('')}} className="block w-full rounded-xl border p-2 mt-1"><option value="">Chọn mốc để gắn nhân vật</option>{interactions.map(p=><option key={p.id} value={p.id}>{Math.round(p.timestamp)}s · {p.title}{p.narration?' · Đã có lời dẫn':''}</option>)}</select></label>
    <label className="block text-sm">Lời dẫn<textarea aria-label="Lời dẫn nhân vật" rows={3} maxLength={4000} value={text} onChange={e=>setText(e.target.value)} className="block w-full rounded-xl border p-2 mt-1"/></label>
    <div className="flex flex-wrap gap-2"><button type="button" onClick={play} disabled={!text.trim()} className="rounded-xl bg-blue-600 text-white p-2 flex items-center gap-2"><Volume2 size={16}/>Nghe thử</button><button type="button" onClick={stop} disabled={!speaking} className="rounded-xl border p-2 flex items-center gap-2"><Square size={16}/>Dừng</button><button type="button" disabled={!interactions.some(p=>p.id===pointId)||!text.trim()} onClick={()=>{onAssign(pointId,{characterId:character.id,name:character.name,text:text.trim(),voiceURI:character.voiceURI,lang:character.lang,rate:character.rate,pitch:character.pitch});setMessage('Đã gắn nhân vật và lời dẫn vào mốc.')}} className="rounded-xl border bg-rose-50 p-2 disabled:opacity-40">Gắn vào mốc</button></div>
    <p role="status" className="text-sm text-blue-700">{message}</p>
    <p className="text-xs text-slate-500">Giọng có sẵn tùy thiết bị. Nghe thử và lời dẫn không tạo file âm thanh hoặc thay đổi âm thanh gốc của video.</p>
  </section>;
}
