import React, { useEffect, useState } from 'react';
import { InteractionPoint } from '../types';
export function NarrationPlayer({narration}:{narration:NonNullable<InteractionPoint['narration']>}){
  const [error,setError]=useState('');
  useEffect(()=>()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel()},[narration]);
  const play=()=>{
    setError('');if(!('speechSynthesis' in window)){setError('Thiết bị chưa hỗ trợ giọng đọc.');return}
    const synth=window.speechSynthesis;const voices=synth.getVoices();const voice=voices.find(v=>v.voiceURI===narration.voiceURI)||voices.find(v=>v.lang.startsWith(narration.lang.slice(0,2)));
    if(!voice){setError('Chưa có giọng phù hợp trên thiết bị. Em có thể đọc lời dẫn bên dưới.');return}
    synth.cancel();const u=new SpeechSynthesisUtterance(narration.text);u.voice=voice;u.lang=voice.lang;u.rate=narration.rate;u.pitch=narration.pitch;u.onerror=()=>setError('Không phát được lời dẫn.');synth.speak(u);
  };
  return <aside className="rounded-xl bg-white p-3 mb-3 text-slate-800"><strong>{narration.name}</strong><p className="text-sm whitespace-pre-wrap">{narration.text}</p><div className="flex gap-2 mt-2"><button type="button" onClick={play} className="rounded-lg border p-2 text-sm">Nghe lời dẫn</button><button type="button" onClick={()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel()}} className="rounded-lg border p-2 text-sm">Dừng lời dẫn</button></div>{error&&<p role="status" className="text-sm">{error}</p>}</aside>;
}
