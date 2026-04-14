"use client"

import { useState, useRef, useEffect } from "react";
import { Chart, registerables } from 'chart.js';
import { createClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') Chart.register(...registerables);

// ═══ SUPABASE CLIENT ═══
let supabase = null;
const sbUrl = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : null;
const sbKey = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : null;
if (sbUrl && sbKey && sbUrl !== 'undefined') {
  supabase = createClient(sbUrl, sbKey);
}

// ═══ DESIGN TOKENS ═══
const C = {
  bg:"#F4F1EB",surface:"#FFFFFF",surfaceAlt:"#EDE9E1",
  text:"#1A1A1A",soft:"#6B6B6B",muted:"#ABABAB",
  accent:"#2D5F3F",accentSoft:"#E3EFE7",accentDark:"#1E4A2E",
  warm:"#C98B5F",warmSoft:"#FEF4EC",
  danger:"#B8453A",dangerSoft:"#FDEEEC",
  tile:"#F0ECE4",tileBorder:"#E6E1D6",
  shadow3d:"0 2px 4px rgba(0,0,0,.03), 0 8px 24px rgba(0,0,0,.06), 0 16px 48px rgba(0,0,0,.04)",
  shadowCard:"0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.05)",
  shadowHover:"0 4px 12px rgba(0,0,0,.06), 0 20px 48px rgba(0,0,0,.08)",
  shadowInner:"inset 0 2px 6px rgba(0,0,0,.04)",
};

const MO=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const DS=["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
const dk=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const sameD=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const ago=n=>{const d=new Date();d.setDate(d.getDate()-n);return d};
const MO_R=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const fmtD=d=>`${d.getDate()} ${MO_R[d.getMonth()]} ${d.getFullYear()}`;
const daysBetween=(a,b)=>Math.floor((b-a)/(1000*60*60*24));

const MEALS_MAIN=[
  {id:"breakfast",label:"Завтрак"},{id:"lunch",label:"Обед"},{id:"dinner",label:"Ужин"},
];
const SNACK_SLOTS=[
  {id:"snack1",label:"Перекус 1"},{id:"snack2",label:"Перекус 2"},{id:"snack3",label:"Перекус 3"},
  {id:"snack4",label:"Перекус 4"},{id:"snack5",label:"Перекус 5"},
];
const MEALS=[...MEALS_MAIN,...SNACK_SLOTS];
// Returns visible meals: main 3 + filled snacks (relabeled) + one "add" slot, sorted by time
function getVisibleMeals(mealsData) {
  const md = mealsData || {};
  // A snack slot is "used" only when the user actually put food in it (text
  // or photo). Time alone doesn't count — the user often taps the picker
  // accidentally and we don't want a phantom "Перекус N" tile stuck on the
  // diary because of that.
  const isFilled = (id) => { const d = md[id]; return d && (d.text || d.photo); };
  const filledSnacks = SNACK_SLOTS.filter(s => isFilled(s.id))
    .map((s, i) => ({ ...s, label: 'Перекус' + (i > 0 ? ' ' + (i + 1) : '') }));
  const nextSnack = SNACK_SLOTS.find(s => !isFilled(s.id));
  const addLabel = filledSnacks.length === 0 ? 'Перекус' : 'Ещё перекус';
  const all = [
    ...MEALS_MAIN,
    ...filledSnacks,
    ...(nextSnack ? [{ ...nextSnack, label: addLabel, isAddSlot: true }] : []),
  ];
  // Sort by time: items with time go in order, items without time keep relative position
  const timeToMin = (t) => { if (!t) return null; const p = t.split(':'); const h = parseInt(p[0], 10), m = parseInt(p[1] || '0', 10); return isNaN(h) ? null : h * 60 + m; };
  const withTime = all.map((m, origIdx) => ({ m, time: timeToMin(md[m.id]?.time), origIdx }));
  withTime.sort((a, b) => {
    if (a.time != null && b.time != null) return a.time - b.time;
    if (a.time != null) return -1;
    if (b.time != null) return 1;
    return a.origIdx - b.origIdx;
  });
  return withTime.map(w => w.m);
}
const HUNGER=["Сильный","Лёгкий","Сытость"];
const FEELING=["Тяжесть","Дискомфорт","Нормально","Хорошо","Отлично"];
const MOOD_L=["Тяжело","Неважно","Нейтрально","Хорошо","Прекрасно"];

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0}
:root{--fd:'Instrument Serif',Georgia,serif;--fb:'Plus Jakarta Sans',sans-serif}
body{font-family:var(--fb);background:${C.bg};color:${C.text};-webkit-font-smoothing:antialiased}
::selection{background:${C.accentSoft};color:${C.accent}}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ccc;border-radius:4px}
input,textarea,select,button{font-family:var(--fb)}
@keyframes enter{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
input::-ms-reveal,input::-ms-clear{display:none !important;width:0;height:0}
@keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
@keyframes slideRight{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideLeft{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
@keyframes tileIn{from{opacity:0;transform:scale(.9) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 0 rgba(45,95,63,0)}50%{box-shadow:0 0 20px rgba(45,95,63,.12)}}
@keyframes ripple{from{transform:scale(.95);opacity:.7}to{transform:scale(1);opacity:1}}
.tile3d{transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s ease !important}
.tile3d:active{transform:perspective(600px) rotateX(0) scale(.97) !important}
.card-hover{transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s ease !important}
.card-hover:active{transform:scale(.98) !important}
@keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(120vh) rotate(720deg);opacity:0}}
@keyframes wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes celebrate{0%{transform:scale(0);opacity:0}50%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes sparkle{0%,100%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1)}}
@keyframes bounceIn{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.05)}70%{transform:scale(.9)}100%{transform:scale(1);opacity:1}}
@keyframes progressFill{0%{width:0}15%{width:20%}40%{width:45%}60%{width:65%}80%{width:82%}95%{width:94%}100%{width:100%}}
`;

// ═══ SVG ICONS ═══
const I={
  back:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  menu:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="15" y2="16"/></svg>,
  user:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  bell:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  plus:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  cam:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  img:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>,
  x:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  expand:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>,
  chev:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>,
  drop:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>,
  moon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  run:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  brain:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a7 7 0 00-7 7c0 3 2 5.5 4 7l3 3 3-3c2-1.5 4-4 4-7a7 7 0 00-7-7z"/></svg>,
  heart:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  pill:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m10.5 1.5 3 3-9 9-3-3a4.24 4.24 0 010-6l3-3a4.24 4.24 0 016 0z"/><path d="m13.5 22.5-3-3 9-9 3 3a4.24 4.24 0 010 6l-3 3a4.24 4.24 0 01-6 0z"/><line x1="8" y1="16" x2="16" y2="8"/></svg>,
  archive:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  restore:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
  edit:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  link:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  logout:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  support:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  chat:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>,
  fork:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  stool:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2h6l1 7H8L9 2z"/><path d="M8 9l-2 13M16 9l2 13M12 9v13"/></svg>,
  steth:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3"/><path d="M8 15v1a6 6 0 006 6 6 6 0 006-6v-4"/><circle cx="20" cy="10" r="2"/></svg>,
  chart:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>,
  book:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
};

// ═══ DATA ═══
const CL_INIT=[
  {id:"c1",name:"Анна Козлова",age:34,request:"Снижение веса",status:"active",nick:"",joined:new Date(2026,0,5)},
  {id:"c2",name:"Михаил Петров",age:28,request:"Набор массы",status:"active",nick:"",joined:new Date(2026,1,12)},
  {id:"c3",name:"Елена Сидорова",age:45,request:"Контроль диабета",status:"active",nick:"",joined:new Date(2026,2,20)},
  {id:"c4",name:"Ольга Кравцова",age:52,request:"Здоровое старение",status:"archive",nick:"",joined:new Date(2025,8,1)},
];

function formatLastSeen(d){
  if(!d)return '';
  const now=new Date(),dt=new Date(d),diff=Math.floor((now-dt)/1000);
  if(diff<60)return 'только что';
  if(diff<3600)return Math.floor(diff/60)+' мин назад';
  // Compare by calendar day, not by diff
  const sameDay=now.getFullYear()===dt.getFullYear()&&now.getMonth()===dt.getMonth()&&now.getDate()===dt.getDate();
  const yest=new Date(now);yest.setDate(yest.getDate()-1);
  const isYesterday=yest.getFullYear()===dt.getFullYear()&&yest.getMonth()===dt.getMonth()&&yest.getDate()===dt.getDate();
  const time=dt.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  if(sameDay)return 'сегодня в '+time;
  if(isYesterday)return 'вчера в '+time;
  return dt.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})+' в '+time;
}

// Activity types for Movement block
const ACTIVITIES = [
  {id:'walk',label:'Ходьба'},
  {id:'run',label:'Бег'},
  {id:'bike',label:'Велосипед'},
  {id:'yoga',label:'Йога'},
  {id:'swim',label:'Плавание'},
  {id:'strength',label:'Силовая'},
  {id:'pilates',label:'Пилатес'},
  {id:'dance',label:'Танцы'},
  {id:'gymnastics',label:'Гимнастика'},
  {id:'other',label:'Другое'},
];

// Parse movement field — handles old (single type) and new (multiple activities) formats
function parseMovement(raw){
  const empty={activities:[],note:''};
  if(!raw)return empty;
  if(typeof raw==='object'){
    // New format with activities array
    if(raw.activities)return {activities:raw.activities,note:raw.note||''};
    // Old single-type format → convert
    if(raw.type)return {activities:[{type:raw.type,duration:raw.duration||10}],note:raw.note||''};
    return {activities:[],note:raw.note||''};
  }
  if(typeof raw==='string'&&raw.startsWith('{')){
    try{
      const p=JSON.parse(raw);
      if(p.activities)return {activities:p.activities,note:p.note||''};
      if(p.type)return {activities:[{type:p.type,duration:p.duration||10}],note:p.note||''};
      return {activities:[],note:p.note||''};
    }catch(e){}
  }
  return {activities:[],note:String(raw)};
}

function mkDemo(){
  const t=dk(new Date()),y=dk(ago(1));
  return{
    doc:{[y]:{meals:{breakfast:{time:"08:00",hunger:"Умеренный",text:"Овсянка с ягодами",feeling:"Хорошо",photo:null}},water:0,supplements:"Витамин D, Омега-3",sleep:{bed:"23:00",wake:"07:00",quality:7},movement:"Йога 45 мин",stress:{level:4,practices:"Дыхание 10 мин"},well:{energy:7,mood:3,comment:"Продуктивный день"}}},
    c1:{[t]:{meals:{breakfast:{time:"08:30",hunger:"Сильный",text:"Овсянка с бананом и мёдом",feeling:"Хорошо",photo:"https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&q=75"},lunch:{time:"13:00",hunger:"Умеренный",text:"Куриная грудка с рисом",feeling:"Нормально",photo:"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=75"}},water:0,supplements:"",sleep:{bed:"23:30",wake:"07:00",quality:6},movement:"Прогулка 40 мин",stress:{level:5,practices:""},well:{energy:6,mood:2,comment:""}},[y]:{meals:{breakfast:{time:"09:00",hunger:"Лёгкий",text:"Творог, кофе",feeling:"Хорошо",photo:"https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=75"},snack1:{time:"11:00",hunger:"Лёгкий",text:"Яблоко, миндаль",feeling:"Нормально",photo:null},lunch:{time:"13:30",hunger:"Сильный",text:"Борщ со сметаной",feeling:"Тяжесть",photo:"https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=75"},dinner:{time:"19:00",hunger:"Умеренный",text:"Рыба, салат",feeling:"Хорошо",photo:"https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=75"}},water:0,supplements:"Витамин D",sleep:{bed:"00:00",wake:"07:30",quality:5},movement:"Бег 30 мин",stress:{level:6,practices:"Медитация"},well:{energy:5,mood:2,comment:"Устала к вечеру"}}},
    c2:{[t]:{meals:{breakfast:{time:"07:00",hunger:"Сильный",text:"4 яйца, гречка 250г",feeling:"Хорошо",photo:null},lunch:{time:"12:30",hunger:"Сильный",text:"Говядина, макароны",feeling:"Нормально",photo:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=75"},snack2:{time:"16:00",hunger:"Умеренный",text:"Протеин, орехи",feeling:"Хорошо",photo:null}},water:0,supplements:"Креатин, BCAA",sleep:{bed:"22:30",wake:"06:30",quality:8},movement:"Силовая 1.5ч",stress:{level:3,practices:""},well:{energy:8,mood:4,comment:"Отличная тренировка"}}},
    c3:{[y]:{meals:{breakfast:{time:"08:00",hunger:"Нейтральный",text:"Каша на воде",feeling:"Нормально",photo:null},lunch:{time:"13:00",hunger:"Умеренный",text:"Индейка, овощи",feeling:"Хорошо",photo:"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=75"}},water:0,supplements:"Метформин, хром",sleep:{bed:"22:00",wake:"06:00",quality:7},movement:"Ходьба 20 мин",stress:{level:4,practices:"Прогулка"},well:{energy:6,mood:3,comment:""}}},
  };
}
function mkComments(){return{c1:[{id:"cm1",date:dk(ago(1)),text:"Анна, хороший день! После борща тяжесть — уменьшите порцию хлеба. Калораж ~1650 — в норме.",ts:Date.now()-86400000,read:false}],c2:[{id:"cm3",date:dk(new Date()),text:"Калораж ~2800 — отлично. Добавьте овощи к завтраку.",ts:Date.now()-3600000,read:false}],c3:[]};}

// ═══ PRIMITIVES ═══
function TopBar({left,title,subtitle,right,onHome,noBorder}){
  return <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0 12px',minHeight:52,position:'sticky',top:0,background:C.bg,zIndex:100,borderBottom:noBorder?'none':`1px solid ${C.surfaceAlt}`,gap:8}}>
    <div style={{minWidth:48,display:'flex',justifyContent:'flex-start',flexShrink:0}}>{left}</div>
    <div style={{flex:1,textAlign:'center',cursor:onHome?'pointer':'default',minWidth:0}} onClick={onHome||undefined}>
      <div style={{fontSize:20,fontWeight:700,fontFamily:'var(--fd)',letterSpacing:'-.02em',color:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{title}</div>
      {subtitle&&<div style={{fontSize:9,color:C.muted,letterSpacing:'.1em',textTransform:'uppercase',marginTop:1}}>{subtitle}</div>}
    </div>
    <div style={{minWidth:48,display:'flex',justifyContent:'flex-end',flexShrink:0}}>{right}</div>
  </div>;
}

function BackBtn({onClick}){
  return <button onClick={onClick} style={{background:C.surfaceAlt,border:'none',cursor:'pointer',color:C.text,display:'flex',alignItems:'center',justifyContent:'center',padding:10,borderRadius:14,minWidth:44,minHeight:44,WebkitTapHighlightColor:'transparent'}}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
  </button>;
}

function IcoBtn({icon,onClick,badge,style:st}){
  return <button onClick={onClick} style={{position:'relative',background:'none',border:'none',cursor:'pointer',color:C.soft,display:'flex',padding:4,...st}}>
    {icon}
    {badge>0&&<div style={{position:'absolute',top:-2,right:-4,width:16,height:16,borderRadius:'50%',background:C.danger,color:'#fff',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>{badge}</div>}
  </button>;
}

function AvatarCropper({src,onSave,onCancel}){
  const canvasRef=useRef(null);
  const[zoom,setZoom]=useState(1);
  const[pos,setPos]=useState({x:0,y:0});
  const[dragging,setDragging]=useState(false);
  const[dragStart,setDragStart]=useState({x:0,y:0});
  const[img,setImg]=useState(null);
  const lastPinch=useRef(null);
  const cropSize=260;

  useEffect(()=>{const i=new Image();i.onload=()=>setImg(i);i.src=src;},[src]);

  useEffect(()=>{
    if(!img||!canvasRef.current)return;
    const ctx=canvasRef.current.getContext('2d');
    const s=Math.min(img.width,img.height);
    ctx.clearRect(0,0,cropSize,cropSize);
    ctx.save();
    ctx.beginPath();ctx.arc(cropSize/2,cropSize/2,cropSize/2,0,Math.PI*2);ctx.clip();
    const scale=cropSize/s*zoom;
    const dx=(cropSize-img.width*scale)/2+pos.x;
    const dy=(cropSize-img.height*scale)/2+pos.y;
    ctx.drawImage(img,dx,dy,img.width*scale,img.height*scale);
    ctx.restore();
  },[img,zoom,pos]);

  const startDrag=(cx,cy)=>{setDragging(true);setDragStart({x:cx-pos.x,y:cy-pos.y})};
  const handleMove=(cx,cy)=>{if(!dragging)return;setPos({x:cx-dragStart.x,y:cy-dragStart.y})};
  const endDrag=()=>{setDragging(false);lastPinch.current=null};

  const handleTouchStart=(e)=>{
    if(e.touches.length===2){
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      lastPinch.current={dist:d,zoom};
    }else if(e.touches.length===1){
      startDrag(e.touches[0].clientX,e.touches[0].clientY);
    }
  };
  const handleTouchMove=(e)=>{
    e.preventDefault();
    if(e.touches.length===2&&lastPinch.current){
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      const newZoom=Math.max(0.5,Math.min(4,lastPinch.current.zoom*(d/lastPinch.current.dist)));
      setZoom(newZoom);
    }else if(e.touches.length===1){
      handleMove(e.touches[0].clientX,e.touches[0].clientY);
    }
  };

  const doCrop=()=>{
    if(!img)return;
    const out=document.createElement('canvas');
    out.width=512;out.height=512;
    const ctx=out.getContext('2d');
    const s=Math.min(img.width,img.height);
    const scale=cropSize/s*zoom;
    const dx=(cropSize-img.width*scale)/2+pos.x;
    const dy=(cropSize-img.height*scale)/2+pos.y;
    const ratio=512/cropSize;
    ctx.beginPath();ctx.arc(256,256,256,0,Math.PI*2);ctx.clip();
    ctx.drawImage(img,dx*ratio,dy*ratio,img.width*scale*ratio,img.height*scale*ratio);
    onSave(out.toDataURL('image/jpeg',0.9));
  };

  return <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn .15s'}}>
    <div onClick={onCancel} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(8px)'}}/>
    <div style={{position:'relative',background:C.surface,borderRadius:24,padding:24,width:'min(340px,92vw)',boxShadow:C.shadowHover,animation:'scaleIn .25s cubic-bezier(.16,1,.3,1)'}}>
      <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--fd)',marginBottom:16,textAlign:'center'}}>Выберите область</div>
      <div style={{position:'relative',width:cropSize,height:cropSize,margin:'0 auto',borderRadius:'50%',overflow:'hidden',border:`3px solid ${C.accent}`,cursor:'grab',touchAction:'none',background:'#000'}}
        onMouseDown={e=>{e.preventDefault();startDrag(e.clientX,e.clientY)}}
        onMouseMove={e=>handleMove(e.clientX,e.clientY)}
        onMouseUp={endDrag} onMouseLeave={endDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={endDrag}>
        <canvas ref={canvasRef} width={cropSize} height={cropSize} style={{width:cropSize,height:cropSize}}/>
      </div>
      <p style={{fontSize:11,color:C.muted,textAlign:'center',marginTop:12}}>Двигайте и масштабируйте двумя пальцами</p>
      <div style={{display:'flex',gap:8,marginTop:14}}>
        <button onClick={onCancel} style={{flex:1,padding:'12px',borderRadius:14,border:'none',background:C.surfaceAlt,color:C.soft,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>Отмена</button>
        <button onClick={doCrop} style={{flex:1,padding:'12px',borderRadius:14,border:'none',background:C.accent,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 2px 8px rgba(45,95,63,.2)'}}>Сохранить</button>
      </div>
    </div>
  </div>;
}

function ProgressBar({duration=3,label="Загрузка...",onDone}){
  const[pct,setPct]=useState(0);
  useEffect(()=>{
    // Animate from 0 to ~90% during duration, then stay indeterminate
    // (slowly creeping to ~98%) so user sees progress is ongoing
    const start=Date.now(),ms=duration*1000;
    let raf;
    const tick=()=>{
      const el=Date.now()-start;
      if(el<ms){
        // Normal 0 → 90 over duration
        const p=Math.min(90,Math.round((el/ms)*90));
        setPct(p);
        raf=requestAnimationFrame(tick);
      }else{
        // Beyond duration: creep slowly 90 → 98
        const extra=el-ms;
        const crept=Math.min(8,extra/1000); // 1% per sec after duration, max 8
        setPct(Math.min(98,90+crept));
        raf=requestAnimationFrame(tick);
      }
    };
    raf=requestAnimationFrame(tick);
    return()=>{if(raf)cancelAnimationFrame(raf)};
  },[]);
  return <div style={{width:'min(280px,80vw)',textAlign:'center'}}>
    <div style={{fontSize:32,fontWeight:700,fontFamily:'var(--fd)',letterSpacing:'.06em',color:C.text,marginBottom:4}}>ELLME</div>
    <div style={{fontSize:10,color:C.muted,letterSpacing:'.15em',textTransform:'uppercase',marginBottom:32}}>Eat Live Love ME</div>
    <div style={{height:4,borderRadius:2,background:C.surfaceAlt,overflow:'hidden',marginBottom:8,position:'relative'}}>
      <div style={{height:'100%',borderRadius:2,background:C.accent,width:pct+'%',transition:'width .3s ease'}}/>
    </div>
    <div style={{fontSize:13,color:C.muted,textAlign:'center',minHeight:20}}>{label}</div>
  </div>;
}

function TimePick({value,onChange,placeholder}){
  const h=value?value.split(':')[0]:'';
  const m=value?value.split(':')[1]:'';
  const selStyle={padding:'10px 4px',borderRadius:10,border:`1.5px solid ${C.tileBorder}`,fontSize:15,fontFamily:'inherit',background:C.surface,outline:'none',color:value?C.text:C.muted,appearance:'none',WebkitAppearance:'none',textAlign:'center',cursor:'pointer',width:52};
  return <div style={{display:'flex',alignItems:'center',gap:2}}>
    <select value={h} onChange={e=>{const nv=e.target.value+':'+(m||'00');onChange(nv)}} style={selStyle}>
      <option value="" disabled>чч</option>
      {Array.from({length:24},(_,i)=>String(i).padStart(2,'0')).map(v=><option key={v} value={v}>{v}</option>)}
    </select>
    <span style={{fontSize:18,fontWeight:700,color:C.muted}}>:</span>
    <select value={m} onChange={e=>{const nv=(h||'00')+':'+e.target.value;onChange(nv)}} style={selStyle}>
      <option value="" disabled>мм</option>
      {Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map(v=><option key={v} value={v}>{v}</option>)}
    </select>
    {value&&<button onClick={()=>onChange('')} aria-label="Сбросить время" style={{marginLeft:6,width:28,height:28,borderRadius:'50%',border:'none',background:C.surfaceAlt,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:C.muted,fontFamily:'inherit',padding:0,WebkitTapHighlightColor:'transparent'}}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>}
  </div>;
}

function Chip({children,sel,onClick,dis}){
  if(dis&&!sel)return null;
  return <button onClick={dis?undefined:onClick} style={{padding:'7px 16px',borderRadius:100,fontSize:13,fontWeight:sel?600:400,fontFamily:'inherit',border:`1.5px solid ${sel?C.accent:'transparent'}`,cursor:dis?'default':'pointer',background:sel?C.accentSoft:C.surfaceAlt,color:sel?C.accent:C.soft,transition:'all .15s'}}>{children}</button>;
}

function Scale({max=10,value:v,onChange,dis,lowLabel,highLabel}){
  if(dis){
    if(v==null)return <span style={{fontSize:13,color:C.muted}}>—</span>;
    return <div style={{display:'flex',alignItems:'center',gap:10}}>
      <span style={{fontSize:22,fontWeight:700,fontFamily:'var(--fd)',color:C.accent}}>{v}</span>
      <div style={{flex:1,height:5,borderRadius:3,background:C.surfaceAlt,overflow:'hidden',maxWidth:160}}><div style={{height:'100%',width:`${(v/max)*100}%`,borderRadius:3,background:C.accent,transition:'width .4s'}}/></div>
      <span style={{fontSize:12,color:C.muted}}>/ {max}</span>
    </div>;
  }
  return <div>
    <div style={{display:'flex',gap:3}}>
      {Array.from({length:max},(_,i)=>i+1).map(n=><button key={n} onClick={()=>onChange(v===n?null:n)} style={{flex:1,height:36,minWidth:0,borderRadius:8,border:'none',fontSize:12,fontWeight:600,fontFamily:'inherit',cursor:'pointer',background:v===n?C.accent:C.surfaceAlt,color:v===n?'#fff':C.soft,transition:'all .12s',transform:v===n?'scale(1.05)':'scale(1)',boxShadow:v===n?'0 2px 8px rgba(45,95,63,.25)':'none'}}>{n}</button>)}
    </div>
    {(lowLabel||highLabel)&&<div style={{display:'flex',justifyContent:'space-between',marginTop:4,padding:'0 2px'}}>
      <span style={{fontSize:10,color:C.muted}}>{lowLabel||''}</span>
      <span style={{fontSize:10,color:C.muted}}>{highLabel||''}</span>
    </div>}
  </div>;
}

function Mood({value:v,onChange,dis}){
  const f=['😫','😔','😐','🙂','😄'];
  if(dis){if(v==null)return <span style={{fontSize:13,color:C.muted}}>—</span>;return <div style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:32}}>{f[v]}</span><span style={{fontSize:14,fontWeight:500}}>{MOOD_L[v]}</span></div>;}
  return <div style={{display:'flex',gap:6}}>{f.map((c,i)=><button key={i} onClick={()=>onChange(v===i?null:i)} style={{flex:1,padding:'8px 2px',borderRadius:16,border:`2px solid ${v===i?C.accent:'transparent'}`,background:v===i?C.accentSoft:C.surfaceAlt,cursor:'pointer',transition:'all .15s',display:'flex',flexDirection:'column',alignItems:'center',gap:4,transform:v===i?'scale(1.06)':'scale(1)',boxShadow:v===i?'0 3px 12px rgba(45,95,63,.2)':'none',fontFamily:'inherit'}}><span style={{fontSize:26}}>{c}</span><span style={{fontSize:9,color:v===i?C.accent:C.muted,fontWeight:v===i?600:400}}>{MOOD_L[i]}</span></button>)}</div>;
}

// Microphone button — speech-to-text via Web Speech API
function MicButton({onResult,onStart,style:st}){
  const[listening,setListening]=useState(false);
  const recRef=useRef(null);
  const finalBufferRef=useRef('');
  const seenFinalsRef=useRef(null);
  const toggle=()=>{
    if(listening&&recRef.current){recRef.current.stop();return;}
    const SR=typeof window!=='undefined'&&(window.SpeechRecognition||window.webkitSpeechRecognition);
    if(!SR){alert('Голосовой ввод не поддерживается в этом браузере');return;}
    const rec=new SR();
    rec.lang='ru-RU';
    rec.continuous=true;
    rec.interimResults=true;
    finalBufferRef.current='';
    seenFinalsRef.current=new Set();
    onStart&&onStart();
    rec.onresult=(e)=>{
      let interim='';
      // Iterate ALL results — Android often re-fires events with old indices
      // Dedupe finals by (index + text) key to prevent duplication
      for(let i=0;i<e.results.length;i++){
        const result=e.results[i];
        const transcript=result[0].transcript;
        if(result.isFinal){
          const key=i+'::'+transcript.trim();
          if(!seenFinalsRef.current.has(key)){
            finalBufferRef.current+=transcript+' ';
            seenFinalsRef.current.add(key);
          }
        }else{
          interim+=transcript+' ';
        }
      }
      onResult&&onResult((finalBufferRef.current+interim).trim());
    };
    rec.onend=()=>{setListening(false);recRef.current=null;finalBufferRef.current='';seenFinalsRef.current=null;};
    rec.onerror=()=>{setListening(false);recRef.current=null;finalBufferRef.current='';seenFinalsRef.current=null;};
    recRef.current=rec;
    rec.start();
    setListening(true);
  };
  return <button type="button" onClick={toggle} style={{background:listening?'#E74C3C':C.surfaceAlt,border:'none',borderRadius:12,cursor:'pointer',padding:'10px 12px',display:'flex',alignItems:'center',justifyContent:'center',color:listening?'#fff':C.muted,transition:'all .2s',animation:listening?'pulse 1.5s infinite':'none',...(st||{})}}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
      <path d="M19 10v2a7 7 0 01-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  </button>;
}

function Area({value:v,onChange,placeholder:ph,dis,rows=3,showMic=false}){
  const ref=useRef(null);
  const baseTextRef=useRef('');
  const autoGrow=()=>{const el=ref.current;if(el){el.style.height='auto';el.style.height=el.scrollHeight+'px'}};
  useEffect(()=>{if(!dis)autoGrow()},[v,dis]);
  if(dis)return <div style={{fontSize:14,color:v?C.text:C.muted,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{v||'—'}</div>;
  const handleMicStart=()=>{baseTextRef.current=v||'';};
  const handleMic=(text)=>{
    const base=baseTextRef.current;
    const sep=base&&!base.endsWith(' ')?' ':'';
    onChange(base+sep+text);
  };
  return <div style={{position:'relative'}}>
    <textarea ref={ref} value={v||''} onChange={e=>{onChange(e.target.value);autoGrow()}} placeholder={ph} rows={rows}
      style={{width:'100%',padding:'12px '+(showMic?'48px':'16px')+' 12px 16px',borderRadius:14,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',resize:'none',outline:'none',boxSizing:'border-box',background:C.surface,lineHeight:1.6,color:C.text,transition:'border-color .2s',overflow:'hidden',minHeight:rows*24+24}}
      onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.tileBorder}/>
    {showMic&&<MicButton onResult={handleMic} onStart={handleMicStart} style={{position:'absolute',right:6,top:6}}/>}
  </div>;
}

function Lbl({children}){return <div style={{fontSize:11,fontWeight:600,color:C.muted,letterSpacing:'.06em',textTransform:'uppercase',marginBottom:8}}>{children}</div>;}

function Lightbox({src,photos:galleryPhotos,initialIndex,onClose}){
  const items = galleryPhotos && galleryPhotos.length > 0 ? galleryPhotos : (src ? [src] : []);
  const [idx, setIdx] = useState(initialIndex || 0);
  const touchRef = useRef(null);
  const canPrev = idx > 0, canNext = idx < items.length - 1;
  useEffect(()=>{
    const h=e=>{
      if(e.key==='Escape')onClose();
      if(e.key==='ArrowLeft'&&canPrev)setIdx(i=>i-1);
      if(e.key==='ArrowRight'&&canNext)setIdx(i=>i+1);
    };
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[onClose,canPrev,canNext]);
  const onTouchStart=(e)=>{touchRef.current=e.touches[0].clientX};
  const onTouchEnd=(e)=>{
    if(touchRef.current==null)return;
    const dx=e.changedTouches[0].clientX-touchRef.current;
    touchRef.current=null;
    if(dx>50&&canPrev)setIdx(i=>i-1);
    if(dx<-50&&canNext)setIdx(i=>i+1);
  };
  return <div onClick={onClose} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(10,10,10,.92)',backdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out',animation:'fadeIn .2s'}}>
    <img src={items[idx]} alt="" style={{maxWidth:'94vw',maxHeight:'92vh',objectFit:'contain',borderRadius:16,boxShadow:'0 32px 80px rgba(0,0,0,.4)',animation:'scaleIn .3s cubic-bezier(.16,1,.3,1)'}} key={idx}/>
    <button onClick={onClose} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,.1)',backdropFilter:'blur(8px)',border:'none',color:'#fff',width:44,height:44,borderRadius:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{I.x}</button>
    {items.length>1&&<div style={{position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)',display:'flex',alignItems:'center',gap:12}}>
      {canPrev&&<button onClick={e=>{e.stopPropagation();setIdx(i=>i-1)}} style={{background:'rgba(255,255,255,.15)',backdropFilter:'blur(8px)',border:'none',color:'#fff',width:40,height:40,borderRadius:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>}
      <span style={{color:'rgba(255,255,255,.7)',fontSize:13,fontWeight:500,minWidth:40,textAlign:'center'}}>{idx+1} / {items.length}</span>
      {canNext&&<button onClick={e=>{e.stopPropagation();setIdx(i=>i+1)}} style={{background:'rgba(255,255,255,.15)',backdropFilter:'blur(8px)',border:'none',color:'#fff',width:40,height:40,borderRadius:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>}
    </div>}
  </div>;
}

// ═══ MEAL TILE (2×3 grid) ═══
function MealTile({meal,data,onClick,delay=0,canLike=false,onToggleLike}){
  const d=data||{};
  const photos=Array.isArray(d.photo)?d.photo:(d.photo?[d.photo]:[]);
  const firstPhoto=photos[0]||null;
  const has=d.text||firstPhoto;
  const handleLike=(e)=>{e.stopPropagation();e.preventDefault();onToggleLike&&onToggleLike()};
  return <div onClick={onClick} className="tile3d" style={{
    aspectRatio:'1',borderRadius:20,border:'none',cursor:'pointer',fontFamily:'inherit',
    background:firstPhoto?`url(${firstPhoto}) center/cover`:(has?C.accentSoft:C.tile),
    display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:14,
    position:'relative',overflow:'hidden',textAlign:'left',
    boxShadow:has?C.shadow3d:'none',
    animation:`tileIn .4s cubic-bezier(.34,1.56,.64,1) ${delay}s both`,
    transform:'perspective(600px) rotateX(0deg)',
  }}
    onMouseOver={e=>{e.currentTarget.style.transform='perspective(600px) rotateX(-3deg) translateY(-4px)';e.currentTarget.style.boxShadow=C.shadowHover}}
    onMouseOut={e=>{e.currentTarget.style.transform='perspective(600px) rotateX(0deg)';e.currentTarget.style.boxShadow=has?C.shadow3d:'none'}}
  >
    {firstPhoto&&<div style={{position:'absolute',inset:0,background:'linear-gradient(transparent 40%, rgba(0,0,0,.6))',borderRadius:20}}/>}
    {!firstPhoto&&<div style={{position:'absolute',inset:0,borderRadius:20,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <svg width="44" height="38" viewBox="0 0 32 24" fill="none" stroke={has?'#B8D4BE':'#D5D1CA'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="5" width="30" height="18" rx="3"/><path d="M10 5 L12 1 L20 1 L22 5"/><circle cx="16" cy="14" r="5"/><circle cx="16" cy="14" r="2"/>
      </svg>
    </div>}
    {photos.length>1&&<div style={{position:'absolute',top:10,left:10,background:'rgba(0,0,0,.5)',color:'#fff',borderRadius:8,padding:'2px 8px',fontSize:11,fontWeight:600,zIndex:2,backdropFilter:'blur(4px)'}}>{photos.length} фото</div>}
    {/* Like button: always visible for doc (canLike), decorative for client when liked */}
    {canLike?<button onClick={handleLike} style={{position:'absolute',top:8,right:8,width:32,height:32,borderRadius:'50%',background:d.liked?'rgba(255,255,255,.95)':'rgba(255,255,255,.2)',backdropFilter:'blur(8px)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:d.liked?'0 2px 8px rgba(0,0,0,.15)':'none',zIndex:3,cursor:'pointer',padding:0,transition:'all .15s'}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill={d.liked?'#E74C3C':'none'} stroke={d.liked?'#E74C3C':(firstPhoto?'#fff':C.muted)} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
    </button>:d.liked?<div style={{position:'absolute',top:10,right:10,width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,.92)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,.15)',zIndex:2}}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#E74C3C" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
    </div>:null}
    <div style={{position:'relative',zIndex:1}}>
      {!has&&!meal.isAddSlot&&<div style={{fontSize:13,color:C.muted,marginBottom:2}}>Добавить</div>}
      {meal.isAddSlot&&!has&&<div style={{fontSize:13,color:C.accent,marginBottom:2,display:'flex',alignItems:'center',gap:3}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Добавить
      </div>}
      <div style={{fontSize:15,fontWeight:700,color:firstPhoto?'#fff':(meal.isAddSlot&&!has?C.accent:C.text)}}>{meal.label}</div>
      {d.time&&<div style={{fontSize:12,color:firstPhoto?'rgba(255,255,255,.8)':C.soft,marginTop:2}}>{d.time}</div>}
    </div>
  </div>;
}

// ═══ MEAL DETAIL ═══
function MealDetail({meal,data,onChange,onZoom,onBack,dis,onUploadPhoto}){
  const d=data||{},upd=(k,v)=>onChange({...d,[k]:v});
  const fRef=useRef(null),cRef=useRef(null);
  const[uploading,setUploading]=useState(false);
  const photos=Array.isArray(d.photo)?d.photo:(d.photo?[d.photo]:[]);
  const autoTime = () => { const now = new Date(); return String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0'); };
  const addPhoto = (url) => { const updates = { ...d, photo: [...photos, url] }; if (!d.time) updates.time = autoTime(); onChange(updates); };
  const hFile=async(e)=>{
    const f=e.target.files?.[0];if(!f)return;
    e.target.value='';
    if(onUploadPhoto){
      setUploading(true);
      try{
        const url=await onUploadPhoto(f);
        if(url) addPhoto(url);
      }catch(err){console.error('Photo upload error:',err)}
      setUploading(false);
    }else{
      const r=new FileReader();r.onload=ev=>addPhoto(ev.target.result);r.readAsDataURL(f);
    }
  };
  const removePhoto=(idx)=>{ if(!window.confirm('Удалить фото?'))return; const next=photos.filter((_,i)=>i!==idx); upd('photo',next.length?next:null); };

  const toggleLike=()=>upd('liked',!d.liked);
  const heartBtn=<button onClick={dis?toggleLike:undefined} disabled={!dis&&!d.liked} style={{background:'none',border:'none',cursor:dis?'pointer':(d.liked?'default':'default'),padding:8,display:'flex',alignItems:'center',justifyContent:'center',opacity:(dis||d.liked)?1:0,transition:'all .2s'}}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill={d.liked?'#E74C3C':'none'} stroke={d.liked?'#E74C3C':C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  </button>;

  return <div style={{animation:'slideRight .3s ease'}}>
    <TopBar left={<BackBtn onClick={onBack}/>} title={meal.label} right={(dis||d.liked)?heartBtn:null}/>

    {/* Photos gallery */}
    {photos.length>0&&<div style={{display:'flex',gap:8,overflowX:'auto',marginBottom:16,paddingBottom:4,WebkitOverflowScrolling:'touch'}}>
      {photos.map((p,i)=><div key={i} onClick={()=>onZoom&&onZoom(photos.length>1?{photos,index:i}:p)} style={{position:'relative',borderRadius:16,overflow:'hidden',boxShadow:C.shadow3d,flexShrink:0,width:photos.length===1?'100%':'75%',aspectRatio:'16/10',cursor:'zoom-in'}}>
        <img src={p} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',pointerEvents:'none'}}/>
        {!dis&&<button onClick={(e)=>{e.stopPropagation();removePhoto(i)}} style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,.5)',backdropFilter:'blur(6px)',border:'none',color:'#fff',width:28,height:28,borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>}
        {photos.length>1&&<div style={{position:'absolute',bottom:8,left:8,background:'rgba(0,0,0,.5)',color:'#fff',borderRadius:6,padding:'2px 8px',fontSize:11,backdropFilter:'blur(4px)',pointerEvents:'none'}}>{i+1}/{photos.length}</div>}
      </div>)}
    </div>}
    {/* Hidden file inputs */}
    {!dis&&<><input ref={fRef} type="file" accept="image/*" onChange={hFile} style={{display:'none'}}/><input ref={cRef} type="file" accept="image/*" capture="environment" onChange={hFile} style={{display:'none'}}/></>}

    <div style={{background:C.surface,borderRadius:20,padding:20,boxShadow:C.shadowCard}}>
      {/* Time */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
        <Lbl>Время приёма</Lbl>
        {dis
          ?<span style={{fontSize:15,fontWeight:600,color:d.time?C.text:C.muted}}>{d.time||'—'}</span>
          :<TimePick value={d.time||''} onChange={v=>upd('time',v)}/>
        }
      </div>

      <div style={{marginBottom:18}}>
        <Lbl>Голод до еды</Lbl>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {dis?d.hunger&&<Chip sel dis>{d.hunger}</Chip>:HUNGER.map(h=><Chip key={h} sel={d.hunger===h} onClick={()=>upd('hunger',d.hunger===h?null:h)}>{h}</Chip>)}
          {dis&&!d.hunger&&<span style={{fontSize:13,color:C.muted}}>—</span>}
        </div>
      </div>

      {/* Photo upload — after hunger, before "Что ели" */}
      {!dis&&<div style={{marginBottom:18,animation:'enter .4s ease'}}>
        <Lbl>📸 Добавьте фото еды</Lbl>
        <div style={{display:'flex',gap:8}}>
          {uploading
            ?<div style={{flex:1,padding:'16px',borderRadius:16,border:`1.5px solid ${C.accent}`,background:C.accentSoft,fontSize:13,color:C.accent,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,animation:'pulseGlow 1.5s infinite'}}>
              ⏳ Загрузка фото...
            </div>
            :[{r:fRef,i:I.img,t:photos.length?'+ Ещё фото':'📁 Галерея'},{r:cRef,i:I.cam,t:photos.length?'+ Камера':'📷 Камера'}].map((b,i)=>
              <button key={i} onClick={()=>b.r.current?.click()} style={{flex:1,padding:'16px 12px',borderRadius:16,border:`1.5px dashed ${photos.length?C.tileBorder:C.accent}`,background:photos.length?'transparent':C.accentSoft,cursor:'pointer',fontSize:13,fontWeight:photos.length?400:600,color:photos.length?C.muted:C.accent,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .2s',animation:photos.length?'none':'enter .5s ease '+(i*0.1)+'s both'}}
                onMouseOver={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;e.currentTarget.style.background=C.accentSoft}} onMouseOut={e=>{e.currentTarget.style.borderColor=photos.length?C.tileBorder:C.accent;e.currentTarget.style.color=photos.length?C.muted:C.accent;e.currentTarget.style.background=photos.length?'transparent':C.accentSoft}}>
                {b.t}
              </button>)
          }
        </div>
      </div>}

      <div style={{marginBottom:18}}>
        <Lbl>Что ели</Lbl>
        <Area value={d.text} onChange={v=>upd('text',v)} placeholder="Опишите приём пищи..." dis={dis} rows={2} showMic={!dis}/>
      </div>

      <div>
        <Lbl>Самочувствие после</Lbl>
        <div style={{display:'flex',gap:6,marginBottom:10}}>
          {dis
            ? d.feeling && <Chip sel dis>{d.feeling}</Chip>
            : ['Дискомфорт','Нормально','Отлично'].map(f => <Chip key={f} sel={d.feeling===f} onClick={()=>upd('feeling',d.feeling===f?null:f)}>{f}</Chip>)
          }
          {dis && !d.feeling && <span style={{fontSize:13,color:C.muted}}>—</span>}
        </div>
        <Area value={d.feelingNote} onChange={v=>upd('feelingNote',v)} placeholder="Подробнее об ощущениях..." dis={dis} rows={2} showMic={!dis}/>
      </div>
    </div>
    {!dis&&<button onClick={onBack} style={{width:'100%',marginTop:16,padding:'14px',borderRadius:16,border:`1.5px solid ${C.tileBorder}`,background:'transparent',cursor:'pointer',fontSize:14,fontWeight:500,color:C.accent,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .2s'}}
      onMouseOver={e=>{e.currentTarget.style.background=C.accentSoft}} onMouseOut={e=>{e.currentTarget.style.background='transparent'}}>
      ← Вернуться на главную
    </button>}
  </div>;
}

// ═══ SECTIONS (water, sleep, etc) ═══
function SecCard({icon,title,children,extra}){
  const[open,setOpen]=useState(true);
  return <div style={{background:C.surface,borderRadius:20,boxShadow:C.shadowCard,overflow:'hidden',marginTop:12}}>
    <button onClick={()=>setOpen(!open)} style={{width:'100%',padding:'14px 18px',display:'flex',alignItems:'center',gap:10,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
      <span style={{color:C.accent,display:'flex'}}>{icon}</span>
      <span style={{flex:1,textAlign:'left',fontSize:15,fontWeight:600,color:C.text}}>{title}</span>
      {extra}
      <span style={{transition:'transform .2s',transform:open?'rotate(90deg)':'rotate(0)',color:C.muted,display:'flex'}}>{I.chev}</span>
    </button>
    {open&&<div style={{padding:'0 18px 18px',borderTop:`1px solid ${C.surfaceAlt}`}}>{children}</div>}
  </div>;
}

function ScaleHelpButton(){
  const[open,setOpen]=useState(false);
  return <div style={{marginTop:12,marginBottom:4}}>
    <button onClick={()=>setOpen(!open)} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',color:C.muted,fontSize:12,padding:'8px 0'}}>
      <div style={{width:18,height:18,borderRadius:'50%',background:C.surfaceAlt,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:C.soft}}>?</div>
      Как заполнять шкалы
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:open?'rotate(180deg)':'none',transition:'transform .15s'}}><path d="M6 9l6 6 6-6"/></svg>
    </button>
    {open&&<div style={{background:C.surface,borderRadius:16,padding:16,boxShadow:C.shadowCard,animation:'enter .2s',marginTop:4}}>
      {[
        {icon:'🧠',title:'Стресс (1–10)',desc:'1 = полное спокойствие, 10 = максимальный стресс'},
        {icon:'😴',title:'Качество сна (1–10)',desc:'1 = ужасный сон, 10 = выспался идеально'},
        {icon:'⚡',title:'Энергия (1–10)',desc:'1 = нет сил, 10 = полон энергии'},
        {icon:'😊',title:'Настроение (5 уровней)',desc:'Эмодзи от 😫 Тяжело до 😄 Прекрасно'},
        {icon:'💧',title:'Вода',desc:'Только чистая вода и травяной чай'},
        {icon:'🪑',title:'Стул',desc:'Норма = оформленный. Диарея, запор, отсутствие = не норма'},
      ].map((item,i)=><div key={i} style={{display:'flex',gap:10,marginBottom:i<5?10:0}}>
        <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:C.text}}>{item.title}</div>
          <div style={{fontSize:11,color:C.soft,lineHeight:1.4}}>{item.desc}</div>
        </div>
      </div>)}
    </div>}
  </div>;
}

function DayExtras({data,setData,dis,waterNorm=2200,onCelebrate,dateKey}){
  const d=data||{},upd=(k,v)=>setData({...d,[k]:v});
  // Water log: stored in localStorage by date, array of {ml, time}
  const lsKey = 'wl_' + (dateKey || '');
  const [waterLog, setWaterLog] = useState([]);
  // Reload log from localStorage when date changes
  useEffect(() => {
    try {
      const s = typeof window !== 'undefined' && localStorage.getItem(lsKey);
      setWaterLog(s ? JSON.parse(s) : []);
    } catch(e) { setWaterLog([]); }
  }, [lsKey]);
  const saveWaterLog = (log) => { setWaterLog(log); try { localStorage.setItem(lsKey, JSON.stringify(log)); } catch(e) {} };
  const waterMl = waterLog.length > 0 ? waterLog.reduce((s, e) => s + (e.ml || 0), 0) : (d.water || 0);
  const waterPctRaw=Math.round((waterMl/waterNorm)*100);
  const waterPct=Math.min(100,waterPctRaw);
  const [showWaterLog, setShowWaterLog] = useState(false);
  const [showWaterHint, setShowWaterHint] = useState(false);
  const addWater=(ml)=>{
    if(dis)return;
    const now = new Date();
    const time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    const newLog = [...waterLog, { ml, time }];
    const total = newLog.reduce((s, e) => s + (e.ml || 0), 0);
    saveWaterLog(newLog);
    upd('water', total);
    if(waterMl<waterNorm&&total>=waterNorm&&onCelebrate)onCelebrate('water');
  };
  const removeWaterEntry = (idx) => {
    const newLog = waterLog.filter((_, i) => i !== idx);
    const total = newLog.reduce((s, e) => s + (e.ml || 0), 0);
    saveWaterLog(newLog);
    upd('water', total);
  };
  // Debounced sleep celebration — waits 2s after the last change so the
  // user has time to set BOTH hours AND minutes before the confetti
  // fires. Without this, picking hour "23" (intended "23:55") would
  // immediately trigger "Отличный сон!" because 23:00→wake = 8h.
  const sleepTimerRef=useRef(null);
  const checkSleep=(s)=>{
    if(sleepTimerRef.current)clearTimeout(sleepTimerRef.current);
    if(!s.bed||!s.wake||!onCelebrate)return;
    sleepTimerRef.current=setTimeout(()=>{
      const parts=(t)=>{const p=(t||'').split(':').map(Number);return p.length>=2?p:[NaN,NaN]};
      const[bh,bm]=parts(s.bed);const[wh,wm]=parts(s.wake);
      if(isNaN(bh)||isNaN(wh))return;
      let hrs=wh-bh+(wm-bm)/60;if(hrs<=0)hrs+=24;
      // sleep celebration disabled
    },2000);
  };
  useEffect(()=>()=>{if(sleepTimerRef.current)clearTimeout(sleepTimerRef.current)},[]);
  return <>
    {/* Water — bottle style */}
    <SecCard icon={I.drop} title={`Вода · ${waterMl} мл`} extra={<button onClick={e=>{e.stopPropagation();setShowWaterHint(!showWaterHint)}} style={{width:18,height:18,borderRadius:'50%',background:showWaterHint?C.accent:'#E3EFE7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:showWaterHint?'#fff':C.accent,cursor:'pointer',flexShrink:0,border:'none',transition:'all .15s',marginRight:4}}>i</button>}>
      <div style={{padding:'14px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
          {/* Bottle visualization — tap to show/hide log */}
          <div onClick={waterLog.length>0?()=>setShowWaterLog(!showWaterLog):undefined} style={{width:48,position:'relative',flexShrink:0,cursor:waterLog.length>0?'pointer':'default'}}>
            <div style={{width:48,height:100,borderRadius:12,border:`2px solid ${waterLog.length>0?'#7BC8E8':C.tileBorder}`,position:'relative',overflow:'hidden',background:C.surfaceAlt,transition:'border-color .2s'}}>
              <div style={{position:'absolute',bottom:0,left:0,right:0,height:`${waterPct}%`,transition:'height .5s cubic-bezier(.34,1.56,.64,1)'}}>
                {waterPct>0&&<svg viewBox="0 0 96 8" preserveAspectRatio="none" style={{position:'absolute',top:-4,left:0,width:'200%',height:8,animation:'wave 3s linear infinite'}}>
                  <path d="M0 4 Q6 0 12 4 T24 4 T36 4 T48 4 T60 4 T72 4 T84 4 T96 4 V8 H0Z" fill="#A8DFF0"/>
                </svg>}
                <div style={{width:'100%',height:'100%',background:'linear-gradient(to top, #5BB8DB, #7BC8E8, #A8DFF0)',borderRadius:'0 0 10px 10px'}}/>
              </div>
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:waterPct>45?'#fff':C.soft,textShadow:waterPct>45?'0 1px 3px rgba(0,0,0,.2)':'none',zIndex:1}}>{waterPctRaw}%</div>
            </div>
            {waterLog.length>0&&!dis&&<div style={{position:'absolute',top:-4,right:-4,width:20,height:20,borderRadius:6,background:'#7BC8E8',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 1px 4px rgba(0,0,0,.15)'}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </div>}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'baseline',gap:6}}>
              <span style={{fontSize:24,fontWeight:700,fontFamily:'var(--fd)',color:C.text}}>{waterMl}</span>
              <span style={{fontSize:14,fontWeight:400,color:C.muted}}>мл</span>
            </div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Норма: {waterNorm} мл</div>
            <div style={{height:6,borderRadius:3,background:C.surfaceAlt,overflow:'hidden',marginTop:8}}>
              <div style={{height:'100%',width:`${waterPct}%`,borderRadius:3,background:waterPct>=100?C.accent:'#7BC8E8',transition:'width .5s'}}/>
            </div>
            <div style={{fontSize:11,color:waterPctRaw>=100?C.accent:C.muted,marginTop:4,fontWeight:waterPctRaw>=100?600:400}}>{waterPctRaw>=100?'Норма выполнена'+(waterMl>waterNorm?' (+' +(waterMl-waterNorm)+' мл)':''):'Осталось '+(waterNorm-waterMl)+' мл'}</div>
            {showWaterHint&&<div style={{fontSize:11,color:C.soft,marginTop:6,padding:'8px 10px',background:C.surfaceAlt,borderRadius:10,lineHeight:1.4,animation:'enter .15s'}}>Вноси только воду и травяной чай</div>}
          </div>
        </div>
        {/* Water log — history of additions */}
        {showWaterLog&&waterLog.length>0&&<div style={{marginBottom:12,background:C.surfaceAlt,borderRadius:14,padding:'8px 0',animation:'enter .2s'}}>
          {waterLog.map((entry, i) => <div key={i} style={{display:'flex',alignItems:'center',padding:'8px 14px',borderBottom:i<waterLog.length-1?`1px solid ${C.tileBorder}`:'none'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7BC8E8" strokeWidth="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:C.text}}>Вода — {entry.ml} мл</div>
              </div>
            </div>
            <span style={{fontSize:12,color:C.muted,marginRight:10}}>{entry.time}</span>
            {!dis&&<button onClick={()=>removeWaterEntry(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#D85A30',display:'flex',padding:4}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>}
          </div>)}
        </div>}
        {!dis&&<div style={{display:'flex',gap:6}}>
          {[100,200,250,330,500].map(ml=><button key={ml} onClick={()=>addWater(ml)} style={{flex:1,padding:'8px 4px',borderRadius:10,border:`1.5px solid ${C.tileBorder}`,background:C.surface,cursor:'pointer',fontSize:12,fontWeight:500,color:C.soft,fontFamily:'inherit',transition:'all .15s'}}
            onMouseOver={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;e.currentTarget.style.background=C.accentSoft}}
            onMouseOut={e=>{e.currentTarget.style.borderColor=C.tileBorder;e.currentTarget.style.color=C.soft;e.currentTarget.style.background=C.surface}}>
            +{ml}
          </button>)}
        </div>}
      </div>
    </SecCard>

    <SecCard icon={I.moon} title="Сон">
      <div style={{padding:'12px 0',display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><Lbl>Подъём сегодня</Lbl></div>
          {dis?<span style={{fontSize:14,fontWeight:500,color:d.sleep?.wake?C.text:C.muted}}>{d.sleep?.wake||'—'}</span>
            :<TimePick value={d.sleep?.wake||''} onChange={v=>{const ns=Object.assign({},d.sleep||{},{wake:v});upd('sleep',ns);checkSleep(ns)}}/>}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><Lbl>Отход ко сну вчера</Lbl></div>
          {dis?<span style={{fontSize:14,fontWeight:500,color:d.sleep?.bed?C.text:C.muted}}>{d.sleep?.bed||'—'}</span>
            :<TimePick value={d.sleep?.bed||''} onChange={v=>{const ns=Object.assign({},d.sleep||{},{bed:v});upd('sleep',ns);checkSleep(ns)}}/>}
        </div>
        {(()=>{
          if(!d.sleep?.bed||!d.sleep?.wake)return null;
          const pt=(t)=>{const p=t.split(':');return parseInt(p[0])*60+parseInt(p[1]||'0')};
          let mins=pt(d.sleep.wake)-pt(d.sleep.bed);if(mins<0)mins+=1440;
          const hrs=mins/60;
          if(hrs>14)return <div style={{padding:'10px 14px',borderRadius:12,background:'#FFF3E0',border:'1px solid #FFB74D',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
            <div style={{fontSize:12,color:'#8a5000',lineHeight:1.4}}>⚠️ Сон {Math.round(hrs)}ч — перепутаны лёг/встал?</div>
            {!dis&&<button onClick={()=>upd('sleep',{...d.sleep,bed:d.sleep.wake,wake:d.sleep.bed})} style={{background:'#FFB74D',border:'none',color:'#fff',borderRadius:8,padding:'6px 12px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>Поменять</button>}
          </div>;
          return null;
        })()}
        <div><Lbl>Качество сна</Lbl><Scale max={10} value={d.sleep?.quality} onChange={v=>upd('sleep',{...(d.sleep||{}),quality:v})} dis={dis} lowLabel="Плохой сон" highLabel="Отличный сон"/></div>
      </div>
    </SecCard>

    <SecCard icon={I.heart} title="Самочувствие">
      <div style={{padding:'12px 0',display:'flex',flexDirection:'column',gap:14}}>
        <div><Lbl>Энергия</Lbl><Scale max={10} value={d.well?.energy} onChange={v=>upd('well',{...(d.well||{}),energy:v})} dis={dis} lowLabel="Нет сил" highLabel="Полон энергии"/></div>
        <div><Lbl>Настроение</Lbl><Mood value={d.well?.mood} onChange={v=>upd('well',{...(d.well||{}),mood:v})} dis={dis}/></div>
        <div><Lbl>Заметка дня</Lbl><Area value={d.well?.comment} onChange={v=>upd('well',{...(d.well||{}),comment:v})} placeholder="Как прошёл день..." dis={dis} rows={3} showMic={!dis}/></div>
      </div>
    </SecCard>

    <SecCard icon={I.run} title="Движение">
      {(()=>{
        const mv=parseMovement(d.movement);
        const setMv=(next)=>upd('movement',JSON.stringify(next));
        const acts=mv.activities||[];
        const toggleAct=(id)=>{
          if(dis)return;
          const exists=acts.find(a=>a.type===id);
          if(exists){
            setMv({...mv,activities:acts.filter(a=>a.type!==id)});
          }else{
            setMv({...mv,activities:[...acts,{type:id,duration:10}]});
          }
        };
        const setActDur=(id,dur)=>{
          setMv({...mv,activities:acts.map(a=>a.type===id?{...a,duration:dur}:a)});
        };
        return <div style={{padding:'12px 0',display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <Lbl>Тип активности</Lbl>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {ACTIVITIES.map(a=>
                <Chip key={a.id} sel={!!acts.find(x=>x.type===a.id)} dis={dis}
                  onClick={()=>toggleAct(a.id)}>{a.label}</Chip>
              )}
            </div>
          </div>
          {acts.length>0&&acts.map(act=>{
            const label=ACTIVITIES.find(a=>a.id===act.type)?.label||act.type;
            return <div key={act.type} style={{background:C.surfaceAlt,borderRadius:14,padding:'10px 14px'}}>
              <div style={{fontSize:13,fontWeight:600,color:C.accent,marginBottom:6}}>{label}</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14}}>
                <button onClick={dis?undefined:()=>setActDur(act.type,Math.max(5,act.duration-10))}
                  style={{width:34,height:34,borderRadius:'50%',border:`1.5px solid ${C.tileBorder}`,background:C.surface,cursor:dis?'default':'pointer',fontSize:18,fontWeight:600,color:dis?C.muted:C.accent,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                <div style={{minWidth:70,textAlign:'center'}}>
                  <span style={{fontSize:20,fontWeight:700,fontFamily:'var(--fd)',color:C.accent}}>{act.duration}</span>
                  <span style={{fontSize:12,color:C.muted,marginLeft:4}}>мин</span>
                </div>
                <button onClick={dis?undefined:()=>setActDur(act.type,act.duration+10)}
                  style={{width:34,height:34,borderRadius:'50%',border:`1.5px solid ${C.tileBorder}`,background:C.surface,cursor:dis?'default':'pointer',fontSize:18,fontWeight:600,color:dis?C.muted:C.accent,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
              </div>
            </div>;
          })}
          <div>
            <Lbl>Заметка</Lbl>
            <Area value={mv.note} onChange={v=>setMv({...mv,note:v})} placeholder="Детали тренировки..." dis={dis} rows={2} showMic={!dis}/>
          </div>
        </div>;
      })()}
    </SecCard>

    <SecCard icon={I.brain} title="Стресс">
      <div style={{padding:'12px 0',display:'flex',flexDirection:'column',gap:14}}>
        <div><Lbl>Уровень</Lbl><Scale max={10} value={d.stress?.level} onChange={v=>upd('stress',{...(d.stress||{}),level:v})} dis={dis} lowLabel="Спокоен" highLabel="Сильный стресс"/></div>
        <div>
          <Lbl>Практики расслабления</Lbl>
          {(()=>{
            const PRACTICES=['Дыхание','Медитация','Йога','Массаж','Ванна','Музыка','Другое'];
            const selected=Array.isArray(d.stress?.practicesList)?d.stress.practicesList:[];
            const toggleP=(p)=>{if(dis)return;const next=selected.includes(p)?selected.filter(x=>x!==p):[...selected,p];upd('stress',{...(d.stress||{}),practicesList:next})};
            return <>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {dis
                  ? selected.length>0?selected.map(p=><Chip key={p} sel dis>{p}</Chip>):<span style={{fontSize:13,color:C.muted}}>—</span>
                  : PRACTICES.map(p=><Chip key={p} sel={selected.includes(p)} onClick={()=>toggleP(p)}>{p}</Chip>)
                }
              </div>
            </>;
          })()}
        </div>
        <div><Lbl>Детали практики</Lbl><Area value={d.stress?.practices} onChange={v=>upd('stress',{...(d.stress||{}),practices:v})} placeholder="Подробности, длительность..." dis={dis} rows={2} showMic={!dis}/></div>
      </div>
    </SecCard>

    <SecCard icon={I.pill} title="Препараты / БАДы">
      <div style={{padding:'12px 0'}}><Area value={d.supplements} onChange={v=>upd('supplements',v)} placeholder="Что принимали..." dis={dis} rows={2} showMic={!dis}/></div>
    </SecCard>

    <SecCard icon={I.stool} title="Стул">
      <div style={{padding:'12px 0',display:'flex',flexDirection:'column',gap:14}}>
        <div>
          <Lbl>Состояние</Lbl>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {dis
              ? d.stoolState && <Chip sel dis>{d.stoolState}</Chip>
              : ['Диарея','Норма','Запор','Нет стула'].map(s => <Chip key={s} sel={d.stoolState===s} onClick={()=>upd('stoolState',d.stoolState===s?null:s)}>{s}</Chip>)
            }
            {dis && !d.stoolState && <span style={{fontSize:13,color:C.muted}}>—</span>}
          </div>
        </div>
        <div>
          <Lbl>Комментарий</Lbl>
          <Area value={d.stoolNote} onChange={v=>upd('stoolNote',v)} placeholder="Подробности..." dis={dis} rows={2} showMic={!dis}/>
        </div>
      </div>
    </SecCard>

  </>;
}

// ═══ CALENDAR ═══
function Cal({sel,onSelect}){
  // Week starts Monday: find Monday of the week containing `sel`
  const dayOfWeek = sel.getDay(); // 0=Sun, 1=Mon...6=Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // how many days back to Monday
  const days=[];
  for(let i=0;i<7;i++){const d=new Date(sel);d.setDate(sel.getDate()+mondayOffset+i);days.push(d);}
  const today=new Date();
  const goWeek=dir=>{const d=new Date(sel);d.setDate(d.getDate()+dir*7);onSelect(d)};
  return <div style={{marginBottom:12}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',marginBottom:6}}>
      <span style={{fontSize:16,fontWeight:600,fontFamily:'var(--fd)',color:C.text}}>{MO[sel.getMonth()]} {sel.getFullYear()}</span>
    </div>
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
      <button onClick={()=>goWeek(-1)} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:8,display:'flex',transform:'rotate(180deg)',flexShrink:0}}>{I.chev}</button>
      <div style={{display:'flex',justifyContent:'center',gap:4,flex:1}}>
        {days.map((d,i)=>{const s2=sameD(d,sel),td=sameD(d,today);
          return <button key={i} onClick={()=>onSelect(new Date(d))} style={{
            display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 9px',borderRadius:14,border:'none',minWidth:44,cursor:'pointer',fontFamily:'inherit',
            background:s2?C.accent:'transparent',color:s2?'#fff':C.soft,transition:'all .2s',boxShadow:s2?'0 2px 10px rgba(45,95,63,.25)':'none',
          }}>
            <span style={{fontSize:10,fontWeight:500,opacity:.6,letterSpacing:'.04em'}}>{DS[d.getDay()]}</span>
            <span style={{fontSize:18,fontWeight:700,marginTop:2,fontFamily:'var(--fd)'}}>{d.getDate()}</span>
            {td&&!s2&&<div style={{width:4,height:4,borderRadius:'50%',background:C.accent,marginTop:2}}/>}
          </button>;
        })}
      </div>
      <button onClick={()=>goWeek(1)} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:8,display:'flex',flexShrink:0}}>{I.chev}</button>
    </div>
  </div>;
}

// ═══ PROFILE PAGE ═══
function Profile({user,onBack,onLogout,photo,onPhotoChange,waterNorm,onWaterNormChange,onZoom,onOpenAnalytics}){
  const[name,setName]=useState(user.name||'');
  const[email,setEmail]=useState('');
  const[phone,setPhone]=useState('');
  const[height,setHeight]=useState('');
  const[weight,setWeight]=useState('');
  const[age,setAge]=useState('');
  const[gender,setGender]=useState('');
  const[request,setRequest]=useState('');
  const[wn,setWn]=useState(String(waterNorm||2200));
  const[saved,setSaved]=useState(false);
  const[showPwPopup,setShowPwPopup]=useState(false);
  const[pw1,setPw1]=useState('');const[pw2,setPw2]=useState('');const[pw3,setPw3]=useState('');
  const[showPw1,setShowPw1]=useState(false);const[showPw2,setShowPw2]=useState(false);const[showPw3,setShowPw3]=useState(false);
  const[pwMsg,setPwMsg]=useState('');const[pwErr,setPwErr]=useState('');const[pwLoading,setPwLoading]=useState(false);
  const[supportText,setSupportText]=useState('');const[supportFile,setSupportFile]=useState(null);const[supportSent,setSupportSent]=useState(false);const[supportLoading,setSupportLoading]=useState(false);const[showSupport,setShowSupport]=useState(false);
  const[cropSrc,setCropSrc]=useState(null);
  const supportFileRef=useRef(null);
  const isDoc=user.role==='doc';
  const avatarRef=useRef(null);

  const handleChangePw=async()=>{
    setPwErr('');setPwMsg('');
    if(!pw2||!pw3){setPwErr('Заполните все поля');return;}
    if(pw2!==pw3){setPwErr('Пароли не совпадают');return;}
    if(pw2.length<6){setPwErr('Минимум 6 символов');return;}
    if(!supabase){setPwErr('Сервис недоступен');return;}
    setPwLoading(true);
    try{
      const{error}=await supabase.auth.updateUser({password:pw2});
      if(error){
        const msg=error.message||'';
        if(msg.includes('same')||msg.includes('different'))setPwErr('Новый пароль должен отличаться от текущего');
        else if(msg.includes('weak'))setPwErr('Пароль слишком простой');
        else setPwErr(msg||'Ошибка при смене пароля');
      }else{
        setPwMsg('Пароль изменён ✓');setPw1('');setPw2('');setPw3('');
        setTimeout(()=>{setShowPwPopup(false);setPwMsg('')},1500);
      }
    }catch(e){setPwErr(e.message||'Ошибка подключения');}
    setPwLoading(false);
  };

  const handleSendSupport=async()=>{
    if(!supportText.trim())return;
    setSupportLoading(true);
    try{
      let fileUrl=null;
      if(supportFile&&supabase){
        const path=user.id+'/support/'+Date.now()+'_'+supportFile.name;
        const{error:upErr}=await supabase.storage.from('photos').upload(path,supportFile,{upsert:true});
        if(upErr)console.error('Support file upload error:',upErr);
        const{data}=supabase.storage.from('photos').getPublicUrl(path);
        fileUrl=data?.publicUrl||null;
      }
      // Save to DB
      if(supabase){
        const{error:insErr}=await supabase.from('support_messages').insert({
          user_id:user.id,
          email:email||user.email||'',
          text:supportText.trim(),
          file_url:fileUrl
        });
        if(insErr)console.error('Support insert error:',insErr);
      }
      // Send email notification
      await fetch('/api/support',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:email||user.email||'',text:supportText.trim(),fileUrl})
      }).then(r=>{if(!r.ok)console.error('Support email error:',r.status)}).catch(e=>console.error('Support fetch error:',e));
      setSupportSent(true);setSupportText('');setSupportFile(null);
      setTimeout(()=>setSupportSent(false),3000);
    }catch(e){console.error(e);}
    setSupportLoading(false);
  };

  const eyeSvgOpen=<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  const eyeSvgClosed=<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
  const pwFieldStyle={width:'100%',padding:'14px 44px 14px 16px',borderRadius:14,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:C.surface,color:C.text};
  const eyeBtnStyle={position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:C.muted,display:'flex',padding:2};
  const handleAvatar=async(e)=>{
    const f=e.target.files?.[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>setCropSrc(ev.target.result);
    r.readAsDataURL(f);
    e.target.value='';
  };
  const handleCropSave=async(croppedDataUrl)=>{
    setCropSrc(null);
    onPhotoChange(croppedDataUrl);
    if(supabase&&user?.id){
      // Convert data URL to blob for upload
      const res=await fetch(croppedDataUrl);
      const blob=await res.blob();
      const path=user.id+'/avatar.jpg';
      await supabase.storage.from('photos').upload(path,blob,{upsert:true,contentType:'image/jpeg'});
      const{data:urlData}=supabase.storage.from('photos').getPublicUrl(path);
      if(urlData?.publicUrl){
        const photoUrl=urlData.publicUrl+'?t='+Date.now();
        await supabase.from('profiles').update({photo_url:photoUrl}).eq('id',user.id);
        onPhotoChange(photoUrl);
      }
    }
  };
  useEffect(()=>{if(!supabase||!user?.id)return;supabase.from('profiles').select('*').eq('id',user.id).single().then(({data:p})=>{if(!p)return;if(p.email)setEmail(p.email);if(p.phone)setPhone(p.phone);if(p.age)setAge(String(p.age));if(p.gender)setGender(p.gender);if(p.height_cm)setHeight(String(p.height_cm));if(p.weight_kg)setWeight(String(p.weight_kg));if(p.request)setRequest(p.request);});},[user?.id]);
  const saveProfile=async()=>{if(!supabase||!user?.id)return;const wnVal=parseInt(wn)||2200;await supabase.from('profiles').update({name,email,phone,age:parseInt(age)||null,gender,height_cm:parseInt(height)||null,weight_kg:parseFloat(weight)||null,request,water_norm:wnVal,updated_at:new Date().toISOString()}).eq('id',user.id);onWaterNormChange(wnVal);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const inp=(label,val,set)=><div style={{marginBottom:16}}>
    <Lbl>{label}</Lbl>
    <input value={val} onChange={e=>set(e.target.value)} style={{width:'100%',padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:C.surface,color:C.text}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.tileBorder}/>
  </div>;

  return <div style={{animation:'slideRight .3s ease'}}>
    {cropSrc&&<AvatarCropper src={cropSrc} onSave={handleCropSave} onCancel={()=>setCropSrc(null)}/>}
    <TopBar left={<BackBtn onClick={onBack}/>} title="Профиль" right={null} noBorder/>
    <div style={{textAlign:'center',marginBottom:24}}>
      <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatar} style={{display:'none'}}/>
      <div style={{position:'relative',width:110,height:110,margin:'0 auto 12px'}}>
        {photo?<button onClick={()=>{if(onZoom)onZoom(photo)}} style={{width:110,height:110,borderRadius:'50%',background:'transparent',border:'none',padding:0,cursor:'zoom-in',overflow:'hidden',display:'block',boxShadow:'0 4px 16px rgba(45,95,63,.1)',WebkitTapHighlightColor:'transparent'}}>
          <img src={photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none',display:'block'}}/>
        </button>:<button onClick={()=>avatarRef.current?.click()} style={{width:110,height:110,borderRadius:'50%',background:C.accentSoft,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:C.accent,boxShadow:'0 4px 16px rgba(45,95,63,.1)'}}>
          <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.2" opacity=".5"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>
        </button>}
        {/* Zoom hint overlay */}
        <button onClick={()=>avatarRef.current?.click()} style={{position:'absolute',bottom:4,right:4,width:28,height:28,borderRadius:'50%',background:C.accent,border:'2px solid '+C.bg,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0,zIndex:2}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </button>
      </div>
      <div style={{fontSize:20,fontWeight:700,fontFamily:'var(--fd)'}}>{name}</div>
      <div style={{fontSize:13,color:C.muted}}>{isDoc?'Специалист':'Клиент'}</div>
    </div>

    <div style={{background:C.surface,borderRadius:20,padding:20,boxShadow:C.shadowCard}}>
      {inp('Имя и фамилия',name,setName)}
      <div style={{display:'flex',gap:10}}>
        <div style={{flex:1}}>{inp('Возраст',age,setAge)}</div>
        <div style={{flex:1}}>
          <Lbl>Пол</Lbl>
          <div style={{display:'flex',gap:6}}>
            {['Мужской','Женский'].map(g=><button key={g} onClick={()=>setGender(g)} style={{flex:1,padding:'12px',borderRadius:14,border:`1.5px solid ${gender===g?C.accent:C.tileBorder}`,background:gender===g?C.accentSoft:C.surface,color:gender===g?C.accent:C.soft,fontSize:14,fontWeight:gender===g?600:400,cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>{g}</button>)}
          </div>
        </div>
      </div>
      {inp('Email',email,setEmail)}
      <div style={{marginBottom:16}}>
        <Lbl>Телефон</Lbl>
        <input value={phone} onChange={e=>{let v=e.target.value.replace(/\D/g,'');if(v.startsWith('8'))v='7'+v.slice(1);if(v.length>11)v=v.slice(0,11);let f='';if(v.length>0)f='+'+v[0];if(v.length>1)f+=' ('+v.slice(1,4);if(v.length>4)f+=') '+v.slice(4,7);if(v.length>7)f+='-'+v.slice(7,9);if(v.length>9)f+='-'+v.slice(9,11);setPhone(f)}} placeholder="+7 (999) 123-45-67" type="tel" style={{width:'100%',padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:C.surface,color:C.text}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.tileBorder}/>
      </div>
      <div style={{display:'flex',gap:10}}>
        <div style={{flex:1}}>{inp('Рост, см',height,setHeight)}</div>
        <div style={{flex:1}}>{inp('Вес, кг',weight,setWeight)}</div>
      </div>
      <div style={{marginBottom:16}}>
        <Lbl>Дневная норма воды, мл</Lbl>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input value={wn} onChange={e=>setWn(e.target.value)} type="number" style={{flex:1,padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:C.surface,color:C.text}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>{e.target.style.borderColor=C.tileBorder;const v=parseInt(wn);if(v>0)onWaterNormChange(v)}}/>
          <span style={{fontSize:13,color:C.muted,whiteSpace:'nowrap'}}>мл / день</span>
        </div>
      </div>
      {!isDoc&&<>{inp('Основной запрос',request,setRequest)}</>}
      <button onClick={saveProfile} style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:saved?C.accentSoft:C.accent,color:saved?C.accent:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit',marginTop:4,transition:'all .3s',boxShadow:saved?'none':'0 2px 8px rgba(45,95,63,.2)'}}>
        {saved?'Сохранено ✓':'Сохранить'}
      </button>
    </div>

    {/* Analytics entry */}

    {/* Support - collapsible */}
    <div style={{background:C.surface,borderRadius:20,boxShadow:C.shadowCard,marginTop:12,overflow:'hidden'}}>
      <button onClick={()=>setShowSupport(!showSupport)} style={{width:'100%',padding:'14px',borderRadius:showSupport?'20px 20px 0 0':20,border:`1.5px solid ${C.tileBorder}`,background:C.surface,color:C.text,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .15s'}}
        onMouseOver={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent}}
        onMouseOut={e=>{e.currentTarget.style.borderColor=C.tileBorder;e.currentTarget.style.color=C.text}}>
        {I.support} Поддержка
      </button>
      {showSupport&&<div style={{padding:'0 20px 20px',borderTop:`1px solid ${C.surfaceAlt}`,animation:'enter .2s'}}>
        <p style={{fontSize:12,color:C.muted,marginBottom:12,marginTop:12}}>Опишите проблему — мы ответим на вашу почту</p>
        {supportSent&&<div style={{padding:'14px 16px',borderRadius:12,background:C.accentSoft,marginBottom:12,display:'flex',alignItems:'center',gap:10,animation:'enter .3s'}}>
          <span style={{fontSize:20}}>✅</span>
          <div><div style={{fontSize:14,fontWeight:600,color:C.accent}}>Сообщение отправлено!</div><div style={{fontSize:12,color:C.soft,marginTop:2}}>Мы ответим на вашу почту</div></div>
        </div>}
        <textarea value={supportText} onChange={e=>setSupportText(e.target.value)} placeholder="Опишите проблему или задайте вопрос..." rows={3}
          style={{width:'100%',padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',resize:'vertical',outline:'none',boxSizing:'border-box',background:C.surface,lineHeight:1.6,marginBottom:10}}
          onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.tileBorder}/>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
          <input ref={supportFileRef} type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)setSupportFile(f);e.target.value=''}} style={{display:'none'}}/>
          <button onClick={()=>supportFileRef.current?.click()} style={{padding:'8px 14px',borderRadius:10,border:`1.5px solid ${C.tileBorder}`,background:C.surface,cursor:'pointer',fontSize:12,color:C.soft,fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            {supportFile?supportFile.name:'Прикрепить скриншот'}
          </button>
          {supportFile&&<button onClick={()=>setSupportFile(null)} style={{background:'none',border:'none',cursor:'pointer',color:C.danger,fontSize:12}}>✕</button>}
        </div>
        <button disabled={supportLoading||!supportText.trim()} onClick={handleSendSupport} style={{width:'100%',padding:'12px',borderRadius:14,border:'none',background:supportSent?C.accentSoft:supportText.trim()?C.accent:'#ccc',color:supportSent?C.accent:'#fff',fontSize:14,fontWeight:600,cursor:supportText.trim()?'pointer':'default',fontFamily:'inherit',transition:'all .3s'}}>
          {supportSent?'Отправлено ✓':supportLoading?'Отправляю...':'Отправить'}
        </button>
      </div>}
    </div>

    <button onClick={onLogout} style={{width:'100%',marginTop:16,marginBottom:40,padding:'16px',borderRadius:14,border:'none',background:C.dangerSoft,color:C.danger,fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,WebkitTapHighlightColor:'transparent'}}>{I.logout} Выйти из аккаунта</button>
  </div>;
}

// ═══ CELEBRATION ═══
const PHRASES = {
  general: [
    'Молодец, продолжай! 🌿','Ты справляешься — и это видно','Так держать!','Сегодня ты снова здесь. Это важно','Ты умница, правда','Всё получится — ты уже на пути','Маленький шаг, но он твой 💪','Ты делаешь это. День за днём.','Гордись собой — ты заслуживаешь','Сегодня хорошо. Завтра ещё лучше','Ты не останавливаешься — это главное','Продолжай, ты близко 🎯','Ты держишь слово себе — это сила','Уже лучше, чем вчера','Ты молодец. Без лишних слов.','Серия продолжается 🔥','Ещё один день — ещё один шаг вперёд','Ты не сдался. Respect 🤍','Смотри, как далеко ты уже прошёл','Цель ближе, чем кажется','Ты делаешь то, о чём многие только думают','Сегодня зачтено ✅','Ты возвращаешься снова — это и есть дисциплина','Всё идёт как надо','Не идеально — но по-настоящему','Ты выбрал себя сегодня. Снова.','Стабильность — твоя суперсила','Маленькое да себе каждый день — это много','Ты в движении — значит, всё правильно','Результат накапливается — даже когда не видно','Ты не ищешь повод — ты просто делаешь','Хорошая работа 👏','Ты справляешься лучше, чем думаешь','Один шаг сегодня — большой путь впереди','Ты здесь. Ты делаешь. Этого достаточно.','Привычка растёт — не останавливайся','Ты строишь что-то важное','Доверяй процессу — он работает','Сегодня ты снова выбрал действие','Пауза — тоже часть пути','Ты умеешь восстанавливаться — это ценно','Дыши. Ты справляешься 🌬️','Сегодня ты был добр к себе','Отдых — тоже результат','Спокойствие — это тоже работа над собой','Ты нашёл время для себя — и это не мелочь','Забота о себе — это сила, не слабость','Ты слышишь себя — это редкий навык','Сегодня ты на своей стороне 🤍','Тихая работа над собой — самая настоящая','Ты меняешься — просто не всегда это видно снаружи','Каждый день — кирпичик в фундаменте','Не совершенство, а постоянство меняет жизнь','Ты не срываешься — ты учишься','Результат — это сумма маленьких ежедневных да','Позаботься о себе сейчас — будущее скажет спасибо','Лучшее вложение — в себя','Жизнь в балансе начинается с одного дня','Ты не ищешь мотивацию — ты строишь привычку','Осознанность — твоё главное преимущество','Ты не идеален — ты реален. И это лучше','Ты живёшь так, как решил. Это редкость.','Каждый выбор в пользу себя считается','Ты уже делаешь — остальное придёт','Сила не в порыве — в ежедневном выборе','Ты не ждёшь подходящего момента — ты его создаёшь','Твоя последовательность говорит сама за себя','Сегодня сделано — завтра легче','Небольшой шаг сегодня — большой путь завтра','Ты строишь жизнь, которую хочешь 🌿','Живи легче, действуй осознаннее','Ты доверяешь себе. И не зря.','Цель видна — иди своим темпом','Ты в процессе — и это уже результат','Каждый день лучше, чем вчера 🌱','Ты справился сегодня. Так и держи.','Ты молодец — просто молодец 🙌','Ещё один день в твою пользу','Смотри вперёд — ты на верном пути','Один день зачтён — серия растёт 🔥','Осознанность — это сила','Сегодня ты снова здесь. Хорошо.','Ты выбрал действие вместо откладывания','Маленькое усилие сегодня — большая разница потом','Ты идёшь своим путём. Не останавливайся.','Всё, что ты делаешь для себя — считается','Ты не один на этом пути 🤍','Сегодня ты снова выбрал себя. Молодец.','Ты меняешь жизнь тихо, но уверенно','Результат не ждёт — он накапливается','Ты здесь — и это уже победа','Продолжай. Просто продолжай. 🌿','Хорошая работа, серьёзно','Ты делаешь это не напоказ — для себя. Это ценно.','Ещё один шаг — ещё одна версия себя лучше','Ты держишься — и это считается','Сегодня ты снова сделал выбор в свою пользу','Eat · Live · Love — это про тебя 🌿',
  ],
  water: [
    'Вода выпита — тело говорит спасибо 💧','Норма воды закрыта. Отлично!','Ты помнишь о воде — это уже привычка','Hydrated = заряжен. Так держать!','Маленький стакан, большая забота о себе','Вода сделана — ты молодец 💙','Ты слышишь своё тело. Оно просило воды — ты дал.','Норма есть. Продолжай в том же духе!','Каждый стакан считается','Сегодня ты позаботился о себе. Это видно.','Вода — это просто. И ты справился.','Стакан за стаканом — и норма закрыта 💧','Ты не забыл о воде сегодня. Молодец!','Тело работает лучше, когда ты о нём помнишь','Вода выпита — день идёт правильно','Ты заботишься о себе в мелочах. Это важно.','Норма воды — галочка стоит ✅','Сегодня ты был внимателен к себе','Маленькая привычка, большой результат','Ты держишь ритм — и это заметно','Вода сделана. Продолжай в том же духе!','Ты помнишь о себе даже в busy день — это ценно','Каждый стакан — шаг к лучшему самочувствию','Привычка пить воду растёт. Не останавливайся!','Тело скажет спасибо — обязательно','Ты снова здесь. И снова молодец 💧','Маленькое да себе — каждый день','Вода выпита — ты на своей стороне','Не идеально, но по-настоящему. Так держать!','Сегодня зачтено. Завтра продолжаем 💙',
  ],
  sleep: [
    'Ты выспался — это уже победа 😴','Хороший сон = заряженный день. Молодец!','Отдых — тоже часть результата','Ты дал себе восстановиться. Это важно.','Сон в норме — энергия есть. Отлично!','Ты умеешь восстанавливаться — это ценно','Забота о себе начинается с ночи 🌙','Сегодня ты был добр к себе','Пауза — тоже часть пути','Ты слышишь себя — это редкий навык','Хороший отдых — это не лень, это мудрость','Ты зарядился. Теперь вперёд! 💪','Сон соблюдён — ты держишь режим','Восстановление засчитано ✅','Ты позволил себе отдохнуть. Правильно.','Тело восстановилось — день пройдёт лучше','Ты заботишься о голове так же, как о теле','Спокойствие — тоже работа над собой','Норма сна закрыта. Отличная работа!','Ты слышишь, что нужно телу — это сила','Отдых — не награда, а необходимость. И ты это знаешь.','Ты проснулся в ресурсе. Это твоя заслуга.','Сон в порядке — значит, всё идёт как надо 🌙','Ты держишь баланс. Это видно.','Маленькая забота о себе каждую ночь — большой результат','Режим соблюдён — ты молодец','Ты инвестируешь в себя даже во сне','Хороший отдых — лучший старт нового дня','Ты восстановился. Продолжай в том же духе!','Сегодня ты снова на своей стороне 🤍',
  ],
  goal: [
    'День засчитан! Серия продолжается 🔥','Ещё один день — ещё один шаг вперёд','Ты держишь слово себе — это сила','Привычка растёт — не останавливайся','Стабильность важнее идеальности','Ты не сдался. Respect 🤍','Смотри, как далеко ты уже прошёл','Один день зачтён — серия растёт 🔥','Ты возвращаешься снова — это и есть дисциплина','Сила не в порыве — в ежедневном выборе','Ты делаешь то, о чём многие только думают','Результат накапливается — даже когда не видно','Не совершенство, а постоянство меняет жизнь','Ты строишь что-то важное','Каждый день — кирпичик в фундаменте 🧱','Цель дня закрыта. Молодец!','Ты ставишь цель и достигаешь. Это не мелочь.','Сегодня сделано — завтра легче','Ты не ищешь повод — ты просто делаешь','Каждый выполненный день — маленькая победа','Ты идёшь своим путём. Не останавливайся.','Цель ближе, чем кажется 🎯','Ты выбрал действие вместо откладывания','Твоя последовательность говорит сама за себя','Ты не ждёшь подходящего момента — ты его создаёшь','Результат — это сумма маленьких ежедневных да','Ты строишь жизнь, которую хочешь 🌿','Сегодня ты снова выбрал себя','Ты в движении — а значит, всё правильно','Продолжай. Просто продолжай. 🌿',
  ],
  meal: [
    'Записано — значит, ты в осознанности 🎯','Ты замечаешь, что ешь. Это уже многое.','Каждая запись приближает тебя к цели','Ты следишь за собой — значит, растёшь','Не идеально, а с вниманием — это и есть здорово','Приём пищи записан. Отличная работа!','Ты делаешь это для себя — и это чувствуется','Осознанность в питании — это сила','Маленький шаг, но он твой 💪','Сегодня ты снова на правильном пути 🌿','Запись сделана — день идёт как надо','Ты не на автопилоте — ты осознаёшь. Это важно.','Приём пищи под контролем. Молодец!','Ты строишь привычку, которая останется навсегда','Каждый записанный приём — шаг к пониманию себя','Ты внимателен к себе. Это ценно.','Записано — значит, не потеряно ✅','Ты помнишь о себе в течение дня. Отлично!','Маленькое действие, большой смысл','Ты замечаешь — и это уже половина результата','Питание под вниманием — тело скажет спасибо','Ты не забываешь о себе. Это видно.','Запись сделана — ты в своём ритме 🌿','Сегодня ты снова внимателен к себе','Ты отслеживаешь — значит, управляешь','Осознанность начинается с маленьких записей','Ты здесь, ты замечаешь, ты молодец','Каждый день в трекере — это разговор с собой','Ты не идеален — ты реален. И это лучше.','Eat · Live · Love — это про тебя 🌿',
  ],
};
const pickPhrase = (type) => {
  const pool = PHRASES[type] || PHRASES.general;
  return pool[Math.floor(Math.random() * pool.length)];
};

function Celebration({type,onClose}){
  const phrase = useState(() => pickPhrase(type))[0];
  const colors=['#4CAF50','#8BC34A','#CDDC39','#FFC107','#FF9800','#00BCD4','#2196F3','#E91E63'];
  const titles = { water:'Норма воды выполнена!', sleep:'Отличный сон!', goal:'Цель выполнена!', meal:'Приём пищи записан!' };
  const icons = { water:'💧', sleep:'🌙', goal:'🎯', meal:'🍽️' };
  return <div style={{position:'fixed',inset:0,zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn .3s',pointerEvents:'auto'}}>
    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.4)',backdropFilter:'blur(8px)'}}/>
    {/* Confetti */}
    {Array.from({length:40}).map((_,i) => <div key={i} style={{
      position:'absolute',top:-20,left:`${Math.random()*100}%`,
      width:8+Math.random()*8,height:8+Math.random()*8,
      borderRadius:Math.random()>.5?'50%':'2px',
      background:colors[Math.floor(Math.random()*colors.length)],
      animation:`confetti ${2+Math.random()*3}s ease-in ${Math.random()*1}s forwards`,
      transform:`rotate(${Math.random()*360}deg)`,
    }}/>)}
    {/* Card */}
    <div style={{position:'relative',background:C.surface,borderRadius:28,padding:'40px 32px 28px',textAlign:'center',maxWidth:320,boxShadow:'0 20px 60px rgba(0,0,0,.2)',animation:'bounceIn .5s cubic-bezier(.34,1.56,.64,1)'}}>
      <div style={{fontSize:56,marginBottom:12,animation:'celebrate .6s ease .2s both'}}>{icons[type]||'🌿'}</div>
      <div style={{fontSize:22,fontWeight:700,fontFamily:'var(--fd)',marginBottom:8,animation:'celebrate .6s ease .3s both'}}>{titles[type]||'Молодец!'}</div>
      <div style={{fontSize:14,color:C.soft,lineHeight:1.6,marginBottom:20,animation:'celebrate .6s ease .4s both'}}>{phrase}</div>
      <button onClick={onClose} style={{padding:'12px 40px',borderRadius:14,border:'none',background:C.accent,color:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 2px 8px rgba(45,95,63,.25)',animation:'celebrate .6s ease .5s both'}}>Ок</button>
      {/* Sparkles */}
      {[{t:40,l:20,d:0},{t:30,l:80,d:.2},{t:70,l:15,d:.4},{t:65,l:85,d:.1}].map((s,i) => <div key={i} style={{
        position:'absolute',top:`${s.t}%`,left:`${s.l}%`,width:12,height:12,
        background:C.accent,borderRadius:'50%',opacity:0,
        animation:`sparkle 1s ease ${s.d+.5}s infinite`,
      }}/>)}
    </div>
  </div>;
}

// ═══ WEEKLY GOAL WIDGET ═══
const GOAL_PRESETS=[{d:7,l:'неделя'},{d:14,l:'2 недели'},{d:21,l:'привычка'},{d:30,l:'месяц'},{d:45,l:'1,5 мес'},{d:90,l:'квартал'},{d:180,l:'полгода'},{d:365,l:'год'}];
const GOAL_HINTS={7:'7 дней — хороший старт',14:'14 дней — закрепление',21:'21 день — порог привычки',30:'30 дней — месяц дисциплины',45:'45 дней — устойчивая привычка',90:'90 дней — новый образ жизни',180:'Полгода — серьёзный результат',365:'365 дней — год новой себя'};
const GOAL_MSGS=[
  null,
  {t:'Отмечено!',s:'Первый шаг сделан'},
  {t:'2 дня!',s:'Продолжай в том же духе'},
  {t:'3 дня!',s:'Привычка формируется'},
  {t:'4 дня подряд!',s:'Ты на верном пути'},
  {t:'5 дней!',s:'Невероятно!'},
  {t:'6 дней!',s:'Один шаг до победы'},
  {t:'Вся неделя!',s:'Это уже привычка! 🎉'},
];

function WeeklyGoalWidget({goal,goalDays,goalStarted,goalSetBy,daysDone,onToggleDay}){
  const[open,setOpen]=useState(false);
  const[viewMonth,setViewMonth]=useState(()=>new Date());
  if(!goal)return null;

  const startDate=goalStarted?new Date(goalStarted):new Date();
  startDate.setHours(0,0,0,0);
  const totalDays=goalDays||7;
  const endDate=new Date(startDate);endDate.setDate(endDate.getDate()+totalDays-1);endDate.setHours(0,0,0,0);
  const today=new Date();today.setHours(0,0,0,0);

  // Count done
  const totalDone=daysDone?Object.values(daysDone).filter(Boolean).length:0;

  // Streak
  let streak=0;
  const sd=new Date(today);
  for(let i=0;i<totalDays;i++){
    const ds=dk(sd);
    if(daysDone?.[ds])streak++;
    else if(sd.getTime()!==today.getTime())break;
    sd.setDate(sd.getDate()-1);
  }

  // Motivation
  let mot=null;
  if(totalDone>=totalDays)mot='Все дни выполнены! 🎉';
  else if(streak>=7)mot=streak+' дней подряд! 🔥';
  else if(streak>=3)mot=streak+' дня подряд! ⭐';

  // Calendar for viewMonth
  const vm=viewMonth;
  const year=vm.getFullYear(),month=vm.getMonth();
  const firstDay=new Date(year,month,1);
  let startWeekDay=firstDay.getDay()-1;if(startWeekDay<0)startWeekDay=6;// Mon=0
  const daysInMonth=new Date(year,month+1,0).getDate();
  const weekDays=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  const cells=[];
  for(let i=0;i<startWeekDay;i++)cells.push(null);
  for(let d=1;d<=daysInMonth;d++){
    const dt=new Date(year,month,d);dt.setHours(0,0,0,0);
    const dateStr=dk(dt);
    const inRange=dt>=startDate&&dt<=endDate;
    const isPast=dt<today;
    const isToday=dt.getTime()===today.getTime();
    const isFuture=dt>today;
    const done=daysDone?.[dateStr]||false;
    cells.push({day:d,date:dt,dateStr,inRange,isPast,isToday,isFuture,done});
  }

  const prevMonth=()=>setViewMonth(new Date(year,month-1,1));
  const nextMonth=()=>setViewMonth(new Date(year,month+1,1));

  return <div style={{background:'#2A4A2A',borderRadius:16,marginBottom:14,overflow:'hidden',animation:'enter .4s ease'}}>
    {/* Header */}
    <button onClick={()=>setOpen(!open)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:'none',border:'none',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
      <div style={{width:8,height:8,borderRadius:4,background:'#fff',animation:'pulse 3s infinite',flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:9,letterSpacing:1,color:'#7AAA7A',textTransform:'uppercase',marginBottom:2}}>Задача{totalDays>7?' на '+totalDays+' дн.':' недели'}</div>
        <div style={{fontSize:14,color:'#F5F2EC',fontStyle:'italic',fontFamily:'var(--fd)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{goal}</div>
      </div>
      <div style={{fontSize:11,color:'#7AAA7A',flexShrink:0,fontWeight:600}}>{totalDone}/{totalDays}</div>
      <div style={{width:22,height:22,borderRadius:11,border:'1px solid rgba(255,255,255,.2)',background:'rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'center',transition:'transform .25s',transform:open?'rotate(180deg)':'rotate(0)',flexShrink:0}}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#f5f2ec" strokeWidth="1.5"><path d="M2 3.5L5 6.5L8 3.5"/></svg>
      </div>
    </button>

    {/* Expanded — mini calendar */}
    {open&&<div style={{padding:'0 14px 14px',borderTop:'1px solid rgba(255,255,255,.1)',animation:'enter .2s ease'}}>
      {/* Month navigation */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'10px 0 8px'}}>
        <button onClick={prevMonth} style={{background:'none',border:'none',color:'#7AAA7A',cursor:'pointer',fontSize:16,padding:4}}>‹</button>
        <div style={{fontSize:13,fontWeight:700,color:'#F5F2EC',fontFamily:'var(--fd)',letterSpacing:'.03em'}}>{MO[month]} {year}</div>
        <button onClick={nextMonth} style={{background:'none',border:'none',color:'#7AAA7A',cursor:'pointer',fontSize:16,padding:4}}>›</button>
      </div>
      {/* Weekday headers */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>
        {weekDays.map(w=><div key={w} style={{textAlign:'center',fontSize:9,color:'#7AAA7A',fontWeight:600}}>{w}</div>)}
      </div>
      {/* Day cells */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
        {cells.map((c,i)=>{
          if(!c)return <div key={'e'+i}/>;
          const canTap=c.inRange&&!c.isFuture;
          const bg=c.done?'#F5F2EC':c.isToday&&c.inRange?'rgba(122,170,122,.3)':'transparent';
          const color=c.done?'#2A4A2A':c.inRange?(c.isFuture?'rgba(255,255,255,.25)':'#F5F2EC'):'rgba(255,255,255,.15)';
          return <button key={c.dateStr} onClick={canTap?()=>onToggleDay&&onToggleDay(c.dateStr,!c.done):undefined}
            style={{width:'100%',aspectRatio:'1',borderRadius:'50%',background:bg,border:c.isToday&&c.inRange?'1.5px solid #7AAA7A':'1.5px solid transparent',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:canTap?'pointer':'default',padding:0,fontFamily:'inherit',transition:'all .15s'}}>
            {c.done?<svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="#2A4A2A" strokeWidth="2" strokeLinecap="round"><path d="M2.5 6L5 8.5L9.5 3.5"/></svg>
            :c.inRange&&c.isPast&&!c.done?<svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round"><path d="M3 3L9 9M9 3L3 9"/></svg>
            :<span style={{fontSize:11,fontWeight:c.isToday?700:400,color}}>{c.day}</span>}
          </button>;
        })}
      </div>
      {/* Motivation */}
      {mot&&<div style={{textAlign:'center',fontSize:12,color:'#7AAA7A',marginTop:8,fontWeight:600}}>{mot}</div>}
      {goalSetBy&&<div style={{fontSize:9,color:'rgba(255,255,255,.3)',marginTop:4,textAlign:'center'}}>назначено нутрициологом</div>}
    </div>}
  </div>;
}

// Goal assigner for nutritionist in client view
function DocGoalAssigner({clientId,docId,currentGoal,currentDays}){
  const[open,setOpen]=useState(false);
  const[text,setText]=useState(currentGoal||'');
  const[days,setDays]=useState(currentDays||7);
  const[saved,setSaved]=useState(false);

  const save=async()=>{
    if(!supabase||!clientId||!text.trim())return;
    try{
      const{error}=await supabase.from('profiles').update({
        weekly_goal:text.trim(),
        weekly_goal_days:days,
        weekly_goal_set_by:docId||null,
        weekly_goal_started_at:new Date().toISOString(),
      }).eq('id',clientId);
      if(error){console.error('save goal error:',error);return;}
      setSaved(true);
      setTimeout(()=>setSaved(false),2000);
    }catch(e){console.error('save goal:',e)}
  };

  return <div style={{background:C.surface,borderRadius:18,boxShadow:C.shadowCard,marginBottom:14,overflow:'hidden'}}>
    <button onClick={()=>setOpen(!open)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'14px 16px',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
      <div style={{width:32,height:32,borderRadius:10,background:C.accentSoft,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>🎯</div>
      <div style={{flex:1,textAlign:'left'}}>
        <div style={{fontSize:14,fontWeight:600,color:C.text}}>Задача</div>
        <div style={{fontSize:12,color:currentGoal?C.soft:C.muted,marginTop:1}}>{currentGoal||'Не задана'}</div>
      </div>
      <div style={{transform:open?'rotate(180deg)':'rotate(0)',transition:'transform .25s',color:C.muted,display:'flex'}}>
        <svg width="14" height="14" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3.5L5 6.5L8 3.5"/></svg>
      </div>
    </button>
    {open&&<div style={{padding:'0 16px 16px',borderTop:`1px solid ${C.surfaceAlt}`,animation:'enter .2s ease'}}>
      <div style={{marginTop:12}}>
        <Lbl>Текст задачи</Lbl>
        <Area value={text} onChange={setText} placeholder="Добавляй овощи в каждый приём пищи..." rows={2} showMic/>
      </div>
      <div style={{marginTop:12}}>
        <Lbl>Количество дней</Lbl>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginBottom:8}}>
          <button onClick={()=>setDays(Math.max(1,days-1))} style={{width:34,height:34,borderRadius:'50%',border:`1.5px solid ${C.tileBorder}`,background:C.surface,cursor:'pointer',fontSize:18,fontWeight:600,color:C.accent,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
          <div style={{minWidth:60,textAlign:'center'}}><span style={{fontSize:22,fontWeight:700,fontFamily:'var(--fd)',color:C.accent}}>{days}</span><span style={{fontSize:11,color:C.muted,marginLeft:4}}>дн.</span></div>
          <button onClick={()=>setDays(Math.min(365,days+1))} style={{width:34,height:34,borderRadius:'50%',border:`1.5px solid ${C.tileBorder}`,background:C.surface,cursor:'pointer',fontSize:18,fontWeight:600,color:C.accent,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4}}>
          {GOAL_PRESETS.map(p=><button key={p.d} onClick={()=>setDays(p.d)} style={{padding:'6px 4px',borderRadius:10,border:`1.5px solid ${days===p.d?C.accent:C.tileBorder}`,background:days===p.d?C.accentSoft:C.surface,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:days===p.d?600:400,color:days===p.d?C.accent:C.soft,transition:'all .15s'}}>
            <div>{p.d}</div><div style={{fontSize:9,color:days===p.d?C.accent:C.muted}}>{p.l}</div>
          </button>)}
        </div>
        <div style={{fontSize:11,color:C.muted,marginTop:6,textAlign:'center',fontStyle:'italic'}}>{GOAL_HINTS[days]||days+' дней'}</div>
      </div>
      <button onClick={save} style={{width:'100%',marginTop:14,padding:'12px',borderRadius:14,border:'none',background:saved?C.accentSoft:C.accent,color:saved?C.accent:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all .2s'}}>
        {saved?'Сохранено! ✓':'Назначить клиенту →'}
      </button>
    </div>}
  </div>;
}

// ═══ LOGIN ═══
const EMOJIS=['👍','❤️','🔥','👏','😊','🥗','💪','✅','⭐','🙏','😄','🎉'];

// Loads notifications for the current user from doc_comments table.
// Isolated component with its own lifecycle — uses useEffect([]) to avoid infinite loops.
function NotificationsPanel({ userId, userRole, onClose, onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  // Load once on mount + realtime subscription
  useEffect(() => {
    if (!supabase || !userId) return;
    let mounted = true;
    const filterCol = userRole === 'doc' ? 'doc_id' : 'client_id';

    (async () => {
      try {
        // Exclude the user's own items — notifications should only show activity
        // from the other party (likes, news, and incoming messages).
        const { data } = await supabase.from('doc_comments')
          .select('*')
          .eq(filterCol, userId)
          .neq('sender_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);
        if (mounted && data) setItems(data);
      } catch (e) { console.error('load notifications:', e); }
      if (mounted) setLoading(false);
    })();

    // Realtime: listen for new inserts where we are the recipient.
    // Skip inserts we authored ourselves.
    const channel = supabase.channel('notif_' + userId + '_' + Date.now())
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'doc_comments', filter: `${filterCol}=eq.${userId}` },
        (payload) => {
          if (!mounted) return;
          if (payload.new?.sender_id === userId) return;
          setItems(prev => [payload.new, ...prev].slice(0, 100));
        })
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'doc_comments', filter: `${filterCol}=eq.${userId}` },
        (payload) => {
          if (!mounted) return;
          setItems(prev => prev.filter(x => x.id !== payload.old.id));
        })
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(channel); } catch (e) {}
    };
  }, []); // eslint-disable-line

  const markAllRead = async () => {
    if (!supabase || !userId) return;
    const unread = items.filter(x => !x.read && x.sender_id !== userId);
    if (unread.length === 0) return;
    try {
      await supabase.from('doc_comments')
        .update({ read: true })
        .in('id', unread.map(x => x.id));
      setItems(prev => prev.map(x => (!x.read && x.sender_id !== userId) ? { ...x, read: true } : x));
    } catch (e) { console.error('markAllRead:', e); }
  };

  const handleClick = async (item) => {
    // Mark single item as read
    if (!item.read && item.sender_id !== userId && supabase) {
      try { await supabase.from('doc_comments').update({ read: true }).eq('id', item.id); } catch (e) {}
      setItems(prev => prev.map(x => x.id === item.id ? { ...x, read: true } : x));
    }
    // Navigate to that day/meal
    onNavigate && onNavigate(item);
    onClose && onClose();
  };

  const mealLabel = (mealType) => {
    const m = MEALS.find(x => x.id === mealType);
    return m ? m.label : mealType;
  };

  const fmtDate = (dateStr, ts) => {
    try {
      const d = ts ? new Date(ts) : new Date(dateStr);
      return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return dateStr; }
  };

  return <div style={{position:'fixed',inset:0,zIndex:999,animation:'fadeIn .15s'}}>
    <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.2)'}}/>
    <div style={{position:'absolute',top:0,right:0,bottom:0,width:'min(420px,94vw)',background:C.bg,boxShadow:C.shadowHover,overflowY:'auto',animation:'slideRight .25s',padding:24,display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <span style={{fontSize:20,fontWeight:700,fontFamily:'var(--fd)'}}>Уведомления</span>
        <div style={{display:'flex',gap:6}}>
          {items.some(x => !x.read && x.sender_id !== userId) && <button onClick={markAllRead} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:C.accent,fontFamily:'inherit',padding:'4px 8px'}}>Прочитать все</button>}
          <IcoBtn icon={I.x} onClick={onClose}/>
        </div>
      </div>
      {loading && <p style={{color:C.muted,textAlign:'center',padding:40}}>Загрузка...</p>}
      {!loading && items.length === 0 && <p style={{color:C.muted,textAlign:'center',padding:40}}>Нет уведомлений</p>}
      {!loading && items.map(item => {
        const isMine = item.sender_id === userId;
        const isLike = item.kind === 'like';
        return <div key={item.id} onClick={() => handleClick(item)} style={{
          padding: 14,
          borderRadius: 14,
          background: (isMine || item.read) ? C.surface : C.accentSoft,
          boxShadow: (isMine || item.read) ? 'none' : C.shadowCard,
          marginBottom: 8,
          cursor: 'pointer',
          border: `1px solid ${(isMine || item.read) ? C.surfaceAlt : 'transparent'}`,
          opacity: isMine ? 0.75 : 1,
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            {isLike && <span style={{fontSize:18}}>❤️</span>}
            <div style={{fontSize:12,fontWeight:600,color:C.accent,flex:1}}>{item.sender_name || (isMine ? 'Вы' : '—')}</div>
            <div style={{fontSize:11,color:C.muted}}>{fmtDate(item.date, item.created_at)}</div>
          </div>
          {isLike ? (
            <div style={{fontSize:13,color:C.text}}>
              Понравился приём пищи: <strong>{mealLabel(item.meal_type)}</strong>
            </div>
          ) : (
            <div style={{fontSize:13,color:C.text,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{item.text}</div>
          )}
          <div style={{fontSize:11,color:C.accent,fontWeight:600,marginTop:6}}>Перейти →</div>
        </div>;
      })}
    </div>
  </div>;
}

// ═══ CHAT: helpers ═══

const REACTION_SET = ['❤️','🔥','👏','😊','💪','✅'];

const fmtDateTag = (dateKey) => {
  // "2026-04-12" → "12 апреля"
  if (!dateKey) return '';
  const parts = dateKey.split('-');
  if (parts.length < 3) return dateKey;
  const d = parseInt(parts[2], 10);
  const m = parseInt(parts[1], 10) - 1;
  if (isNaN(d) || isNaN(m) || !MO_R[m]) return dateKey;
  return d + ' ' + MO_R[m];
};

const fmtChatTime = (iso) => {
  try { return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }); }
  catch(e) { return ''; }
};

// Day-chat feedback block with three states:
//  1. No messages yet → CTA to start the conversation
//  2. Exactly one message → show it with a "reply" button
//  3. Two or more messages → show count with "open chat" button
// Props: clientId, docId (optional), currentUserId, dateKey, role ('doc'|'client'), clientName, onOpenChat
function DayChatPreview({ clientId, docId, currentUserId, dateKey, role, clientName, onOpenChat }) {
  const [dayMessages, setDayMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDocId, setActiveDocId] = useState(docId || null);

  // Resolve the active (most recent) doc for this client if not passed.
  useEffect(() => {
    if (activeDocId || !supabase || !clientId) return;
    let mounted = true;
    supabase.from('doc_clients')
      .select('doc_id,created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data?.doc_id) setActiveDocId(data.doc_id);
      });
    return () => { mounted = false; };
  }, [clientId, activeDocId]);

  useEffect(() => {
    if (!supabase || !clientId || !dateKey) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        let q = supabase.from('doc_comments')
          .select('id,doc_id,sender_id,sender_name,text,date,created_at,kind')
          .eq('client_id', clientId)
          .eq('date', dateKey)
          .eq('kind', 'comment');
        if (activeDocId) q = q.eq('doc_id', activeDocId);
        const { data } = await q.order('created_at', { ascending: true });
        if (mounted) {
          setDayMessages(data || []);
          setLoading(false);
        }
      } catch (e) { if (mounted) setLoading(false); }
    })();

    // Listen to new messages for this day to refresh the preview
    const filter = activeDocId ? `doc_id=eq.${activeDocId}` : `client_id=eq.${clientId}`;
    const channel = supabase.channel('day_preview_' + clientId + '_' + (activeDocId||'?') + '_' + dateKey + '_' + Date.now())
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'doc_comments', filter },
        (payload) => {
          if (!mounted) return;
          const m = payload.new;
          if (m.date !== dateKey || m.kind !== 'comment') return;
          if (m.client_id !== clientId) return;
          if (activeDocId && m.doc_id !== activeDocId) return;
          setDayMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
        })
      .subscribe();

    return () => { mounted = false; try { supabase.removeChannel(channel); } catch(e){} };
  }, [clientId, dateKey, activeDocId]); // eslint-disable-line

  const count = dayMessages.length;
  const single = count === 1 ? dayMessages[0] : null;

  // Who is the *other* party from the single message's perspective
  const singleFromOther = single && single.sender_id !== currentUserId;

  // State-specific copy
  let ctaText, hintText;
  if (count === 0) {
    hintText = role === 'doc'
      ? 'Хотите прокомментировать этот день?'
      : 'Есть вопрос по этому дню?';
    ctaText = role === 'doc' ? 'Написать клиенту' : 'Написать нутрициологу';
  } else if (count === 1) {
    ctaText = 'Ответить в чате';
  } else {
    ctaText = 'Перейти в чат';
  }

  const heart = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;

  // Colored dot indicator: green for doc messages (on client view),
  // amber for client messages (on doc view)
  const dotColor = role === 'client' ? '#2D5F3F' : '#E3A23C';

  return <div style={{background:C.surface,borderRadius:20,boxShadow:C.shadowCard,marginTop:16,overflow:'hidden',padding:'16px 18px'}}>
    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12,fontSize:11,fontWeight:600,color:C.muted,letterSpacing:'.06em',textTransform:'uppercase'}}>
      <span style={{display:'inline-flex',color:C.accent}}>{heart}</span>
      Обратная связь
    </div>

    {loading && <div style={{fontSize:13,color:C.muted,marginBottom:12}}>Загрузка...</div>}

    {/* State 1 — no messages */}
    {!loading && count === 0 && <div style={{fontSize:14,color:C.soft,marginBottom:14,lineHeight:1.5}}>
      «{hintText}»
    </div>}

    {/* State 2 — exactly one message */}
    {!loading && count === 1 && <div style={{background:C.accentSoft,borderRadius:14,padding:'12px 14px',marginBottom:14}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,fontSize:12,fontWeight:600,color:C.text}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:singleFromOther?dotColor:C.muted,flexShrink:0}}/>
        <span>{single.sender_name || (singleFromOther ? (role==='client'?'Нутрициолог':'Клиент') : 'Вы')}</span>
        <span style={{color:C.muted,fontWeight:400,fontSize:11}}>· {fmtChatTime(single.created_at)}</span>
      </div>
      <div style={{fontSize:14,color:C.text,lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>«{single.text}»</div>
    </div>}

    {/* State 3 — 2+ messages */}
    {!loading && count >= 2 && <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:C.accentSoft,borderRadius:14,marginBottom:14}}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      <div style={{fontSize:14,color:C.text,fontWeight:500}}>{count} {count%10===1&&count!==11?'сообщение':count%10>=2&&count%10<=4&&(count<10||count>20)?'сообщения':'сообщений'} за этот день</div>
    </div>}

    <button onClick={onOpenChat} style={{width:'100%',padding:'13px 16px',borderRadius:14,border:'none',background:C.accent,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 2px 8px rgba(45,95,63,.2)',transition:'all .2s'}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      {ctaText}
    </button>
  </div>;
}

// Full-screen chat list for the nutritionist. Shows a row per client
// with avatar, name, last message preview and unread count, sorted by
// most recent activity. Tap a row → opens ChatModal for that client.
// Props: docId, clients, unreadByClient, onOpenChat(client), onClose
function ChatListModal({ docId, clients, unreadByClient, onOpenChat, onClose }) {
  const [latestMap, setLatestMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Lock body scroll while open (same trick as ChatModal)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const scrollY = window.scrollY || 0;
    const body = document.body;
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    if (!supabase || !docId) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from('doc_comments')
          .select('id,client_id,sender_id,sender_name,text,created_at,date,attachments')
          .eq('doc_id', docId)
          .eq('kind', 'comment')
          .order('created_at', { ascending: false })
          .limit(300);
        if (!mounted) return;
        const map = {};
        (data || []).forEach(m => {
          if (!map[m.client_id]) map[m.client_id] = m;
        });
        setLatestMap(map);
        setLoading(false);
      } catch (e) { if (mounted) setLoading(false); }
    })();

    // Live-refresh on new messages
    const channel = supabase.channel('chat_list_' + docId + '_' + Date.now())
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'doc_comments', filter: `doc_id=eq.${docId}` },
        (payload) => {
          const m = payload.new;
          if (m.kind !== 'comment') return;
          setLatestMap(prev => {
            const cur = prev[m.client_id];
            if (cur && new Date(cur.created_at) >= new Date(m.created_at)) return prev;
            return Object.assign({}, prev, { [m.client_id]: m });
          });
        })
      .subscribe();

    return () => { mounted = false; try { supabase.removeChannel(channel); } catch(e){} };
  }, [docId]);

  // Sort clients by most recent message time (no messages → joined date)
  const sortedClients = [...clients].sort((a, b) => {
    const ma = latestMap[a.id];
    const mb = latestMap[b.id];
    const ta = ma ? new Date(ma.created_at).getTime() : (a.joined ? new Date(a.joined).getTime() : 0);
    const tb = mb ? new Date(mb.created_at).getTime() : (b.joined ? new Date(b.joined).getTime() : 0);
    return tb - ta;
  });

  const previewText = (m) => {
    if (!m) return '';
    if (m.text) return m.text;
    const atts = Array.isArray(m.attachments) ? m.attachments : [];
    if (atts.length > 0) return atts[0].type === 'image' ? '📷 Фото' : '📎 Файл';
    return '';
  };

  return <div style={{position:'fixed',inset:0,zIndex:10000,background:C.bg,display:'flex',flexDirection:'column',animation:'fadeIn .2s',paddingTop:'env(safe-area-inset-top)',paddingBottom:76,overflow:'hidden',overscrollBehavior:'none'}}>
    {/* Header */}
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:C.surface,boxShadow:'0 1px 0 rgba(0,0,0,.04)',flexShrink:0}}>
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:6,color:C.text,display:'flex',flexShrink:0}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:18,fontWeight:600,color:C.text,fontFamily:'var(--fd)'}}>Чаты</div>
        <div style={{fontSize:11,color:C.muted}}>{clients.length} клиент{clients.length===1?'':clients.length>=2&&clients.length<=4?'а':'ов'}</div>
      </div>
    </div>

    {/* List */}
    <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'8px 14px 20px',minHeight:0}}>
      {loading && <div style={{textAlign:'center',color:C.muted,fontSize:13,padding:'24px 0'}}>Загрузка...</div>}
      {!loading && sortedClients.length === 0 && <div style={{textAlign:'center',color:C.muted,fontSize:13,padding:'24px 0'}}>Нет клиентов</div>}
      {!loading && sortedClients.map(c => {
        const last = latestMap[c.id];
        const unread = unreadByClient[c.id] || 0;
        const lastMine = last && last.sender_id === docId;
        const preview = previewText(last);
        return <button key={c.id} onClick={() => onOpenChat(c)} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 14px',borderRadius:16,border:'none',background:C.surface,cursor:'pointer',fontFamily:'inherit',textAlign:'left',marginBottom:8,boxShadow:C.shadowCard,transition:'transform .15s'}}
          onMouseDown={e=>e.currentTarget.style.transform='scale(.98)'}
          onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
          onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
          <div style={{position:'relative',flexShrink:0}}>
            {c.photo
              ? <img src={c.photo} alt="" style={{width:48,height:48,borderRadius:'50%',objectFit:'cover',background:C.surfaceAlt}}/>
              : <div style={{width:48,height:48,borderRadius:'50%',background:C.accentSoft,color:C.accent,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,fontFamily:'var(--fd)'}}>{(c.nick||c.name||'').charAt(0).toUpperCase()}</div>
            }
            {c.isOnline && <div style={{position:'absolute',bottom:0,right:0,width:12,height:12,borderRadius:'50%',background:'#34C759',border:'2px solid '+C.surface}}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:8}}>
              <div style={{fontSize:15,fontWeight:600,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.nick||c.name}</div>
              {last && <div style={{fontSize:11,color:C.muted,flexShrink:0}}>{fmtChatTime(last.created_at)}</div>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
              <div style={{flex:1,fontSize:13,color:unread>0?C.text:C.soft,fontWeight:unread>0?500:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {last ? (lastMine?'Вы: ':'') + preview : <span style={{color:C.muted,fontStyle:'italic'}}>Нет сообщений</span>}
              </div>
              {unread > 0 && <div style={{flexShrink:0,minWidth:20,height:20,borderRadius:10,background:C.accent,color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 6px'}}>{unread}</div>}
            </div>
          </div>
        </button>;
      })}
    </div>
  </div>;
}

// Full-screen chat modal. Single thread per (doc, client) pair.
// Props: clientId, docId (nullable — resolved on demand), currentUserId, currentUserName,
//        clientName, initialTagDate, onClose, uploadAttachment(file)
function ChatModal({ clientId, docId, currentUserId, currentUserName, clientName, initialTagDate, onClose, uploadAttachment, onTagClick }) {
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [text, setText] = useState('');
  const [tagDate, setTagDate] = useState(initialTagDate || null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [resolvedDocId, setResolvedDocId] = useState(docId || null);
  const [otherParty, setOtherParty] = useState({ name: '', photo: null, lastSeen: null });
  const [photoBroken, setPhotoBroken] = useState(false);
  // "Typing" indicator state. True while the other party is typing.
  const [otherTyping, setOtherTyping] = useState(false);
  const typingChannelRef = useRef(null);
  const typingClearTimerRef = useRef(null);
  const typingLastSentRef = useRef(0);
  // iOS keyboard awareness: track keyboard height via visualViewport so
  // the modal's inner padding-bottom lifts the input above the keyboard.
  const [kbHeight, setKbHeight] = useState(0);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-grow the textarea as the user types — height follows content
  // up to a max, like Telegram's composer.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [text]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      const h = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
      setKbHeight(h);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // Lock body scroll while the chat is open so iOS doesn't scroll the
  // underlying page when the textarea is focused, and restore the exact
  // scroll position on close.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Resolve docId if not provided (client opens chat, needs to find
  // their doc). We pick the MOST RECENTLY created doc_clients link so
  // that if the client has history with both an old test account and a
  // real one, we always land on the real (most recent) nutritionist.
  useEffect(() => {
    if (resolvedDocId || !supabase || !clientId) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from('doc_clients')
          .select('doc_id,created_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (mounted && data?.doc_id) setResolvedDocId(data.doc_id);
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [clientId, resolvedDocId]);

  // Load full thread + realtime subscribe. Scope by doc_id when known
  // so old threads from a different (stale) doc account don't leak in.
  useEffect(() => {
    if (!supabase || !clientId) return;
    let mounted = true;

    (async () => {
      try {
        let q = supabase.from('doc_comments')
          .select('*')
          .eq('client_id', clientId)
          .eq('kind', 'comment');
        if (resolvedDocId) q = q.eq('doc_id', resolvedDocId);
        const { data } = await q.order('created_at', { ascending: true });
        if (mounted) { setMessages(data || []); setMessagesLoading(false); }
      } catch (e) { console.error('load chat:', e); if (mounted) setMessagesLoading(false); }
    })();

    const channelFilter = resolvedDocId
      ? `doc_id=eq.${resolvedDocId}`
      : `client_id=eq.${clientId}`;
    const channel = supabase.channel('chat_full_' + clientId + '_' + (resolvedDocId||'?') + '_' + Date.now())
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'doc_comments', filter: channelFilter },
        (payload) => {
          if (!mounted) return;
          const m = payload.new;
          if (m.kind !== 'comment') return;
          if (resolvedDocId && m.doc_id !== resolvedDocId) return;
          if (m.client_id !== clientId) return;
          setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'doc_comments', filter: channelFilter },
        (payload) => {
          if (!mounted) return;
          const m = payload.new;
          if (resolvedDocId && m.doc_id !== resolvedDocId) return;
          if (m.client_id !== clientId) return;
          setMessages(prev => prev.map(x => x.id === m.id ? Object.assign({}, x, m) : x));
        })
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(channel); } catch (e) {}
    };
  }, [clientId, resolvedDocId]); // eslint-disable-line

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Typing indicator: join a broadcast channel keyed by the pair so
  // both sides hear each other's "I'm typing" events. The other party
  // is shown as typing until 3s after the last event.
  useEffect(() => {
    if (!supabase || !clientId || !resolvedDocId || !currentUserId) return;
    const key = 'typing_' + resolvedDocId + '_' + clientId;
    const ch = supabase.channel(key, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'typing' }, (payload) => {
      const uid = payload && payload.payload && payload.payload.userId;
      if (!uid || uid === currentUserId) return;
      setOtherTyping(true);
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
      typingClearTimerRef.current = setTimeout(() => setOtherTyping(false), 3500);
    });
    ch.subscribe();
    typingChannelRef.current = ch;
    return () => {
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
      try { supabase.removeChannel(ch); } catch (e) {}
      typingChannelRef.current = null;
    };
  }, [clientId, resolvedDocId, currentUserId]);

  // Send a typing ping through the broadcast channel (rate-limited to
  // at most once per 1.5s so we don't flood realtime).
  const sendTypingPing = () => {
    const ch = typingChannelRef.current;
    if (!ch) return;
    const now = Date.now();
    if (now - typingLastSentRef.current < 1500) return;
    typingLastSentRef.current = now;
    try {
      ch.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUserId } });
    } catch (e) { /* ignore */ }
  };

  // Mark unread doc messages as read when the modal opens
  useEffect(() => {
    if (!supabase || !clientId || !currentUserId) return;
    supabase.from('doc_comments')
      .update({ read: true })
      .eq('client_id', clientId)
      .eq('read', false)
      .neq('sender_id', currentUserId)
      .then(()=>{}, ()=>{});
  }, [clientId, currentUserId]);

  // Load the other party's profile (name + avatar + last_seen) so the
  // header shows who you're talking to and whether they're online. If
  // the direct profiles select is blocked by RLS or photo_url is empty,
  // we also fall back to the predictable public storage URL and the
  // sender_name from messages.
  useEffect(() => {
    if (!supabase || !currentUserId) return;
    const otherId = currentUserId === clientId ? resolvedDocId : clientId;
    if (!otherId) return;
    let mounted = true;
    // Default guess: the profile avatar lives at photos/<uid>/avatar.jpg
    const storageGuess = sbUrl
      ? sbUrl + '/storage/v1/object/public/photos/' + otherId + '/avatar.jpg'
      : null;
    setPhotoBroken(false);
    setOtherParty(prev => ({ ...prev, photo: prev.photo || storageGuess }));
    supabase.from('profiles')
      .select('id,name,photo_url,last_seen')
      .eq('id', otherId)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted || !data) return;
        setOtherParty(prev => ({
          name: data.name || prev.name || '',
          photo: data.photo_url || prev.photo || storageGuess || null,
          lastSeen: data.last_seen || null,
        }));
      }, () => {});
    return () => { mounted = false; };
  }, [currentUserId, clientId, resolvedDocId]); // eslint-disable-line

  // Periodically refresh the other party's last_seen so the header
  // transitions from "онлайн" to "была недавно" without reloading.
  useEffect(() => {
    if (!supabase || !currentUserId) return;
    const otherId = currentUserId === clientId ? resolvedDocId : clientId;
    if (!otherId) return;
    const tick = () => {
      supabase.from('profiles').select('last_seen').eq('id', otherId).maybeSingle()
        .then(({ data }) => {
          if (!data) return;
          setOtherParty(prev => ({ ...prev, lastSeen: data.last_seen || prev.lastSeen }));
        }, () => {});
    };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [currentUserId, clientId, resolvedDocId]);

  // Fallback: when profiles read is blocked by RLS, at least fill the
  // display name from the latest message sent by the other party.
  useEffect(() => {
    if (otherParty.name) return;
    const other = [...messages].reverse().find(m => m.sender_id && m.sender_id !== currentUserId);
    if (other && other.sender_name) {
      setOtherParty(prev => ({ ...prev, name: other.sender_name }));
    }
  }, [messages, currentUserId, otherParty.name]);

  const send = async (overrides = {}) => {
    const t = (overrides.text !== undefined ? overrides.text : text).trim();
    const atts = overrides.attachments || [];
    if ((!t && atts.length === 0) || !supabase || !currentUserId || sending) return;
    if (!resolvedDocId) return;
    setSending(true);
    const tempId = 'tmp-' + Date.now();
    const tempMsg = {
      id: tempId, doc_id: resolvedDocId, client_id: clientId,
      sender_id: currentUserId, sender_name: currentUserName || '',
      date: tagDate || null, text: t, kind: 'comment', read: false,
      attachments: atts, reactions: {},
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    if (overrides.text === undefined) setText('');
    try {
      const { data, error } = await supabase.from('doc_comments').insert({
        doc_id: resolvedDocId, client_id: clientId,
        sender_id: currentUserId, sender_name: currentUserName || '',
        date: tagDate || null, text: t, kind: 'comment', read: false,
        attachments: atts,
      }).select().maybeSingle();
      if (error) throw error;
      if (data) setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } catch (e) {
      console.error('send chat:', e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      if (overrides.text === undefined) setText(t);
    }
    setSending(false);
  };

  const toggleReaction = async (msg, emoji) => {
    if (!supabase || !currentUserId) return;
    const reactions = Object.assign({}, msg.reactions || {});
    const list = Array.isArray(reactions[emoji]) ? reactions[emoji].slice() : [];
    const idx = list.indexOf(currentUserId);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(currentUserId);
    if (list.length === 0) delete reactions[emoji];
    else reactions[emoji] = list;
    // Optimistic local update
    setMessages(prev => prev.map(m => m.id === msg.id ? Object.assign({}, m, { reactions }) : m));
    try {
      await supabase.from('doc_comments').update({ reactions }).eq('id', msg.id);
    } catch (e) { console.error('react:', e); }
  };

  const onPickFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || !uploadAttachment) return;
    try {
      const url = await uploadAttachment(file);
      if (url) await send({ text: '', attachments: [{ type: file.type.startsWith('image/') ? 'image' : 'file', url, name: file.name }] });
    } catch (err) { console.error('upload att:', err); }
  };

  // Group messages by calendar day for "сегодня / вчера / дата" separators
  const grouped = [];
  let lastDayLabel = null;
  messages.forEach(m => {
    const d = new Date(m.created_at);
    const today = new Date();
    const yest = new Date(); yest.setDate(yest.getDate()-1);
    const sameDayAs = (a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
    let label;
    if (sameDayAs(d, today)) label = 'сегодня';
    else if (sameDayAs(d, yest)) label = 'вчера';
    else label = d.getDate() + ' ' + MO_R[d.getMonth()];
    if (label !== lastDayLabel) { grouped.push({ sep: label, key: 's' + m.id }); lastDayLabel = label; }
    grouped.push({ msg: m, key: m.id });
  });

  const iAmClient = currentUserId === clientId;
  // The "clientName" prop is the CURRENT viewer's own name on the client
  // side (openChat is called from client home with user.name). We prefer
  // the loaded other-party name — for both roles it's the full profile
  // name (e.g. "Радецкий.В.") — and only fall back if it hasn't loaded.
  const displayName = otherParty.name || (iAmClient ? '' : (clientName || ''));
  const avatarInitial = (displayName || '').trim().slice(0,2).toUpperCase() || '—';
  // Online = last_seen within 2 min. Otherwise show "была/был N мин назад".
  const isOnline = (() => {
    if (!otherParty.lastSeen) return false;
    const dt = new Date(otherParty.lastSeen).getTime();
    return Date.now() - dt < 120000;
  })();
  const seenAgo = otherParty.lastSeen ? formatLastSeen(otherParty.lastSeen) : '';
  let statusLine = '', statusColor = C.muted;
  if (otherTyping) { statusLine = 'печатает...'; statusColor = '#34C759'; }
  else if (isOnline) { statusLine = 'онлайн'; statusColor = '#34C759'; }
  else if (seenAgo) { statusLine = 'был(а) ' + seenAgo; statusColor = C.muted; }

  return <div style={{position:'fixed',inset:0,zIndex:10000,background:C.bg,display:'flex',flexDirection:'column',animation:'fadeIn .2s',paddingTop:'env(safe-area-inset-top)',paddingBottom:kbHeight>0?kbHeight+'px':'76px',overflow:'hidden',overscrollBehavior:'none',touchAction:'pan-y'}}>
    {/* Header */}
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:C.surface,boxShadow:'0 1px 0 rgba(0,0,0,.04)',flexShrink:0}}>
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:6,color:C.text,display:'flex',flexShrink:0}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      {otherParty.photo && !photoBroken
        ? <img src={otherParty.photo} alt="" onError={() => setPhotoBroken(true)} style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',flexShrink:0,background:C.surfaceAlt}}/>
        : <div style={{width:40,height:40,borderRadius:'50%',background:C.accentSoft,color:C.accent,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,flexShrink:0,fontFamily:'var(--fd)'}}>{avatarInitial}</div>
      }
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:16,fontWeight:600,color:C.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minHeight:20}}>{displayName}</div>
        {statusLine && <div style={{fontSize:11,color:statusColor,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:statusColor==='#34C759'?500:400}}>{statusLine}</div>}
      </div>
    </div>

    {/* Messages */}
    <div ref={scrollRef} style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'16px 18px',display:'flex',flexDirection:'column',gap:4,minHeight:0,overscrollBehavior:'contain'}}>
      {!messagesLoading && messages.length === 0 && <div style={{textAlign:'center',color:C.muted,fontSize:13,padding:'24px 0'}}>Нет сообщений</div>}
      {grouped.map(g => {
        if (g.sep) return <div key={g.key} style={{textAlign:'center',fontSize:11,color:C.muted,margin:'12px 0 6px',fontWeight:500}}>{g.sep}</div>;
        const m = g.msg;
        const isMine = m.sender_id === currentUserId;
        const reactions = m.reactions || {};
        const reactionEntries = Object.entries(reactions).filter(([,users]) => Array.isArray(users) && users.length > 0);
        const atts = Array.isArray(m.attachments) ? m.attachments : [];
        return <div key={g.key} style={{display:'flex',flexDirection:'column',alignItems:isMine?'flex-end':'flex-start',marginBottom:8}}>
          <div style={{maxWidth:'82%',padding:m.text?'10px 14px':'6px',borderRadius:isMine?'16px 16px 4px 16px':'16px 16px 16px 4px',background:isMine?C.accent:C.surface,color:isMine?'#fff':C.text,fontSize:14,lineHeight:1.5,boxShadow:C.shadowCard,wordBreak:'break-word',overflowWrap:'anywhere'}}>
            {atts.map((a, i) => a.type === 'image'
              ? <img key={i} src={a.url} alt="" style={{display:'block',width:'100%',maxWidth:220,borderRadius:10,marginBottom:m.text?6:0}}/>
              : <div key={i} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,padding:'4px 0'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" style={{color:isMine?'#fff':C.accent,textDecoration:'underline'}}>{a.name || 'Файл'}</a>
                </div>)}
            {m.text && <div style={{whiteSpace:'pre-wrap'}}>{m.text}</div>}
            {m.date && <button type="button" onClick={() => onTagClick && onTagClick(m.date)} style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:6,padding:'4px 9px',borderRadius:10,background:isMine?'rgba(255,255,255,.18)':C.accentSoft,color:isMine?'#fff':C.accent,fontSize:11,fontWeight:600,border:'none',cursor:'pointer',fontFamily:'inherit',textDecoration:'underline',textUnderlineOffset:2}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {fmtDateTag(m.date)} →
            </button>}
          </div>
          <div style={{fontSize:10,color:C.muted,marginTop:3,padding:'0 4px'}}>{fmtChatTime(m.created_at)}</div>
          {/* Reactions — always show row for doc messages so clients can react;
              for own messages, show only if there are reactions */}
          {(!isMine || reactionEntries.length > 0) && <div style={{display:'flex',gap:4,marginTop:3,flexWrap:'wrap',maxWidth:'82%'}}>
            {reactionEntries.map(([emoji, users]) => {
              const mine = users.includes(currentUserId);
              return <button key={emoji} onClick={() => toggleReaction(m, emoji)} style={{background:mine?C.accentSoft:C.surfaceAlt,border:`1px solid ${mine?C.accent:'transparent'}`,borderRadius:12,padding:'2px 8px',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:3,fontFamily:'inherit'}}>
                <span>{emoji}</span><span style={{fontSize:10,color:mine?C.accent:C.muted,fontWeight:600}}>{users.length}</span>
              </button>;
            })}
            {!isMine && <ReactionPicker onPick={(e) => toggleReaction(m, e)} active={reactionEntries.map(([e])=>e)}/>}
          </div>}
        </div>;
      })}
    </div>

    {/* Tag pill above input */}
    {tagDate && <div style={{padding:'8px 14px 0',flexShrink:0}}>
      <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:14,background:C.accentSoft,color:C.accent,fontSize:12,fontWeight:600}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        {fmtDateTag(tagDate)}
        <button onClick={() => setTagDate(null)} style={{background:'none',border:'none',cursor:'pointer',color:C.accent,padding:0,display:'flex'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <span style={{fontWeight:400,color:C.soft,marginLeft:4}}>ответ про этот день</span>
      </div>
    </div>}

    {/* Emoji row */}
    {showEmoji && <div style={{display:'flex',flexWrap:'wrap',gap:4,padding:'8px 14px',background:C.surface,borderTop:`1px solid ${C.surfaceAlt}`,flexShrink:0}}>
      {EMOJIS.map(e => <button key={e} onClick={() => { setText(text + e); setShowEmoji(false); }} style={{fontSize:22,background:'none',border:'none',cursor:'pointer',padding:4,borderRadius:8}}>{e}</button>)}
    </div>}

    {/* Input toolbar — extends all the way to the bottom edge so no
        background-color strip shows under it on iOS */}
    <div style={{background:C.surface,padding:'14px 18px 14px',flexShrink:0,boxShadow:'0 -1px 0 rgba(0,0,0,.04)'}}>
      <div style={{display:'flex',gap:10,alignItems:'flex-end'}}>
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{display:'none'}} onChange={onPickFile}/>
        <button onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{width:38,height:38,borderRadius:'50%',background:C.surfaceAlt,border:'none',cursor:'pointer',color:C.soft,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
        </button>
        <textarea ref={textareaRef} value={text} onChange={e => { setText(e.target.value); sendTypingPing(); }} placeholder="Сообщение" rows={1}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          style={{flex:1,minWidth:0,padding:'10px 16px',borderRadius:20,border:`1.5px solid ${C.tileBorder}`,fontSize:16,fontFamily:'inherit',resize:'none',outline:'none',boxSizing:'border-box',background:C.bg,lineHeight:1.4,maxHeight:120,minHeight:40,overflowY:'auto'}}
          onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.tileBorder}/>
        {!text.trim() && <button onClick={() => setShowEmoji(!showEmoji)} style={{width:38,height:38,borderRadius:'50%',background:C.surfaceAlt,border:'none',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>😊</button>}
        {text.trim()
          ? <button disabled={sending} onClick={() => send()} style={{width:40,height:40,borderRadius:'50%',border:'none',background:C.accent,color:'#fff',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(45,95,63,.25)'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          : <MicButton onResult={(t) => setText(t)} onStart={() => {}} style={{width:40,height:40,borderRadius:'50%',padding:0,background:C.accent,color:'#fff',flexShrink:0}}/>
        }
      </div>
    </div>
  </div>;
}

// Small picker shown as a "+" button next to existing reactions; opens a
// horizontal row of quick emojis.
function ReactionPicker({ onPick, active }) {
  const [open, setOpen] = useState(false);
  return <div style={{position:'relative',display:'inline-block'}}>
    <button onClick={() => setOpen(!open)} style={{background:C.surfaceAlt,border:'1px dashed '+C.tileBorder,borderRadius:12,padding:'2px 8px',fontSize:12,cursor:'pointer',color:C.muted,fontFamily:'inherit'}}>+</button>
    {open && <div style={{position:'absolute',bottom:'100%',left:0,marginBottom:4,background:C.surface,borderRadius:16,boxShadow:C.shadowHover,padding:'6px 8px',display:'flex',gap:4,zIndex:2}}>
      {REACTION_SET.map(e => <button key={e} onClick={() => { onPick(e); setOpen(false); }} style={{fontSize:20,background:active.includes(e)?C.accentSoft:'none',border:'none',cursor:'pointer',padding:'4px 6px',borderRadius:8}}>{e}</button>)}
    </div>}
  </div>;
}

// ═══ ANALYTICS ═══

// Format minutes since midnight to HH:MM (handles 24h+ normalized bedtimes)
const fmtTime = (mins) => {
  if (mins == null) return '';
  let total = mins;
  if (total >= 1440) total -= 1440; // normalize back to 0-1439
  const h = Math.floor(total / 60), m = Math.round(total % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
};

// Aggregate a diary range into per-metric summaries.
// Input: days array of diary_days rows, meals array joined via diary_day_id.
// Output: { series: { water:[{date,value}], sleep:[...], ... }, summary: {...} }
function buildAnalytics(days, meals, waterNorm) {
  const safeDays = Array.isArray(days) ? days : [];
  const safeMeals = Array.isArray(meals) ? meals : [];
  const byDayId = {};
  safeDays.forEach(d => { if (d && d.id) byDayId[d.id] = d.date; });
  const mealsByDate = {};
  safeMeals.forEach(m => {
    if (!m) return;
    const date = byDayId[m.diary_day_id];
    if (!date) return;
    if (!mealsByDate[date]) mealsByDate[date] = [];
    mealsByDate[date].push(m);
  });

  // Parse a "HH:MM" or "HH:MM:SS" string to minutes since midnight.
  const parseTime = (t) => {
    if (t == null || typeof t !== 'string') return null;
    const parts = t.split(':');
    const h = parseInt(parts[0], 10), m = parseInt(parts[1] || '0', 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  // Parse movement JSON and sum all activity durations (minutes)
  const parseMovementMinutes = (raw) => {
    if (!raw) return null;
    let obj = raw;
    if (typeof raw === 'string') {
      if (!raw.trim()) return null;
      if (raw.startsWith('{')) {
        try { obj = JSON.parse(raw); } catch(e) { return null; }
      } else return null;
    }
    if (typeof obj !== 'object') return null;
    const acts = obj.activities || (obj.type ? [{ type: obj.type, duration: obj.duration || 10 }] : []);
    if (!acts.length) return null;
    return acts.reduce((sum, a) => sum + (Number(a.duration) || 0), 0);
  };

  // Build a dense series: one entry per day, sorted ASC — 9 metrics
  const series = {
    water: [], stool: [], sleepDuration: [], sleepQuality: [], bedtime: [],
    movement: [], stress: [], energy: [], mood: [],
  };
  safeDays.forEach(d => {
    if (!d) return;
    // Water
    const waterVal = Number(d.water_ml);
    series.water.push({ date: d.date, value: waterVal > 0 ? waterVal : null });
    // Stool: "Норма" = 1, anything else ("Диарея","Запор","Нет стула") = 0, null = not tracked
    const stoolVal = d.stool_state ? (d.stool_state === 'Норма' ? 1 : 0) : null;
    series.stool.push({ date: d.date, value: stoolVal });
    // Sleep duration (hours) from bed/wake times
    let hours = null;
    const bedMin = parseTime(d.sleep_bed);
    const wakeMin = parseTime(d.sleep_wake);
    if (bedMin != null && wakeMin != null) {
      let mins = wakeMin - bedMin;
      if (mins < 0) mins += 24 * 60;
      hours = mins / 60;
    }
    series.sleepDuration.push({ date: d.date, value: hours });
    // Sleep quality (1-10)
    series.sleepQuality.push({ date: d.date, value: d.sleep_quality != null ? Number(d.sleep_quality) : null });
    // Bedtime: normalize for averaging — if before 12:00 (early morning), treat as next day (add 24h)
    // This way 23:00=1380, 00:30=1470, 01:00=1500 — averaging works correctly
    let bedNorm = bedMin;
    if (bedNorm != null && bedNorm < 720) bedNorm += 1440; // before noon → add 24h
    series.bedtime.push({ date: d.date, value: bedNorm, bedRaw: d.sleep_bed, wakeRaw: d.sleep_wake });
    // Movement: total minutes from all activities
    series.movement.push({ date: d.date, value: parseMovementMinutes(d.movement) ?? 0 });
    // Stress, Energy, Mood
    series.stress.push({ date: d.date, value: d.stress_level != null ? Number(d.stress_level) : null });
    series.energy.push({ date: d.date, value: d.energy != null ? Number(d.energy) : null });
    series.mood.push({ date: d.date, value: d.mood != null ? Number(d.mood) + 1 : null }); // mood 0-4 → 1-5
  });

  const avg = (arr) => {
    const nums = arr.map(x => x.value).filter(v => v != null && !isNaN(v));
    if (!nums.length) return null;
    return nums.reduce((a,b)=>a+b,0) / nums.length;
  };
  const pct = (arr) => {
    const present = arr.filter(x => x.value != null).length;
    if (!present) return null;
    const vals = arr.filter(x => x.value != null && x.value > 0).length;
    return Math.round(vals / present * 100);
  };

  const waterAvg = avg(series.water);
  const stoolPct = pct(series.stool); // % of days with "Норма"
  const sleepDurAvg = avg(series.sleepDuration);
  const sleepQualAvg = avg(series.sleepQuality);
  // Bedtime avg: keep raw (normalized) for status, denormalize for display
  const bedtimeAvgRaw = avg(series.bedtime); // e.g. 1566 for 02:06
  let bedtimeAvg = bedtimeAvgRaw;
  if (bedtimeAvg != null && bedtimeAvg >= 1440) bedtimeAvg -= 1440;
  const movementAvg = avg(series.movement); // avg minutes per day
  const stressAvg = avg(series.stress);
  const energyAvg = avg(series.energy);
  const moodAvg = avg(series.mood);

  // Simple status rules
  const statusFn = (val, goodMin, okMin, reverse=false) => {
    if (val == null) return { label: 'Нет данных', color: '#999' };
    if (reverse) {
      if (val <= goodMin) return { label: 'Отлично', color: '#2D5F3F' };
      if (val <= okMin) return { label: 'Хорошо', color: '#C98B5F' };
      return { label: 'Внимание', color: '#B8453A' };
    }
    if (val >= goodMin) return { label: 'Отлично', color: '#2D5F3F' };
    if (val >= okMin) return { label: 'Хорошо', color: '#C98B5F' };
    return { label: 'Внимание', color: '#B8453A' };
  };

  const summary = {
    water: {
      avg: waterAvg == null ? null : Math.round(waterAvg),
      unit: 'мл',
      norm: waterNorm,
      pct: waterAvg == null ? null : Math.min(100, Math.round(waterAvg/waterNorm*100)),
      status: waterAvg == null ? { label: 'Нет данных', color: '#999' } : statusFn(waterAvg/waterNorm*100, 90, 70),
    },
    stool: { pct: stoolPct, unit: '%', status: statusFn(stoolPct, 80, 50) },
    sleepDuration: { avg: sleepDurAvg, unit: 'ч', status: (() => {
      if (sleepDurAvg == null) return { label: 'Нет данных', color: '#999' };
      if (sleepDurAvg >= 7 && sleepDurAvg <= 9) return { label: 'Отлично', color: '#2D5F3F' };
      if (sleepDurAvg >= 6 && sleepDurAvg <= 10) return { label: 'Хорошо', color: '#C98B5F' };
      return { label: 'Внимание', color: '#B8453A' };
    })() },
    sleepQuality: { avg: sleepQualAvg, unit: '/10', status: statusFn(sleepQualAvg, 7, 5) },
    bedtime: { avg: bedtimeAvg, unit: '', status: (() => {
      if (bedtimeAvgRaw == null) return { label: 'Нет данных', color: '#999' };
      // Use raw normalized minutes: 22:00=1320, 23:00=1380, 00:30=1470, 02:06=1566
      const m = bedtimeAvgRaw;
      if (m < 1320) return { label: 'Отлично', color: '#2D5F3F' }; // before 22:00
      if (m < 1380) return { label: 'Хорошо', color: '#C98B5F' }; // 22:00-23:00
      return { label: 'Внимание', color: '#B8453A' }; // after 23:00 (incl. after midnight)
    })() },
    movement: { avg: movementAvg, unit: 'мин', status: statusFn(movementAvg, 30, 15) },
    stress: { avg: stressAvg, unit: '/10', status: statusFn(stressAvg, 4, 7, true) },
    energy: { avg: energyAvg, unit: '/10', status: statusFn(energyAvg, 7, 5) },
    mood: { avg: moodAvg, unit: '/5', status: (() => {
      if (moodAvg == null) return { label: 'Нет данных', color: '#999' };
      if (moodAvg >= 4.5) return { label: 'Прекрасно', color: '#2D5F3F' };
      if (moodAvg >= 3.5) return { label: 'Хорошо', color: '#2D5F3F' };
      if (moodAvg >= 2.5) return { label: 'Нейтрально', color: '#C98B5F' };
      return { label: 'Внимание', color: '#B8453A' };
    })() },
  };

  return { series, summary };
}

// ── Chart.js canvas wrapper ──
function ChartCanvas({ config, width, height, style }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    try { chartRef.current = new Chart(canvasRef.current, config); } catch(e) { console.error('ChartCanvas error',e); }
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [JSON.stringify(config)]);
  return <canvas ref={canvasRef} width={width} height={height} style={{display:'block',...(style||{})}}/>;
}

// Metric color map — 9 metrics (SVG icons from diary)
const MC = {
  water:         { color:'#378ADD', bg:'#e8f0fb', icon: I.drop },
  stool:         { color:'#8B6F47', bg:'#f5f0e8', icon: I.stool },
  sleepDuration: { color:'#7F77DD', bg:'#eeedfe', icon: I.moon },
  sleepQuality:  { color:'#9B7FDD', bg:'#f0edfe', icon: I.moon },
  bedtime:       { color:'#5B6FBB', bg:'#e8ecf8', icon: I.moon },
  movement:      { color:'#0F6E56', bg:'#e1f5ee', icon: I.run },
  stress:        { color:'#D85A30', bg:'#faece7', icon: I.brain },
  energy:        { color:'#EF9F27', bg:'#fff8e0', icon: I.heart },
  mood:          { color:'#E07BAD', bg:'#fce8f0', icon: I.heart },
};

// Sparkline — mini Chart.js canvas (28px height, no axes) — matches detail chart style
function Sparkline({ data, metricKey, color }) {
  const nums = (data || []).map(d => d.value == null || isNaN(d.value) ? null : d.value);
  if (nums.filter(v => v !== null).length < 2) return <div style={{width:68,height:28,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:9,color:'#ccc'}}>—</span></div>;
  const isStool = metricKey === 'stool';
  const isBedtime = metricKey === 'bedtime';
  const cfg = {
    type: 'line',
    data: {
      labels: nums.map((_,i) => i),
      datasets: [{
        data: nums,
        backgroundColor: (color || '#378ADD') + '18',
        borderColor: color || '#378ADD',
        borderWidth: 1.5,
        pointRadius: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: color || '#378ADD',
        pointBorderWidth: 1.5,
        tension: 0.35,
        fill: true,
        spanGaps: true,
        ...(isStool ? { stepped: true } : {}),
      }]
    },
    options: {
      responsive: false, animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false, beginAtZero: !isBedtime && !isStool } },
      layout: { padding: 0 },
    }
  };
  return <ChartCanvas config={cfg} width={68} height={28} style={{width:68,height:28}}/>;
}

// Detail chart — full Chart.js with axes, gridlines, labels, optional norm line — ALL LINES
function DetailLineChart({ data, color, norm, metricKey, range, height: chartHeight }) {
  const h = chartHeight || 180;
  const items = data || [];
  const nums = items.map(d => d.value == null || isNaN(d.value) ? null : d.value);
  const labels = items.map(d => { const p = (d.date||'').split('-'); return p.length===3 ? p[2]+'.'+p[1] : d.date; });
  const hasData = nums.some(v => v !== null);
  if (!hasData) return <div style={{textAlign:'center',padding:'32px 0',color:C.muted,fontSize:13}}>Недостаточно данных</div>;
  const isBedtime = metricKey === 'bedtime';
  const isStool = metricKey === 'stool';
  const datasets = [{
    data: nums,
    backgroundColor: color + '18',
    borderColor: color,
    borderWidth: 2.5,
    pointRadius: 5,
    pointHoverRadius: 7,
    pointBackgroundColor: '#fff',
    pointBorderColor: color,
    pointBorderWidth: 2.5,
    tension: 0.35,
    fill: true,
    spanGaps: true,
    ...(isStool ? { stepped: true, pointRadius: 6 } : {}),
  }];
  const plugins = [];
  // Value labels above points
  plugins.push({ id:'valueLabels', afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    meta.data.forEach((pt, i) => {
      const val = dataset.data[i];
      if (val == null) return;
      let label;
      if (isStool) label = val === 1 ? 'Норма' : 'Не норма';
      else if (isBedtime) label = fmtTime(val);
      else if (Number.isInteger(val)) label = String(val);
      else label = val.toFixed(1).replace('.', ',');
      ctx.fillStyle = color;
      ctx.fillText(label, pt.x, pt.y - 10);
    });
    ctx.restore();
  }});
  if (norm != null && norm > 0) {
    plugins.push({ id:'normLine', afterDraw(chart) {
      const yScale = chart.scales.y;
      const ctx = chart.ctx;
      const yPos = yScale.getPixelForValue(norm);
      if (yPos >= yScale.top && yPos <= yScale.bottom) {
        ctx.save(); ctx.beginPath(); ctx.setLineDash([5,4]); ctx.strokeStyle = C.warm; ctx.lineWidth = 1.5;
        ctx.moveTo(chart.chartArea.left, yPos); ctx.lineTo(chart.chartArea.right, yPos);
        ctx.stroke(); ctx.restore();
        ctx.fillStyle = C.warm; ctx.font = '10px sans-serif'; ctx.fillText('норма', chart.chartArea.right - 35, yPos - 4);
      }
    }});
  }
  const cfg = {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true, mode:'index', intersect: false,
        callbacks: { title: ctx => ctx[0]?.label || '', label: ctx => {
          if (ctx.parsed.y == null) return '';
          if (isBedtime) return fmtTime(ctx.parsed.y);
          if (isStool) return ctx.parsed.y === 1 ? 'Норма' : 'Не норма';
          return (Math.round(ctx.parsed.y * 10) / 10).toString().replace('.', ',');
        }}
      }},
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: C.muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
        y: (() => {
          const isScale10 = metricKey === 'stress' || metricKey === 'energy' || metricKey === 'sleepQuality';
          const isMood = metricKey === 'mood';
          const base = {
            beginAtZero: !isBedtime && !isStool,
            grid: { color: C.surfaceAlt, drawBorder: false },
            ticks: {
              font: { size: 10 }, color: C.muted, maxTicksLimit: 5,
              ...(isBedtime ? { callback: v => fmtTime(v) } : {}),
              ...(isStool ? { callback: v => v === 1 ? 'Норма' : v === 0 ? 'Не норма' : '' } : {}),
            },
          };
          if (isStool) return { ...base, min: -0.15, max: 1.15, afterBuildTicks: axis => { axis.ticks = [{value:0},{value:1}]; } };
          if (isScale10) return { ...base, min: 0, max: 10, ticks: { ...base.ticks, stepSize: 2 } };
          if (isMood) return { ...base, min: 1, max: 5, ticks: { ...base.ticks, stepSize: 1 } };
          return { ...base, grace: '15%' };
        })()
      },
      layout: { padding: { top: 36, bottom: 0, left: 0, right: 0 } },
    },
    plugins,
  };
  return <div style={{width:'100%',height:h}}><ChartCanvas config={cfg} width={400} height={h} style={{width:'100%',height:'100%'}}/></div>;
}

// Metric tile — card in the 2-column grid (tappable)
function MetricTile({ metricKey, label, value, unit, status, sparkData, onClick }) {
  const mc = MC[metricKey] || { color: C.accent, bg: C.accentSoft, icon: '📊' };
  const badgeStyle = (() => {
    const l = (status?.label || '').toLowerCase();
    if (l.includes('отлично')) return { background:'#e8f4e8', color:'#1a5a1a' };
    if (l.includes('хорошо')) return { background:'#e8f0e8', color:'#2a6a2a' };
    if (l.includes('внимание')) return { background:'#fff3e0', color:'#8a5000' };
    return { background: (status?.color||'#999') + '15', color: status?.color||'#999' };
  })();
  return <div onClick={onClick} style={{background:C.surface,borderRadius:18,padding:'14px 14px 12px',boxShadow:C.shadowCard,display:'flex',flexDirection:'column',gap:6,cursor:'pointer',WebkitTapHighlightColor:'transparent'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <span style={{fontSize:11,fontWeight:600,color:C.soft,letterSpacing:'.03em',textTransform:'uppercase'}}>{label}</span>
      <div style={{width:30,height:30,borderRadius:10,background:mc.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{mc.icon}</div>
    </div>
    <div style={{display:'flex',alignItems:'baseline',gap:4}}>
      <span style={{fontSize:24,fontWeight:700,color:C.text,fontFamily:'var(--fd)',lineHeight:1}}>{value}</span>
      {unit && <span style={{fontSize:11,color:C.muted}}>{unit}</span>}
    </div>
    <Sparkline data={sparkData} metricKey={metricKey} color={mc.color}/>
    <div style={{fontSize:10,fontWeight:600,padding:'3px 10px',borderRadius:8,alignSelf:'flex-start',...badgeStyle}}>{status?.label || '—'}</div>
  </div>;
}

// Format number to 1 decimal or dash
const fmt1 = (v) => v == null || isNaN(v) ? '—' : (Math.round(v*10)/10).toString().replace('.', ',');

// Compute health score (0-10) as weighted average — 9 metrics
function computeHealthScore(summary, waterNorm) {
  if (!summary) return null;
  const weights = {
    water: 0.15, stool: 0.08, sleepDuration: 0.14, sleepQuality: 0.10,
    movement: 0.12, stress: 0.12, energy: 0.14, mood: 0.15,
    // bedtime: not scored (display-only per spec)
  };
  let total = 0, wSum = 0;
  // water: pct of norm -> 0-10
  if (summary.water?.avg != null) { const v = Math.min(10, (summary.water.avg / (waterNorm||2200)) * 10); total += v * weights.water; wSum += weights.water; }
  // stool: pct of norma days -> 0-10
  if (summary.stool?.pct != null) { total += Math.min(10, summary.stool.pct / 10) * weights.stool; wSum += weights.stool; }
  // sleepDuration: peak at 7-9h
  if (summary.sleepDuration?.avg != null) { const h = summary.sleepDuration.avg; const v = h >= 7 && h <= 9 ? 10 : h >= 6 && h <= 10 ? 7 : Math.max(0, 10 - Math.abs(h - 8) * 2.5); total += v * weights.sleepDuration; wSum += weights.sleepDuration; }
  // sleepQuality: already 0-10
  if (summary.sleepQuality?.avg != null) { total += summary.sleepQuality.avg * weights.sleepQuality; wSum += weights.sleepQuality; }
  // movement: 30+ min/day is excellent -> cap at 10
  if (summary.movement?.avg != null) { total += Math.min(10, summary.movement.avg / 6) * weights.movement; wSum += weights.movement; }
  // stress: inverted 0-10 -> 10-0
  if (summary.stress?.avg != null) { total += (10 - summary.stress.avg) * weights.stress; wSum += weights.stress; }
  // energy: already 0-10
  if (summary.energy?.avg != null) { total += summary.energy.avg * weights.energy; wSum += weights.energy; }
  // mood: 1-5 -> 0-10
  if (summary.mood?.avg != null) { total += (summary.mood.avg / 5 * 10) * weights.mood; wSum += weights.mood; }
  if (wSum === 0) return null;
  return Math.round((total / wSum) * 10) / 10;
}

// Generate insights — 9 metrics
function generateInsights(summary, waterNorm) {
  if (!summary) return [];
  const out = [];
  // Good
  if (summary.water?.avg != null && summary.water.avg >= (waterNorm||2200)*0.9) out.push({ color:'#378ADD', title:'Водный баланс в норме', text:'Вы стабильно пьёте достаточно воды. Продолжайте в том же духе!' });
  if (summary.sleepDuration?.avg != null && summary.sleepDuration.avg >= 7 && summary.sleepDuration.avg <= 9) out.push({ color:'#7F77DD', title:'Отличный сон', text:'Средняя продолжительность сна в оптимальном диапазоне 7-9 часов.' });
  if (summary.sleepQuality?.avg != null && summary.sleepQuality.avg >= 7) out.push({ color:'#9B7FDD', title:'Качество сна высокое', text:'Среднее качество сна 7+/10 — отличный результат!' });
  if (summary.energy?.avg != null && summary.energy.avg >= 7) out.push({ color:'#EF9F27', title:'Высокая энергия', text:'Уровень энергии стабильно высокий, это здорово!' });
  if (summary.mood?.avg != null && summary.mood.avg >= 4) out.push({ color:'#E07BAD', title:'Хорошее настроение', text:'Среднее настроение выше 4/5 — отлично!' });
  if (summary.stool?.pct != null && summary.stool.pct >= 80) out.push({ color:'#8B6F47', title:'Стул в норме', text:'Нормальный стул в большинстве дней.' });
  if (summary.movement?.avg != null && summary.movement.avg >= 30) out.push({ color:'#0F6E56', title:'Отличная активность', text:'В среднем 30+ минут активности в день.' });
  // Attention
  if (summary.water?.avg != null && summary.water.avg < (waterNorm||2200)*0.7) out.push({ color:'#D85A30', title:'Мало воды', text:`Среднее потребление ниже 70% нормы. Попробуйте пить чаще маленькими порциями.` });
  if (summary.sleepDuration?.avg != null && (summary.sleepDuration.avg < 6 || summary.sleepDuration.avg > 10)) out.push({ color:'#D85A30', title:'Сон требует внимания', text:'Продолжительность сна выходит за рамки здорового диапазона.' });
  if (summary.stress?.avg != null && summary.stress.avg >= 7) out.push({ color:'#D85A30', title:'Высокий стресс', text:'Средний уровень стресса повышен. Обратите внимание на отдых и восстановление.' });
  if (summary.stool?.pct != null && summary.stool.pct < 50) out.push({ color:'#8B6F47', title:'Стул требует внимания', text:'Менее 50% дней со стулом в норме. Обратите внимание на питание.' });
  if (summary.mood?.avg != null && summary.mood.avg < 3) out.push({ color:'#E07BAD', title:'Низкое настроение', text:'Среднее настроение ниже 3/5. Позаботьтесь о себе.' });
  if (out.length === 0) out.push({ color:'#0F6E56', title:'Данных мало', text:'Заполняйте дневник каждый день, чтобы получить персональные инсайты.' });
  return out.slice(0, 4);
}

// Main analytics screen
function AnalyticsScreen({ analytics, range, onRangeChange, onBack, waterNorm, title, customDateRange, onCustomDateRange }) {
  const [renderError, setRenderError] = useState(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [metricModal, setMetricModal] = useState(null); // metric key for fullscreen modal

  const loading = !analytics || analytics.loading;
  let summary = null, series = null;
  if (!loading && analytics) {
    try {
      const r = buildAnalytics(analytics.days, analytics.meals, waterNorm || 2200);
      summary = r.summary;
      series = r.series;
    } catch (e) {
      console.error('buildAnalytics error:', e);
      if (!renderError) setTimeout(() => setRenderError(e.message || 'Ошибка построения аналитики'), 0);
    }
  }

  const METRICS = [
    { key:'energy',        label:'Энергия',             norm: null },
    { key:'mood',          label:'Настроение',          norm: null },
    { key:'movement',      label:'Движение',            norm: null },
    { key:'water',         label:'Вода',                norm: waterNorm||2200 },
    { key:'stress',        label:'Стресс',              norm: null },
    { key:'stool',         label:'Стул',                norm: null },
    { key:'sleepDuration', label:'Длительность сна',    norm: null },
    { key:'bedtime',       label:'Время отхода ко сну', norm: null },
    { key:'sleepQuality',  label:'Качество сна',        norm: null },
  ];

  const tileValue = (key) => {
    if (!summary) return '—';
    const s = summary[key];
    if (!s) return '—';
    if (key === 'water') return s.avg == null ? '—' : Number(s.avg).toLocaleString('ru');
    if (key === 'stool') return s.pct == null ? '—' : s.pct + '%';
    if (key === 'bedtime') return s.avg == null ? '—' : fmtTime(s.avg);
    if (key === 'movement') return s.avg == null ? '—' : Math.round(s.avg);
    return fmt1(s.avg);
  };
  const tileUnit = (key) => {
    if (!summary) return '';
    const s = summary[key];
    if (!s) return '';
    if (key === 'water') return 'мл/день';
    if (key === 'stool') return 'норма';
    if (key === 'sleepDuration') return 'ч';
    if (key === 'sleepQuality') return '/10';
    if (key === 'bedtime') return '';
    if (key === 'movement') return 'мин/день';
    return s.unit || '';
  };

  const healthScore = computeHealthScore(summary, waterNorm || 2200);
  const insights = generateInsights(summary, waterNorm || 2200);

  // Build hero sparkline from daily average of all metrics (simplified: use water pct as proxy)
  const heroSpark = (() => {
    if (!series?.water) return [];
    return series.water.map(d => d.value == null ? 0 : Math.min(100, Math.round(d.value / (waterNorm||2200) * 100)));
  })();

  const heroChartCfg = {
    type:'line',
    data:{ labels: heroSpark.map((_,i)=>i), datasets:[{ data:heroSpark, borderColor:'rgba(255,255,255,.7)', borderWidth:1.5, pointRadius:0, tension:0.4, fill:true, backgroundColor:'rgba(255,255,255,.1)' }] },
    options:{ responsive:false, animation:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{x:{display:false},y:{display:false,beginAtZero:true}}, layout:{padding:0} }
  };

  // Insight per-metric for detail cards
  const getInsight = (key) => {
    if (!summary || !series) return '';
    const s = summary[key];
    if (!s) return '';
    const arr = series[key] || [];
    const valid = arr.filter(x => x.value != null && !isNaN(x.value));
    if (!valid.length) return 'Недостаточно данных. Заполни дневник за несколько дней.';
    if (key === 'water') { const normVal = waterNorm||2200; const avgN = Number(s.avg)||0; return `В среднем ${avgN.toLocaleString('ru')} мл/день — ${s.pct||0}% нормы (${normVal} мл).`; }
    if (key === 'stool') return `Норма в ${s.pct||0}% отмеченных дней.`;
    if (key === 'sleepDuration') return `В среднем ${fmt1(s.avg)} ч. Оптимум — 7-9 часов.`;
    if (key === 'sleepQuality') return `Среднее качество сна: ${fmt1(s.avg)}/10.`;
    if (key === 'bedtime') return s.avg == null ? '' : `Среднее время отхода ко сну: ${fmtTime(s.avg)}. Оптимум — до 23:00.`;
    if (key === 'movement') return `В среднем ${Math.round(s.avg||0)} мин активности в день.`;
    if (key === 'stress') return `В среднем ${fmt1(s.avg)}/10. Чем ниже, тем лучше.`;
    if (key === 'energy') return `В среднем ${fmt1(s.avg)}/10.`;
    if (key === 'mood') return `Среднее настроение: ${fmt1(s.avg)}/5.`;
    return `В среднем ${fmt1(s.avg)}${s.unit||''}.`;
  };

  const periodLabel = range==='3d'?'за 3 дня':range==='5d'?'за 5 дней':range==='7d'?'за неделю':range==='1m'?'за месяц':range==='custom'&&customDateRange?`${customDateRange.start.slice(5).replace('-','.')}–${customDateRange.end.slice(5).replace('-','.')}` :'за период';

  const handleCustomApply = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      onCustomDateRange({ start: customStart, end: customEnd });
      onRangeChange('custom');
      setShowCustomPicker(false);
    }
  };

  return <div style={{animation:'slideRight .3s ease'}}>
    <TopBar left={onBack?<BackBtn onClick={onBack}/>:null} title={title||'Аналитика'} right={null}/>

    {/* Period tabs */}
    <div style={{display:'flex',gap:4,background:C.surfaceAlt,padding:4,borderRadius:14,marginBottom:16}}>
      {[['3d','3д'],['5d','5д'],['7d','7д'],['1m','1мес'],['custom','Свой']].map(([k,l]) => {
        const isActive = range===k || (k==='custom' && showCustomPicker);
        const label = k==='custom' && range==='custom' && customDateRange
          ? customDateRange.start.slice(8)+'.'+customDateRange.start.slice(5,7)+'–'+customDateRange.end.slice(8)+'.'+customDateRange.end.slice(5,7)
          : l;
        return <button key={k} onClick={()=>{if(k==='custom'){if(!customStart||!customEnd){const e=new Date(),s=new Date();s.setDate(s.getDate()-6);setCustomStart(dk(s));setCustomEnd(dk(e))}setShowCustomPicker(true)}else{setShowCustomPicker(false);onRangeChange(k)}}} style={{flex:k==='custom'&&range==='custom'?1.4:1,padding:'10px 0',borderRadius:10,border:'none',background:isActive?C.surface:'transparent',color:isActive?C.accent:C.soft,fontSize:k==='custom'&&range==='custom'?10:12,fontWeight:isActive?600:400,cursor:'pointer',fontFamily:'inherit',boxShadow:isActive?'0 1px 4px rgba(0,0,0,.06)':'none',transition:'all .15s'}}>{label}</button>;
      })}
    </div>

    {/* Custom date picker modal */}
    {showCustomPicker && <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.45)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 32px'}} onClick={()=>setShowCustomPicker(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.surface,borderRadius:20,padding:20,width:'100%',maxWidth:300,boxShadow:C.shadow3d,overflow:'hidden',margin:'0 auto'}}>
        <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:16}}>Выберите период</div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div>
            <div style={{fontSize:12,color:C.soft,marginBottom:4}}>Начало</div>
            <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{width:'100%',padding:'10px 12px',borderRadius:12,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',background:C.surface,color:C.text,boxSizing:'border-box',maxWidth:'100%'}}/>
          </div>
          <div>
            <div style={{fontSize:12,color:C.soft,marginBottom:4}}>Конец</div>
            <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{width:'100%',padding:'10px 12px',borderRadius:12,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',background:C.surface,color:C.text,boxSizing:'border-box',maxWidth:'100%'}}/>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:20}}>
          <button onClick={()=>setShowCustomPicker(false)} style={{flex:1,padding:'12px 0',borderRadius:12,border:`1.5px solid ${C.tileBorder}`,background:'transparent',color:C.soft,fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Отмена</button>
          <button onClick={handleCustomApply} disabled={!customStart||!customEnd||customStart>customEnd} style={{flex:1,padding:'12px 0',borderRadius:12,border:'none',background:C.accent,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',opacity:(!customStart||!customEnd||customStart>customEnd)?0.5:1}}>Применить</button>
        </div>
      </div>
    </div>}

    {loading && <div style={{textAlign:'center',padding:'48px 0',color:C.muted,fontSize:14}}>Загружаем данные...</div>}

    {!loading && renderError && <div style={{textAlign:'center',padding:'48px 16px',color:C.danger,fontSize:13,lineHeight:1.5}}>
      Не получилось построить аналитику<br/><span style={{color:C.muted,fontSize:12}}>{renderError}</span>
    </div>}

    {!loading && !renderError && <>
      {/* 9 metric tiles — 2-column grid, tap opens modal */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        {METRICS.map(m => {
          const v = tileValue(m.key);
          return <MetricTile
            key={m.key}
            metricKey={m.key}
            label={m.label}
            value={v}
            unit={v === '—' ? '' : tileUnit(m.key)}
            status={summary?.[m.key]?.status || {label:'—',color:'#999'}}
            sparkData={series?.[m.key] || []}
            onClick={()=>setMetricModal(m.key)}
          />;
        })}
      </div>

      {/* Insights section */}
      {insights.length > 0 && <div style={{background:C.surface,borderRadius:20,padding:'18px',marginBottom:16,boxShadow:C.shadowCard}}>
        <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12}}>Инсайты</div>
        {insights.map((ins, i) => <div key={i} style={{display:'flex',gap:10,marginBottom:i<insights.length-1?10:0,alignItems:'flex-start'}}>
          <div style={{width:8,height:8,borderRadius:4,background:ins.color,marginTop:5,flexShrink:0}}/>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>{ins.title}</div>
            <div style={{fontSize:12,color:C.soft,lineHeight:1.4,marginTop:2}}>{ins.text}</div>
          </div>
        </div>)}
      </div>}

      {/* Fullscreen metric detail modal */}
      {metricModal && (() => {
        const m = METRICS.find(x => x.key === metricModal);
        if (!m) return null;
        const mc = MC[m.key] || { color: C.accent, bg: C.accentSoft, icon: '📊' };
        const info = summary?.[m.key];
        const insightText = getInsight(m.key);
        const v = tileValue(m.key);
        const u = v === '—' ? '' : tileUnit(m.key);
        return <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:C.bg,zIndex:9999,display:'flex',flexDirection:'column',overflow:'auto',animation:'enter .2s ease'}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px 12px',borderBottom:`1px solid ${C.surfaceAlt}`,background:C.bg,position:'sticky',top:0,zIndex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:40,height:40,borderRadius:12,background:mc.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{mc.icon}</div>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:C.text}}>{m.label}</div>
                <div style={{fontSize:12,color:C.muted}}>{periodLabel}</div>
              </div>
            </div>
            <button onClick={()=>setMetricModal(null)} style={{background:C.surfaceAlt,border:'none',cursor:'pointer',color:C.text,display:'flex',alignItems:'center',justifyContent:'center',padding:10,borderRadius:14,minWidth:44,minHeight:44,WebkitTapHighlightColor:'transparent'}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {/* Body */}
          <div style={{flex:1,padding:'20px 20px 32px'}}>
            {/* Value + status */}
            <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:4}}>
              <span style={{fontSize:36,fontWeight:800,color:C.text,fontFamily:'var(--fd)',lineHeight:1}}>{v}</span>
              {u && <span style={{fontSize:14,color:C.muted}}>{u}</span>}
            </div>
            {info?.status && <div style={{fontSize:12,fontWeight:600,color:info.status.color,marginBottom:20}}>{info.status.label}</div>}

            {/* Insight — above chart */}
            {insightText && <div style={{background:C.surface,borderRadius:16,padding:'14px 16px',marginBottom:12,boxShadow:C.shadowCard}}>
              <div style={{fontSize:13,color:C.soft,lineHeight:1.5}}>{insightText}</div>
            </div>}
            {/* Big chart */}
            <div style={{background:C.surface,borderRadius:20,padding:'16px 12px',marginBottom:20,boxShadow:C.shadowCard}}>
              <DetailLineChart
                data={series?.[m.key]||[]}
                color={mc.color}
                norm={m.norm}
                metricKey={m.key}
                range={range}
                height={280}
              />
            </div>
            {/* Лёг/Встал table — after chart in sleepDuration modal */}
            {m.key === 'sleepDuration' && series?.bedtime && (() => {
              const days = series.bedtime.filter(d => d.bedRaw || d.wakeRaw);
              return days.length > 0 ? <div style={{background:C.surface,borderRadius:16,padding:'14px 16px',boxShadow:C.shadowCard}}>
                <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:10}}>Лёг / Встал</div>
                {days.map((d, i) => {
                  const dateLabel = (() => { const p = (d.date||'').split('-'); return p.length===3 ? p[2]+'.'+p[1] : d.date; })();
                  return <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom: i < days.length-1 ? `1px solid ${C.surfaceAlt}` : 'none'}}>
                    <span style={{fontSize:12,color:C.muted,minWidth:45}}>{dateLabel}</span>
                    <span style={{fontSize:13,color:C.text}}>🛏 {d.bedRaw || '—'}</span>
                    <span style={{fontSize:13,color:C.text}}>☀️ {d.wakeRaw || '—'}</span>
                  </div>;
                })}
              </div> : null;
            })()}
          </div>
        </div>;
      })()}
    </>}
  </div>;
}

function Login({onLogin}){
  const[mode,setMode]=useState('auth'); // auth | register | doc | reset | docReg
  const[email,setEmail]=useState('');
  const[pass,setPass]=useState('');
  const[pass2,setPass2]=useState('');
  const[regName,setRegName]=useState('');
  const[regEmail,setRegEmail]=useState('');
  const[loading,setLoading]=useState(false);
  const[oauthLoading,setOauthLoading]=useState(false);
  const[error,setError]=useState('');
  const[success,setSuccess]=useState('');
  const[consent,setConsent]=useState(false);
  const[showP1,setShowP1]=useState(false);
  const[showP2,setShowP2]=useState(false);
  const[show,setShow]=useState(false);
  useEffect(()=>{setTimeout(()=>setShow(true),60)},[]);

  const inputStyle={width:'100%',padding:'16px 18px',borderRadius:16,border:`1.5px solid ${C.tileBorder}`,fontSize:15,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:C.surface,color:C.text,marginBottom:12,transition:'border-color .2s'};
  const eyeOpen=<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  const eyeClosed=<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
  const passInput=(val,setVal,ph,show,setShow,extra={})=>
    <div style={{position:'relative',marginBottom:12}}>
      <input value={val} onChange={e=>setVal(e.target.value)} placeholder={ph} type={show?'text':'password'}
        style={{...inputStyle,marginBottom:0,paddingRight:48}}
        onFocus={onFB} onBlur={offFB} {...extra}/>
      <button type="button" onClick={()=>setShow(!show)}
        style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:C.muted,display:'flex',padding:2}}>
        {show?eyeOpen:eyeClosed}
      </button>
    </div>;
  const onFB=e=>e.target.style.borderColor=C.accent;
  const offFB=e=>e.target.style.borderColor=C.tileBorder;
  const errBox = error ? <div style={{padding:'12px 16px',borderRadius:12,background:C.dangerSoft,color:C.danger,fontSize:13,marginBottom:12,animation:'enter .2s'}}>{error}</div> : null;
  const sucBox = success ? <div style={{padding:'12px 16px',borderRadius:12,background:C.accentSoft,color:C.accent,fontSize:13,marginBottom:12,animation:'enter .2s'}}>{success}</div> : null;


  // ── Russian error translations ──
  const ruError = (msg) => {
    if (!msg) return 'Неизвестная ошибка';
    const map = {
      'Invalid login credentials': 'Неверный email или пароль',
      'User already registered': 'Этот email уже зарегистрирован',
      'Unable to validate email address: invalid format': 'Некорректный формат email',
      'Signup requires a valid password': 'Введите пароль',
      'Password should be at least 6 characters': 'Пароль должен быть минимум 6 символов',
      'Email rate limit exceeded': 'Слишком много попыток. Подождите несколько минут',
      'For security purposes, you can only request this once every 60 seconds': 'Подождите 60 секунд перед повторной попыткой',
      'New password should be different from the old password.': 'Новый пароль должен отличаться от текущего',
      'User not found': 'Пользователь не найден',
      'Email not confirmed': 'Email не подтверждён. Проверьте почту',
    };
    for (const [en, ru] of Object.entries(map)) {
      if (msg.includes(en)) return ru;
    }
    // Fallback: if message is in English, show generic
    if (msg.includes('Load failed') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз';
    if (/^[a-zA-Z\s:.,!?]+$/.test(msg)) return 'Ошибка: ' + msg;
    return msg;
  };

  // ── Email Sign In ──
  const handleSignIn = async () => {
    if (!supabase) { onLogin('client', email, 'c1'); return; }
    setLoading(true); setError('');
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 11000));
      const auth = supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
      const { error: err } = await Promise.race([auth, timeout]);
      if (err) { setError(ruError(err.message)); setLoading(false); }
    } catch(e) {
      setLoading(false);
      if (e.message === 'timeout') setError('Сервер не отвечает. Проверьте интернет и попробуйте ещё раз');
      else setError('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз');
    }
  };

  // ── Email Sign Up ──
  const handleSignUp = async (role = 'client') => {
    if (!supabase) { onLogin(role, regName || regEmail, null); return; }
    if (pass !== pass2) { setError('Пароли не совпадают'); return; }
    if (pass.length < 6) { setError('Пароль должен быть минимум 6 символов'); return; }
    setLoading(true); setError('');
    try {
      const signUpEmail = role === 'doc' ? email.trim() : regEmail.trim();
      const { error: err } = await supabase.auth.signUp({
        email: signUpEmail, password: pass,
        options: { data: { name: regName || signUpEmail, role } }
      });
      if (err) { setError(ruError(err.message)); }
      else { setSuccess('Регистрация прошла успешно! Войдите с вашим email и паролем.'); }
    } catch(e) { setError('Ошибка подключения'); }
    setLoading(false);
  };

  // ── Doc Sign In (checks role after login) ──
  const handleDocSignIn = async () => {
    if (!supabase) { onLogin('doc', email.trim() || 'Специалист', null); return; }
    setLoading(true); setError('');
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (err) { setError(ruError(err.message)); setLoading(false); return; }
      // Check if user is actually a doc
      if (data?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        if (profile && profile.role !== 'doc') {
          setError('Этот аккаунт зарегистрирован как клиент. Используйте форму входа для клиентов.');
          await supabase.auth.signOut();
          setLoading(false);
        }
      }
    } catch(e) { setError('Ошибка подключения'); setLoading(false); }
  };

  // ── Reset Password ──
  const handleReset = async () => {
    if (!supabase) { setError('Сервис недоступен'); return; }
    if (!email.trim()) { setError('Введите email'); return; }
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/reset-password'
      });
      if (err) { setError(ruError(err.message)); }
      else { setSuccess('Ссылка для сброса пароля отправлена на ' + email.trim()); }
    } catch(e) { setError('Ошибка подключения'); }
    setLoading(false);
  };

  // ── OAuth: Google (via Supabase built-in) ──
  const handleGoogle = async () => {
    if (!supabase) return;
    const isDocMode = mode === 'doc' || mode === 'docReg';
    const params = new URLSearchParams(window.location.search);
    const inv = params.get('invite');
    if (inv) localStorage.setItem('ellme_invite', inv);
    setOauthLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + (isDocMode ? '/?oauth_role=doc' : '/') }
    });
  };

  // ── OAuth: Yandex (via server route) ──
  const handleYandex = () => {
    const clientId = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_YANDEX_CLIENT_ID : null;
    if (!clientId) { setError('Яндекс ID не настроен'); return; }
    const isDocMode = mode === 'doc' || mode === 'docReg';
    const params = new URLSearchParams(window.location.search);
    const inv = params.get('invite');
    if (inv) localStorage.setItem('ellme_invite', inv);
    setOauthLoading(true);
    const redir = encodeURIComponent(window.location.origin + '/auth/yandex/callback');
    window.location.href = 'https://oauth.yandex.ru/authorize?response_type=code&client_id=' + clientId + '&redirect_uri=' + redir + '&state=' + (isDocMode ? 'doc' : 'client');
  };

  // ── OAuth Buttons (compact icon style like Everfit) ──
  const OAuthIcons = () => <div style={{display:'flex',justifyContent:'center',gap:12}}>
    <button onClick={handleYandex} style={{width:48,height:48,borderRadius:'50%',border:`1.5px solid ${C.tileBorder}`,background:C.surface,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}
      onMouseOver={e=>{e.currentTarget.style.borderColor='#FC3F1D';e.currentTarget.style.transform='scale(1.08)'}}
      onMouseOut={e=>{e.currentTarget.style.borderColor=C.tileBorder;e.currentTarget.style.transform='none'}}>
      <svg width="22" height="22" viewBox="0 0 24 24"><text x="12" y="18" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="20" fontWeight="600" fill="#FC3F1D">Я</text></svg>
    </button>
    <button onClick={handleGoogle} style={{width:48,height:48,borderRadius:'50%',border:`1.5px solid ${C.tileBorder}`,background:C.surface,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}
      onMouseOver={e=>{e.currentTarget.style.borderColor='#4285F4';e.currentTarget.style.transform='scale(1.08)'}}
      onMouseOut={e=>{e.currentTarget.style.borderColor=C.tileBorder;e.currentTarget.style.transform='none'}}>
      <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
    </button>
  </div>;

  // ── Divider ──
  const Divider = ({text}) => <div style={{position:'relative',textAlign:'center',margin:'20px 0'}}>
    <div style={{position:'absolute',top:'50%',left:0,right:0,height:1,background:C.tileBorder}}/>
    <span style={{position:'relative',background:C.bg,padding:'0 16px',fontSize:12,color:C.muted,letterSpacing:'.02em'}}>{text}</span>
  </div>;

  // ── Logo ──
  const Logo = () => <div style={{textAlign:'center',marginBottom:36}}>
    <div style={{fontSize:40,fontWeight:700,fontFamily:'var(--fd)',letterSpacing:'.08em',color:C.text}}>ELLME</div>
    <div style={{fontSize:10,color:C.muted,letterSpacing:'.18em',textTransform:'uppercase',marginTop:6}}>Eat Live Love ME</div>
  </div>;

  return <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.bg,padding:'40px 24px'}}>
    {/* OAuth loading overlay */}
    {oauthLoading&&<div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:C.bg,animation:'fadeIn .2s'}}>
      <ProgressBar duration={4} label="Идёт загрузка, это может занять несколько секунд..."/>
    </div>}
    <div style={{width:'100%',maxWidth:400,margin:'0 auto',opacity:show?1:0,transform:show?'none':'translateY(16px)',transition:'all .7s cubic-bezier(.16,1,.3,1)'}}>

      {mode==='auth'&&<>
        <Logo/>
        {errBox}{sucBox}

        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={inputStyle} onFocus={onFB} onBlur={offFB}/>
        {passInput(pass,setPass,'Пароль',showP1,setShowP1,{onKeyDown:e=>{if(e.key==='Enter')handleSignIn()}})}
        <div style={{textAlign:'right',marginTop:-6,marginBottom:16}}>
          <button onClick={()=>{setMode('reset');setError('');setSuccess('')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:C.accent,fontFamily:'inherit',padding:0,fontWeight:500}}>Забыли пароль?</button>
        </div>
        <button disabled={loading} onClick={handleSignIn} style={{width:'100%',padding:'16px',borderRadius:16,border:'none',background:C.accent,color:'#fff',fontSize:16,fontWeight:600,cursor:loading?'wait':'pointer',fontFamily:'inherit',marginBottom:4,transition:'all .2s',boxShadow:'0 4px 16px rgba(45,95,63,.2)',opacity:loading?.7:1}}>
          {loading?'Вхожу...':'Войти'}
        </button>

        <Divider text="или войти через"/>
        <OAuthIcons/>

        <div style={{textAlign:'center',marginTop:28}}>
          <button onClick={()=>{setMode('register');setError('');setSuccess('')}} style={{width:'100%',padding:'14px',borderRadius:16,border:`1.5px solid ${C.tileBorder}`,background:'transparent',color:C.text,fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all .2s'}}
            onMouseOver={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent}}
            onMouseOut={e=>{e.currentTarget.style.borderColor=C.tileBorder;e.currentTarget.style.color=C.text}}>
            Зарегистрироваться
          </button>
        </div>
        <div style={{textAlign:'center',marginTop:16}}>
          <button onClick={()=>{setMode('doc');setError('');setSuccess('')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:C.muted,fontFamily:'inherit'}}>Вход для нутрициолога →</button>
        </div>
      </>}

      {mode==='register'&&<div style={{animation:'enter .3s'}}>
        <Logo/>
        <h2 style={{fontFamily:'var(--fd)',fontSize:22,fontWeight:400,textAlign:'center',marginBottom:6,marginTop:-16}}>Создайте аккаунт</h2>
        <p style={{textAlign:'center',fontSize:13,color:C.muted,marginBottom:24}}>Введите данные для регистрации</p>
        {errBox}{sucBox}
        {!success&&<>
          <input value={regName} onChange={e=>setRegName(e.target.value)} placeholder="Имя и фамилия" style={inputStyle} onFocus={onFB} onBlur={offFB}/>
          <input value={regEmail} onChange={e=>setRegEmail(e.target.value)} placeholder="Email" type="email" style={inputStyle} onFocus={onFB} onBlur={offFB}/>
          {passInput(pass,setPass,'Пароль (мин. 6 символов)',showP1,setShowP1)}
          {passInput(pass2,setPass2,'Повторите пароль',showP2,setShowP2)}
          <button disabled={loading} onClick={()=>{if(!consent){setError('Подтвердите согласие');return;}handleSignUp('client')}} style={{width:'100%',padding:'16px',borderRadius:16,border:'none',background:C.accent,color:'#fff',fontSize:16,fontWeight:600,cursor:loading?'wait':'pointer',fontFamily:'inherit',marginBottom:10,opacity:loading?.7:1,boxShadow:'0 4px 16px rgba(45,95,63,.2)'}}>
            {loading?'Создаю аккаунт...':'Зарегистрироваться'}
          </button>
          <label style={{display:'flex',gap:10,alignItems:'flex-start',cursor:'pointer',fontSize:11,color:C.muted,lineHeight:1.5}}>
            <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} style={{marginTop:2,accentColor:C.accent,width:16,height:16,flexShrink:0}}/>
            <span>Продолжая, вы соглашаетесь с <a href="/privacy" target="_blank" style={{color:C.accent}}>Политикой конфиденциальности</a> и <a href="/terms" target="_blank" style={{color:C.accent}}>Условиями использования</a></span>
          </label>
          <Divider text="или"/>
          <OAuthIcons/>
        </>}
        <div style={{textAlign:'center',marginTop:20}}>
          <span style={{fontSize:14,color:C.muted}}>Уже есть аккаунт? </span>
          <button onClick={()=>{setMode('auth');setError('');setSuccess('')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:14,color:C.accent,fontFamily:'inherit',fontWeight:600}}>Войти</button>
        </div>
      </div>}

      {mode==='reset'&&<div style={{animation:'enter .3s'}}>
        <h1 style={{fontFamily:'var(--fd)',fontSize:28,fontWeight:400,textAlign:'center',marginBottom:8}}>Восстановление пароля</h1>
        <p style={{textAlign:'center',fontSize:13,color:C.muted,marginBottom:24}}>Введите email — мы отправим ссылку для сброса</p>
        {errBox}{sucBox}
        {!success&&<>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Ваш email" type="email" style={inputStyle} onFocus={onFB} onBlur={offFB}
            onKeyDown={e=>{if(e.key==='Enter')handleReset()}}/>
          <button disabled={loading} onClick={handleReset} style={{width:'100%',padding:'16px',borderRadius:16,border:'none',background:email.trim()?C.text:'#ccc',color:'#fff',fontSize:16,fontWeight:600,cursor:loading?'wait':'pointer',fontFamily:'inherit',marginBottom:12,opacity:loading?.7:1}}>
            {loading?'Отправляю...':'Отправить ссылку'}
          </button>
        </>}
        <button onClick={()=>{setMode('auth');setError('');setSuccess('')}} style={{width:'100%',padding:'12px',border:'none',background:'transparent',color:C.accent,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>Назад</button>
      </div>}

      {mode==='doc'&&<div style={{animation:'enter .3s'}}>
        <Logo/>
        <h2 style={{fontFamily:'var(--fd)',fontSize:22,fontWeight:400,textAlign:'center',marginBottom:4,marginTop:-16}}>Кабинет специалиста</h2>
        <p style={{textAlign:'center',fontSize:13,color:C.muted,marginBottom:24}}>Вход для нутрициолога</p>
        {errBox}{sucBox}
        <input placeholder="Email" type="email" style={inputStyle} value={email} onChange={e=>setEmail(e.target.value)} onFocus={onFB} onBlur={offFB}/>
        {passInput(pass,setPass,'Пароль',showP1,setShowP1,{onKeyDown:e=>{if(e.key==='Enter')handleDocSignIn()}})}
        <div style={{textAlign:'right',marginTop:-6,marginBottom:16}}>
          <button onClick={()=>{setMode('reset');setError('');setSuccess('')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:C.accent,fontFamily:'inherit',padding:0,fontWeight:500}}>Забыли пароль?</button>
        </div>
        <button disabled={loading} onClick={handleDocSignIn} style={{width:'100%',padding:'16px',borderRadius:16,border:'none',background:C.accent,color:'#fff',fontSize:16,fontWeight:600,cursor:loading?'wait':'pointer',fontFamily:'inherit',marginBottom:12,boxShadow:'0 4px 16px rgba(45,95,63,.2)',opacity:loading?.7:1}}>
          {loading?'Вхожу...':'Войти'}
        </button>
        <Divider text="или"/>
        <OAuthIcons/>
        <div style={{textAlign:'center',marginTop:20}}>
          <button onClick={()=>{setMode('docReg');setError('');setSuccess('')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:14,color:C.accent,fontFamily:'inherit',fontWeight:600}}>Регистрация специалиста</button>
        </div>
        <div style={{textAlign:'center',marginTop:10}}>
          <button onClick={()=>{setMode('auth');setError('');setSuccess('')}} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:C.muted,fontFamily:'inherit'}}>← Назад</button>
        </div>
      </div>}

      {mode==='docReg'&&<div style={{animation:'enter .3s'}}>
        <h1 style={{fontFamily:'var(--fd)',fontSize:28,fontWeight:400,textAlign:'center',marginBottom:8}}>Регистрация специалиста</h1>
        <p style={{textAlign:'center',fontSize:13,color:C.muted,marginBottom:24}}>Кабинет нутрициолога</p>
        {errBox}{sucBox}
        {!success&&<>
          <input value={regName} onChange={e=>setRegName(e.target.value)} placeholder="Имя и фамилия" style={inputStyle} onFocus={onFB} onBlur={offFB}/>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={inputStyle} onFocus={onFB} onBlur={offFB}/>
          {passInput(pass,setPass,'Пароль (мин. 6 символов)',showP1,setShowP1)}
          {passInput(pass2,setPass2,'Повторите пароль',showP2,setShowP2)}
          <button disabled={loading} onClick={()=>handleSignUp('doc')} style={{width:'100%',padding:'16px',borderRadius:16,border:'none',background:C.accent,color:'#fff',fontSize:16,fontWeight:600,cursor:loading?'wait':'pointer',fontFamily:'inherit',marginBottom:12,opacity:loading?.7:1}}>
            {loading?'Создаю...':'Создать аккаунт специалиста'}
          </button>
        </>}
        <button onClick={()=>{setMode('doc');setError('');setSuccess('')}} style={{width:'100%',padding:'12px',border:'none',background:'transparent',color:C.accent,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>
          {success?'Перейти ко входу':'Назад'}
        </button>
      </div>}
    </div>
  </div>;
}

// ═══ MAIN APP ═══
export default function App(){
  const[user,setUser]=useState(null);
  const userRef=useRef(null);
  useEffect(()=>{userRef.current=user},[user]);
  const[authLoading,setAuthLoading]=useState(!!supabase);
  const[loadingPhase,setLoadingPhase]=useState('Идёт загрузка, это может занять несколько секунд...');
  const[isOffline,setIsOffline]=useState(typeof navigator!=='undefined'&&!navigator.onLine);
  const[showOnlineBanner,setShowOnlineBanner]=useState(false);
  useEffect(()=>{
    if(typeof window==='undefined')return;
    const goOff=()=>setIsOffline(true);
    const goOn=()=>{setIsOffline(false);setShowOnlineBanner(true);setTimeout(()=>setShowOnlineBanner(false),3000)};
    window.addEventListener('offline',goOff);
    window.addEventListener('online',goOn);
    return()=>{window.removeEventListener('offline',goOff);window.removeEventListener('online',goOn)};
  },[]);
  const[diaries,setDiaries]=useState({});
  const[goalDays,setGoalDays]=useState({}); // {dateStr: true/false}
  const[comments,setComments]=useState({});
  const[clients,setClients]=useState([]);
  const[date,setDate]=useState(new Date());
  const[lb,setLb]=useState(null);

  // Navigation stack
  const[screen,setScreen]=useState('home');
  // Analytics state must be declared BEFORE the useEffect that uses
  // analyticsRange in its dependency array — otherwise its deps are
  // evaluated in the Temporal Dead Zone and the whole page crashes.
  const[analytics,setAnalytics]=useState(null);
  const[analyticsRange,setAnalyticsRange]=useState('7d');
  const[customDateRange,setCustomDateRange]=useState(null); // {start:'YYYY-MM-DD', end:'YYYY-MM-DD'}
  // Scroll to top on screen change
  useEffect(()=>{try{window.scrollTo({top:0,behavior:'instant'})}catch(e){try{window.scrollTo(0,0)}catch(e){}}},[screen]);

  // Pull-to-refresh (mobile)
  const[pullDist,setPullDist]=useState(0);
  const[refreshing,setRefreshing]=useState(false);
  const pullRef=useRef(0);
  useEffect(()=>{
    if(typeof window==='undefined')return;
    let startY=null;
    const threshold=70;
    const onTouchStart=(e)=>{
      if(window.scrollY>0||refreshing||modalOpenRef.current)return;
      startY=e.touches[0].clientY;
    };
    const onTouchMove=(e)=>{
      if(startY===null)return;
      const dy=e.touches[0].clientY-startY;
      if(dy>0&&window.scrollY<=0){
        const dist=Math.min(dy*0.5,120);
        pullRef.current=dist;
        setPullDist(dist);
      }else{
        pullRef.current=0;
        setPullDist(0);
      }
    };
    const onTouchEnd=()=>{
      if(pullRef.current>=threshold){
        setRefreshing(true);
        setPullDist(0);
        pullRef.current=0;
        startY=null;
        setTimeout(()=>{try{window.location.reload()}catch(e){}},200);
      }else{
        setPullDist(0);
        pullRef.current=0;
        startY=null;
      }
    };
    window.addEventListener('touchstart',onTouchStart,{passive:true});
    window.addEventListener('touchmove',onTouchMove,{passive:true});
    window.addEventListener('touchend',onTouchEnd,{passive:true});
    return()=>{
      window.removeEventListener('touchstart',onTouchStart);
      window.removeEventListener('touchmove',onTouchMove);
      window.removeEventListener('touchend',onTouchEnd);
    };
  },[]);// eslint-disable-line

  const[selMeal,setSelMeal]=useState(null);
  const[selClient,setSelClient]=useState(null);
  const[docTab,setDocTab]=useState('active');
  const[docComment,setDocComment]=useState('');
  const[showNotif,setShowNotif]=useState(false);
  const[docUnread,setDocUnread]=useState(0);
  const[clientUnread,setClientUnread]=useState(0);
  // Unread chat messages (kind='comment' only, for the chat-icon badge)
  const[clientChatUnread,setClientChatUnread]=useState(0);
  // Per-client unread count for the doc, keyed by client_id
  const[docChatUnreadByClient,setDocChatUnreadByClient]=useState({});
  const[inv,setInv]=useState(false);
  const[invCode,setInvCode]=useState('');
  const[copied,setCopied]=useState(false);
  // Chat modal: {clientId, docId, clientName, tagDate} | null
  const[chatModal,setChatModal]=useState(null);
  // Doc-side chat list (list of all chats with clients)
  const[showChatList,setShowChatList]=useState(false);
  // Ref so the pull-to-refresh handler (stale closure on window) can
  // check whether a fixed overlay is open and skip the refresh.
  // IMPORTANT: showChatList must be declared ABOVE this useEffect — its
  // deps array is evaluated immediately and hits TDZ otherwise.
  const modalOpenRef=useRef(false);
  useEffect(()=>{modalOpenRef.current=!!(chatModal||showChatList||screen==='analytics'||screen==='clientAnalytics')},[chatModal,showChatList,screen]);
  // When the user clicks a day-tag in the chat, we close the modal,
  // navigate to that day, and remember the chat context here so a
  // floating "back to chat" button can reopen it.
  const[returnToChat,setReturnToChat]=useState(null);

  // ═══ SAVE TIMERS (per-pid to avoid cross-client data loss) ═══
  const saveTimers=useRef({});

  // Load analytics when screen switches to 'analytics' (own) or
  // 'clientAnalytics' (viewing a client). Placed HERE after all
  // useState declarations to avoid Temporal Dead Zone crashes — the
  // deps array references selClient which is declared above.
  useEffect(() => {
    const isOwn = screen === 'analytics';
    const isClient = screen === 'clientAnalytics';
    if (!isOwn && !isClient) return;
    const targetId = isClient ? selClient?.id : user?.id;
    if (!targetId || !supabase) return;
    let cancelled = false;
    setAnalytics({ range: analyticsRange, days: [], meals: [], loading: true });
    (async () => {
      try {
        let startStr, endStr;
        if (analyticsRange === 'custom' && customDateRange) {
          startStr = customDateRange.start;
          endStr = customDateRange.end;
        } else {
          const daysBack = analyticsRange === '3d' ? 3 : analyticsRange === '5d' ? 5 : analyticsRange === '1m' ? 30 : 7;
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - daysBack + 1);
          startStr = dk(start);
          endStr = dk(end);
        }
        const { data: days, error: dayErr } = await supabase.from('diary_days')
          .select('*').eq('user_id', targetId).gte('date', startStr).lte('date', endStr)
          .order('date', { ascending: true });
        if (dayErr) console.error('analytics days error:', dayErr);
        const dayIds = (days || []).map(d => d.id).filter(Boolean);
        let meals = [];
        if (dayIds.length) {
          const { data: m, error: mealErr } = await supabase.from('meals')
            .select('diary_day_id,meal_type,time,liked').in('diary_day_id', dayIds);
          if (mealErr) console.error('analytics meals error:', mealErr);
          meals = m || [];
        }
        if (!cancelled) setAnalytics({ range: analyticsRange, days: days || [], meals, loading: false });
      } catch (e) {
        console.error('analytics load error:', e);
        if (!cancelled) setAnalytics({ range: analyticsRange, days: [], meals: [], loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, [screen, analyticsRange, user?.id, selClient?.id, customDateRange?.start, customDateRange?.end]);

  // Create invite and save to DB
  const createInvite=async()=>{
    const code=Math.random().toString(36).slice(2,8);
    setInvCode(code);
    setInv(true);
    if(supabase&&user?.id){
      const{error:invErr}=await supabase.from('invites').insert({doc_id:user.id,code,used:false});
      if(invErr)console.error('Invite insert error:',invErr);
    }
  };

  // Load doc's clients from DB
  const loadClients=async()=>{
    if(!supabase||!user?.id||user.role!=='doc')return;
    const{data:links}=await supabase.from('doc_clients').select('*,profiles!doc_clients_client_id_fkey(id,name,email,age,request,photo_url,last_seen,weekly_goal,weekly_goal_days,created_at)').eq('doc_id',user.id);
    if(links&&links.length>0){
      const now=Date.now();
      const cls=links.map(l=>{
        const ls=l.profiles?.last_seen;
        const isOnline=ls&&(now-new Date(ls).getTime())<300000; // 5 min
        return {
          id:l.client_id,
          name:l.profiles?.name||l.profiles?.email||'Клиент',
          email:l.profiles?.email,
          age:l.profiles?.age,
          photo:l.profiles?.photo_url||null,
          request:l.profiles?.request||'',
          nick:l.nick||'',
          status:l.status||'active',
          joined:new Date(l.profiles?.created_at||l.created_at),
          lastSeen:ls||null,
          isOnline:!!isOnline,
          weeklyGoal:l.profiles?.weekly_goal||null,
          weeklyGoalDays:l.profiles?.weekly_goal_days||7,
        };
      });
      setClients(cls);
    } else {
      setClients([]);
    }
  };

  // Load clients when doc logs in + realtime subscription
  useEffect(()=>{
    if(user?.role!=='doc'||!supabase)return;
    loadClients();
    const channel=supabase.channel('doc_updates_'+user.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'doc_clients',filter:'doc_id=eq.'+user.id},()=>loadClients())
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'doc_clients',filter:'doc_id=eq.'+user.id},()=>loadClients())
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'doc_clients',filter:'doc_id=eq.'+user.id},()=>loadClients())
      .subscribe();
    // Poll client list every 30s to refresh online status
    const poll=setInterval(loadClients,30000);
    return()=>{supabase.removeChannel(channel);clearInterval(poll)};
  },[user?.id,user?.role]);

  // Heartbeat: update last_seen every 2 min
  useEffect(()=>{
    if(!supabase||!user?.id)return;
    const ping=()=>supabase.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id).then(()=>{});
    ping();
    const iv=setInterval(ping,120000);
    return()=>clearInterval(iv);
  },[user?.id]);

  // Load weekly goal day completions
  useEffect(()=>{
    if(!supabase||!user?.id||!user?.weeklyGoal)return;
    (async()=>{
      try{
        const{data}=await supabase.from('diary_days').select('date,goal_done').eq('user_id',user.id).eq('goal_done',true);
        if(data){
          const done={};
          data.forEach(d=>{done[d.date]=true});
          setGoalDays(done);
        }
      }catch(e){}
    })();
  },[user?.id,user?.weeklyGoal]);

  // Toggle goal day completion
  const toggleGoalDay=async(dateStr,done)=>{
    setGoalDays(p=>({...p,[dateStr]:done}));
    if(done)setCelebration('goal');
    if(!supabase||!user?.id)return;
    try{
      await supabase.from('diary_days').upsert({user_id:user.id,date:dateStr,goal_done:done},{onConflict:'user_id,date'});
    }catch(e){console.error('toggleGoalDay:',e)}
  };

  // Doc unread count (notifications from clients). Loaded once + realtime.
  useEffect(()=>{
    if(!supabase||user?.role!=='doc'||!user?.id)return;
    let mounted=true;
    const loadCount=async()=>{
      try{
        const{count}=await supabase.from('doc_comments')
          .select('id',{count:'exact',head:true})
          .eq('doc_id',user.id)
          .eq('read',false)
          .neq('sender_id',user.id);
        if(mounted)setDocUnread(count||0);
        // Also load per-client chat unread (kind='comment') so we can show a
        // badge on the chat icon when the doc is inside a specific client.
        const{data:rows}=await supabase.from('doc_comments')
          .select('client_id')
          .eq('doc_id',user.id)
          .eq('read',false)
          .eq('kind','comment')
          .neq('sender_id',user.id);
        if(mounted){
          const map={};
          (rows||[]).forEach(r=>{map[r.client_id]=(map[r.client_id]||0)+1});
          setDocChatUnreadByClient(map);
        }
      }catch(e){}
    };
    loadCount();
    const ch=supabase.channel('doc_unread_'+user.id)
      .on('postgres_changes',{event:'*',schema:'public',table:'doc_comments',filter:'doc_id=eq.'+user.id},()=>loadCount())
      .subscribe();
    return()=>{mounted=false;try{supabase.removeChannel(ch);}catch(e){}};
  },[user?.id,user?.role]);

  // Client unread count. Loaded once + realtime.
  useEffect(()=>{
    if(!supabase||user?.role==='doc'||!user?.id)return;
    let mounted=true;
    const loadCount=async()=>{
      try{
        const{count}=await supabase.from('doc_comments')
          .select('id',{count:'exact',head:true})
          .eq('client_id',user.id)
          .eq('read',false)
          .neq('sender_id',user.id);
        if(mounted)setClientUnread(count||0);
        // Chat-only unread (kind='comment')
        const{count:chatCount}=await supabase.from('doc_comments')
          .select('id',{count:'exact',head:true})
          .eq('client_id',user.id)
          .eq('read',false)
          .eq('kind','comment')
          .neq('sender_id',user.id);
        if(mounted)setClientChatUnread(chatCount||0);
      }catch(e){}
    };
    loadCount();
    const ch=supabase.channel('client_unread_'+user.id)
      .on('postgres_changes',{event:'*',schema:'public',table:'doc_comments',filter:'client_id=eq.'+user.id},()=>loadCount())
      .subscribe();
    return()=>{mounted=false;try{supabase.removeChannel(ch);}catch(e){}};
  },[user?.id,user?.role]);

  const[renaming,setRenaming]=useState(null);
  const[renameVal,setRenameVal]=useState('');
  const[profilePhoto,setProfilePhoto]=useState(null);
  useEffect(()=>{try{const p=localStorage.getItem('ellme_photo');if(p)setProfilePhoto(p)}catch(e){}},[]);
  const updatePhoto=(url)=>{setProfilePhoto(url);try{if(url)localStorage.setItem('ellme_photo',url);else localStorage.removeItem('ellme_photo')}catch(e){}};
  const[waterNorm,setWaterNorm]=useState(2200);
  const[celebration,setCelebration]=useState(null);
  const[clientMenu,setClientMenu]=useState(null);
  const[clientProfileData,setClientProfileData]=useState(null); // client id for open menu

  // Persist invite code + detect recovery redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const invite = params.get('invite');
      if (invite) {
        try { localStorage.setItem('ellme_invite', invite); } catch(e) {}
      }
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        window.location.replace('/reset-password' + hash);
      }
    }
  }, []);

  // ── Supabase auth listener ──
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }

    // Capture oauth_role from URL NOW, before replaceState cleans it
    const _oauthRole = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('oauth_role') : null;

    const loadProfile = async (session) => {
      if (!session?.user) {
        // If user was already logged in — don't clear (temporary network loss)
        if (userRef.current) { console.warn('Session lost but keeping cached user (offline?)'); setAuthLoading(false); return; }
        setUser(null); setAuthLoading(false); return;
      }
      try {
      setLoadingPhase('Загружаем профиль...');
      const u = session.user;
      const authEmail = u.email || u.user_metadata?.email || '';
      const authName = u.user_metadata?.name || u.user_metadata?.full_name || authEmail.split('@')[0] || '';
      const authRole = u.user_metadata?.role || 'client';

      // Load or create profile
      let { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();

      if (!profile) {
        // Profile trigger may not have fired yet, create manually
        await supabase.from('profiles').upsert({ id: u.id, role: authRole, name: authName, email: authEmail });
        profile = { id: u.id, role: authRole, name: authName, email: authEmail, water_norm: 2200 };
      }

      // Update email in profile if it was empty (OAuth login)
      if (authEmail && !profile.email) {
        await supabase.from('profiles').update({ email: authEmail, name: authName || profile.name }).eq('id', u.id);
        profile.email = authEmail;
        if (authName) profile.name = authName;
      }

      // Check if OAuth login was intended as doc registration (Google passes via URL, Yandex via server)
      if (_oauthRole === 'doc' && profile.role === 'client') {
        await supabase.from('profiles').update({ role: 'doc' }).eq('id', u.id);
        profile.role = 'doc';
      }

      setLoadingPhase('Настраиваем аккаунт...');
      setUser({ id: u.id, role: profile.role || authRole, name: profile.name || authName, email: profile.email || authEmail, cid: u.id, waterNorm: profile.water_norm || 2200, weeklyGoal: profile.weekly_goal || null, weeklyGoalDays: profile.weekly_goal_days || 7, weeklyGoalSetBy: profile.weekly_goal_set_by || null, weeklyGoalStarted: profile.weekly_goal_started_at || null });
      setWaterNorm(profile.water_norm || 2200);
      if (profile.photo_url) updatePhoto(profile.photo_url);

      // Handle invite linking — if client registered via invite link
      // Check both URL params and localStorage (OAuth redirect loses URL params)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        let inviteCode = params.get('invite');
        if (!inviteCode) {
          try { inviteCode = localStorage.getItem('ellme_invite'); } catch(e) {}
        }
        if (inviteCode && (profile.role || authRole) === 'client') {
          setLoadingPhase('Привязываем нутрициолога...');
          try {
            const { data: inv } = await supabase.from('invites').select('*').eq('code', inviteCode).eq('used', false).maybeSingle();
            if (inv) {
              const { data: existing } = await supabase.from('doc_clients').select('id').eq('doc_id', inv.doc_id).eq('client_id', u.id).maybeSingle();
              if (!existing) {
                await supabase.from('doc_clients').insert({ doc_id: inv.doc_id, client_id: u.id, status: 'active' });
              }
              await supabase.from('invites').update({ used: true, used_by: u.id }).eq('id', inv.id);
            }
          } catch(e) { console.error('Invite linking error:', e); }
          try { localStorage.removeItem('ellme_invite'); } catch(e) {}
          window.history.replaceState({}, '', '/');
        }
      }

      setLoadingPhase('Почти готово...');
      setAuthLoading(false);
      } catch(e) { console.error('loadProfile error:', e); setUser(null); setAuthLoading(false); }
    };

    // Проверяем hash — если в URL есть access_token (после Яндекс OAuth), устанавливаем сессию
    const hash2 = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash2.includes('access_token=')) {
      setLoadingPhase('Проверяем авторизацию...');
      const params = new URLSearchParams(hash2.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ data, error }) => {
          window.history.replaceState({}, '', '/');
          if (error || !data?.session) {
            setUser(null);
            setAuthLoading(false);
            return;
          }
          loadProfile(data.session);
        }).catch(() => {
          window.history.replaceState({}, '', '/');
          setUser(null);
          setAuthLoading(false);
        });
      } else {
        setAuthLoading(false);
      }
    } else {
      supabase.auth.getSession().then(({ data }) => loadProfile(data?.session)).catch(() => {
        // Network error on initial load — if user was cached, keep them
        if (userRef.current) { setAuthLoading(false); return; }
        setUser(null); setAuthLoading(false);
      });
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Explicit sign out — always clear user
        userRef.current = null;
        setUser(null);
        setAuthLoading(false);
        return;
      }
      if (event !== 'INITIAL_SESSION') loadProfile(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Database: load day ──
  const loadDayFromDb = async (pid, dateStr) => {
    if (!supabase || !pid) return null;
    try {
      const { data: day } = await supabase.from('diary_days').select('*').eq('user_id', pid).eq('date', dateStr).maybeSingle();
      if (!day) return {};
      // Load meals for this day
      const { data: mealRows } = await supabase.from('meals').select('*').eq('diary_day_id', day.id);
      const meals = {};
      (mealRows || []).forEach(m => {
        // Parse photo_url: could be single URL string or JSON array
        let parsedPhoto = null;
        if (m.photo_url) {
          if (m.photo_url.startsWith('[')) { try { parsedPhoto = JSON.parse(m.photo_url); } catch(e) { parsedPhoto = [m.photo_url]; } }
          else { parsedPhoto = [m.photo_url]; }
        }
        meals[m.meal_type] = { time: m.time, hunger: m.hunger, text: m.description, feeling: m.feeling, feelingNote: m.feeling_note, photo: parsedPhoto, liked: !!m.liked };
      });
      return {
        meals, water: day.water_ml || 0, supplements: day.supplements || '',
        sleep: { wake: day.sleep_wake, bed: day.sleep_bed, quality: day.sleep_quality },
        movement: day.movement || '',
        stress: { level: day.stress_level, practices: day.stress_practices || '' },
        stoolState: day.stool_state, stoolNote: day.stool_note || '',
        well: { energy: day.energy, mood: day.mood, comment: day.day_comment || '' },
        _dayId: day.id,
      };
    } catch(e) { return {}; }
  };

  // ── Database: save day ──
  const saveDayToDb = async (pid, dateStr, dayData) => {
    if (!supabase || !pid) return;
    try {
      const payload = {
        user_id: pid, date: dateStr,
        water_ml: dayData.water || 0, supplements: dayData.supplements || '',
        sleep_wake: dayData.sleep?.wake || null, sleep_bed: dayData.sleep?.bed || null, sleep_quality: dayData.sleep?.quality || null,
        movement: dayData.movement || '',
        stress_level: dayData.stress?.level || null, stress_practices: dayData.stress?.practices || '',
        stool_state: dayData.stoolState || null, stool_note: dayData.stoolNote || '',
        energy: dayData.well?.energy || null, mood: dayData.well?.mood != null ? dayData.well.mood : null,
        day_comment: dayData.well?.comment || '',
        updated_at: new Date().toISOString(),
      };
      const { data: day } = await supabase.from('diary_days').upsert(payload, { onConflict: 'user_id,date' }).select().single();
      if (!day) return;
      // Save meals
      const meals = dayData.meals || {};
      for (const mealType of Object.keys(meals)) {
        const m = meals[mealType];
        if (!m) continue;
        await supabase.from('meals').upsert({
          diary_day_id: day.id, meal_type: mealType,
          time: m.time || null, hunger: m.hunger || null,
          description: m.text || '', feeling: m.feeling || null,
          feeling_note: m.feelingNote || '', photo_url: m.photo ? (Array.isArray(m.photo) ? JSON.stringify(m.photo) : m.photo) : null,
          liked: !!m.liked,
        }, { onConflict: 'diary_day_id,meal_type' });
      }
    } catch(e) { console.error('Save error:', e); }
  };

  // Derived state — must be declared before useEffects that reference it
  const isDoc=user?.role==='doc';

  // ── Load day data on date change ──
  useEffect(() => {
    if (!user?.id || !supabase) return;
    const pid = isDoc ? (screen === 'myDiary' || screen === 'myMealDetail' ? user.id : selClient?.id) : user.id;
    if (!pid) return;
    const dateStr = dk(date);
    loadDayFromDb(pid, dateStr).then(data => {
      if (data && Object.keys(data).length > 0) {
        setDiaries(p => {
          const updated = Object.assign({}, p);
          if (!updated[pid]) updated[pid] = {};
          updated[pid][dateStr] = data;
          return updated;
        });
      }
    });
  }, [date, user?.id, screen, selClient?.id]);

  // ═══ PHOTO UPLOAD TO STORAGE ═══
  const uploadMealPhoto = async (pid, dateStr, mealId, file) => {
    if (!supabase || !pid) {
      // Fallback: return data URL for dev mode
      return new Promise((resolve) => {
        const r = new FileReader();
        r.onload = ev => resolve(ev.target.result);
        r.readAsDataURL(file);
      });
    }
    // Compress image before upload (max 1200px, quality 0.80)
    const compressed = await compressImage(file, 1200, 0.80);
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const path = `${pid}/meals/${dateStr}/${mealId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('photos').upload(path, compressed, {
      upsert: true,
      contentType: compressed.type || 'image/jpeg',
    });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path);
    return urlData?.publicUrl ? urlData.publicUrl + '?t=' + Date.now() : null;
  };

  // ═══ BEFOREUNLOAD — flush pending saves ═══
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Flush all pending save timers immediately
      Object.keys(saveTimers.current).forEach(timerKey => {
        clearTimeout(saveTimers.current[timerKey]);
        delete saveTimers.current[timerKey];
      });
      // Force-save current diary state
      if (!supabase || !user?.id) return;
      const pid = isDoc ? (screen === 'myDiary' || screen === 'myMealDetail' ? user.id : selClient?.id) : user.id;
      if (!pid) return;
      const dateStr = dk(date);
      const dayData = (diaries[pid] || {})[dateStr];
      if (dayData) {
        // Use sendBeacon for reliable save on tab close
        const payload = {
          user_id: pid, date: dateStr,
          water_ml: dayData.water || 0, supplements: dayData.supplements || '',
          sleep_wake: dayData.sleep?.wake || null, sleep_bed: dayData.sleep?.bed || null, sleep_quality: dayData.sleep?.quality || null,
          movement: dayData.movement || '',
          stress_level: dayData.stress?.level || null, stress_practices: dayData.stress?.practices || '',
          stool_state: dayData.stoolState || null, stool_note: dayData.stoolNote || '',
          energy: dayData.well?.energy || null, mood: dayData.well?.mood != null ? dayData.well.mood : null,
          day_comment: dayData.well?.comment || '',
          updated_at: new Date().toISOString(),
        };
        // sendBeacon with Supabase REST API
        const url = sbUrl + '/rest/v1/diary_days?on_conflict=user_id,date';
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        try {
          navigator.sendBeacon(url + '&apikey=' + sbKey, blob);
        } catch(e) {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user?.id, date, diaries, screen, selClient?.id]);

  const login = (r,n,c) => { setUser({role:r,name:n,cid:c}); setScreen('home'); };
  const logout = async () => {
    try { if (supabase) await supabase.auth.signOut(); } catch(e) {}
    try { localStorage.removeItem('ellme_photo'); } catch(e) {}
    setUser(null); setScreen('home'); setSelClient(null); setSelMeal(null);
    setDiaries({}); setComments({}); setClients([]);
    window.location.href = '/';
  };

  // ── Loading state ──
  if (authLoading) {
    return <><style>{CSS}</style><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg}}>
      <ProgressBar duration={4} label={loadingPhase}/>
    </div></>;
  }

  if(!user) return <><style>{CSS}</style><Login onLogin={login}/></>;
  const key=dk(date);
  const getDay=pid=>(diaries[pid]||{})[key]||{};
  const setDay=(pid,val)=>{
    setDiaries(p => {
      const updated = Object.assign({}, p);
      if (!updated[pid]) updated[pid] = {};
      updated[pid] = Object.assign({}, updated[pid]);
      updated[pid][key] = val;
      return updated;
    });
    // Auto-save to database with per-pid timer
    if (supabase && pid) {
      const timerKey = pid + ':' + key;
      if (saveTimers.current[timerKey]) clearTimeout(saveTimers.current[timerKey]);
      saveTimers.current[timerKey] = setTimeout(() => {
        saveDayToDb(pid, key, val);
        delete saveTimers.current[timerKey];
      }, 1500);
    }
  };

  const activePid=isDoc?(screen==='myDiary'||screen==='myMealDetail'?user.id:selClient?.id||null):(user?.id||user?.cid||'c1');
  const dis=isDoc&&screen==='clientView';
  const unread=isDoc?docUnread:clientUnread;

  const dayData=activePid?getDay(activePid):{};
  const meals=dayData.meals||{};

  // ═══ PHOTO UPLOAD CALLBACK for MealDetail ═══
  const handleUploadMealPhoto = async (file) => {
    if (!activePid) return null;
    return uploadMealPhoto(activePid, key, selMeal, file);
  };

  const doRename = () => {
    if (!renaming) return;
    setClients(p => p.map(x => x.id === renaming.id ? Object.assign({}, x, {nick: renameVal}) : x));
    setRenaming(null);
  };

  const updateMeal = (pid, mealId, val) => {
    const day = getDay(pid);
    const updatedMeals = Object.assign({}, day.meals || {});
    updatedMeals[mealId] = val;
    setDay(pid, Object.assign({}, day, { meals: updatedMeals }));
  };

  // Toggle like on meal (for doc) — persists to meals table via upsert
  // Bypasses setDay to avoid triggering auto-save of diary_days
  const toggleMealLike = async (pid, mealId) => {
    if (!supabase || !pid) return;
    const dateStr = dk(date);
    const cur = ((diaries[pid] || {})[dateStr] || {}).meals?.[mealId] || {};
    const newLiked = !cur.liked;
    // Optimistic local update
    setDiaries(p => {
      const next = Object.assign({}, p);
      const pidData = Object.assign({}, next[pid] || {});
      const day = Object.assign({}, pidData[dateStr] || {});
      const meals = Object.assign({}, day.meals || {});
      meals[mealId] = Object.assign({}, meals[mealId] || {}, { liked: newLiked });
      day.meals = meals;
      pidData[dateStr] = day;
      next[pid] = pidData;
      return next;
    });
    // Persist: find or create diary_day row, then upsert meals row
    try {
      let dayId = null;
      const { data: dayRow, error: selErr } = await supabase.from('diary_days').select('id').eq('user_id', pid).eq('date', dateStr).maybeSingle();
      if (selErr) { console.error('select diary_days error:', selErr); }
      if (dayRow) {
        dayId = dayRow.id;
      } else {
        // Create an empty diary_day row for the client so we can attach the like
        const { data: newDay, error: insErr } = await supabase.from('diary_days').insert({ user_id: pid, date: dateStr }).select('id').maybeSingle();
        if (insErr) { console.error('insert diary_days error:', insErr); return; }
        dayId = newDay?.id;
      }
      if (!dayId) return;
      // Upsert meals row with just the liked flag (preserves existing fields via on_conflict)
      const { error: upErr } = await supabase.from('meals').upsert({
        diary_day_id: dayId, meal_type: mealId, liked: newLiked,
      }, { onConflict: 'diary_day_id,meal_type' });
      if (upErr) console.error('upsert meals error:', upErr);
      // Create/remove notification for client
      if (isDoc && user?.id) {
        if (newLiked) {
          // Insert like notification for client
          await supabase.from('doc_comments').insert({
            doc_id: user.id,
            client_id: pid,
            sender_id: user.id,
            sender_name: user.name || '',
            date: dateStr,
            meal_type: mealId,
            kind: 'like',
            text: '',
            read: false,
          });
        } else {
          // Remove the like notification
          await supabase.from('doc_comments')
            .delete()
            .eq('doc_id', user.id)
            .eq('client_id', pid)
            .eq('date', dateStr)
            .eq('meal_type', mealId)
            .eq('kind', 'like');
        }
      }
    } catch (e) { console.error('toggleMealLike error:', e); }
  };

  const markRead = (cid, cmId) => {
    setComments(p => {
      const list = (p[cid]||[]).map(x => x.id === cmId ? Object.assign({}, x, {read: true}) : x);
      return Object.assign({}, p, {[cid]: list});
    });
  };

  const toggleArchive = (clientId) => {
    setClients(p => p.map(x => x.id === clientId ? Object.assign({}, x, {status: x.status === 'active' ? 'archive' : 'active'}) : x));
  };

  const deleteClient = (clientId) => {
    if (confirm('Удалить клиента? Это действие нельзя отменить.')) {
      setClients(p => p.filter(x => x.id !== clientId));
    }
    setClientMenu(null);
  };

  const sendComment = (clientId, dateKey, text) => {
    if(!text||!text.trim())return;
    const cm = {id:'cm'+Date.now(), date:dateKey, text:text.trim(), ts:Date.now(), read:false, senderId:user?.id, senderName:user?.name||''};
    setComments(p => {
      const list = [...(p[clientId]||[]), cm];
      return Object.assign({}, p, {[clientId]: list});
    });
    setDocComment('');
    // Persist to DB (fire-and-forget)
    if(supabase&&user?.id){
      const docId = isDoc ? user.id : null;
      if(isDoc){
        supabase.from('doc_comments').insert({doc_id:user.id,client_id:clientId,sender_id:user.id,sender_name:user.name||'',date:dateKey,text:text.trim(),read:false}).then(()=>{});
      }
    }
  };

  const typing=null;
  const sendTyping=()=>{};

  const goHome = () => { setScreen('home'); setSelMeal(null); setSelClient(null); };
  const openSupport = () => { window.open('https://t.me/ellme_support','_blank'); };

  // Upload a chat attachment to the `photos` bucket and return its public URL.
  // Images are compressed like meal photos; other files are uploaded as-is.
  const uploadChatAttachment = async (file) => {
    if (!supabase || !user?.id) return null;
    const safeName = (file.name || 'file').replace(/[^\w.\-]/g, '_');
    const ts = Date.now();
    const path = `${user.id}/chat/${ts}_${safeName}`;
    let body = file;
    let contentType = file.type || 'application/octet-stream';
    if (file.type && file.type.startsWith('image/')) {
      try {
        // Same hard economy as meal photos: max 1200px, 80% JPEG
        body = await compressImage(file, 1200, 0.80);
        contentType = body.type || 'image/jpeg';
      } catch (e) { /* fall back to original */ }
    }
    const { error } = await supabase.storage.from('photos').upload(path, body, { upsert: true, contentType });
    if (error) { console.error('chat upload:', error); return null; }
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path);
    return urlData?.publicUrl ? urlData.publicUrl + '?t=' + ts : null;
  };

  // Helper to open the chat modal with the given target.
  // Guards against null clientId (can happen on first render after page
  // reload when user state hasn't been restored yet from Supabase auth).
  const openChat = (targetClientId, targetClientName, targetDocId, tagDate) => {
    if (!targetClientId) return;
    setReturnToChat(null);
    setChatModal({
      clientId: targetClientId,
      docId: targetDocId || null,
      clientName: targetClientName || '',
      tagDate: tagDate || null,
    });
  };

  // Active tab for bottom bar
  const activeTab = (() => {
    if (chatModal || showChatList) return 'chat';
    if (screen === 'analytics' || screen === 'clientAnalytics') return 'analytics';
    if (screen === 'profile') return 'profile';
    return 'diary';
  })();

  const handleTabPress = (tab) => {
    // Always close chat modals when switching tabs
    if (tab !== 'chat') { setChatModal(null); setShowChatList(false); }
    if (tab === 'diary') { goHome(); }
    if (tab === 'analytics') {
      setAnalytics(null);
      setAnalyticsRange('7d');
      setScreen('analytics');
    }
    if (tab === 'chat') {
      if (isDoc) { setShowChatList(true); }
      else { openChat(user.id, user.name || 'Нутрициолог', null, null); }
    }
    if (tab === 'profile') { setScreen('profile'); }
  };

  const chatBadge = isDoc
    ? Object.values(docChatUnreadByClient).reduce((s, n) => s + n, 0)
    : clientChatUnread;

  const shell = ch => <div style={{minHeight:'100vh',background:C.bg,fontFamily:'var(--fb)',overscrollBehavior:'none'}}>
    <style>{CSS}</style>
    {/* Offline/online banner */}
    {isOffline&&<div style={{position:'fixed',top:0,left:0,right:0,zIndex:10002,background:'#FF9500',color:'#fff',textAlign:'center',padding:'6px 16px',fontSize:12,fontWeight:600,animation:'enter .2s'}}>Нет интернета · офлайн-режим</div>}
    {showOnlineBanner&&!isOffline&&<div style={{position:'fixed',top:0,left:0,right:0,zIndex:10002,background:'#34C759',color:'#fff',textAlign:'center',padding:'6px 16px',fontSize:12,fontWeight:600,animation:'enter .2s'}}>Подключено</div>}
    {/* Pull-to-refresh indicator */}
    {(pullDist>0||refreshing)&&<div style={{position:'fixed',top:0,left:0,right:0,display:'flex',alignItems:'center',justifyContent:'center',height:Math.max(pullDist,refreshing?60:0),pointerEvents:'none',zIndex:9999,transition:refreshing?'none':'height .1s'}}>
      <div style={{width:36,height:36,borderRadius:'50%',background:C.surface,boxShadow:'0 2px 12px rgba(0,0,0,.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transform:`rotate(${refreshing?360:Math.min(pullDist*3,360)}deg)`,transition:'transform .15s',animation:refreshing?'spin 1s linear infinite':'none'}}>
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
        </svg>
      </div>
    </div>}
    {lb && <Lightbox src={typeof lb==='string'?lb:null} photos={lb?.photos||null} initialIndex={lb?.index||0} onClose={()=>setLb(null)}/>}
    {celebration && <Celebration type={celebration} onClose={()=>setCelebration(null)}/>}
    {showChatList && user?.role==='doc' && <ChatListModal
      docId={user.id}
      clients={clients.filter(c=>c.status==='active')}
      unreadByClient={docChatUnreadByClient}
      onClose={()=>setShowChatList(false)}
      onOpenChat={(c)=>{setShowChatList(false);openChat(c.id, c.nick||c.name, user.id, null);}}
    />}
    {chatModal && <ChatModal
      clientId={chatModal.clientId}
      docId={chatModal.docId}
      currentUserId={user?.id}
      currentUserName={user?.name||''}
      clientName={chatModal.clientName}
      initialTagDate={chatModal.tagDate}
      onClose={()=>setChatModal(null)}
      uploadAttachment={uploadChatAttachment}
      onTagClick={(tagDate)=>{
        if(!tagDate)return;
        const ps=tagDate.split('-');
        if(ps.length>=3){
          const d=new Date(+ps[0],+ps[1]-1,+ps[2]);
          if(!isNaN(d))setDate(d);
        }
        // Remember how to reopen the chat from the day view
        setReturnToChat({
          clientId:chatModal.clientId,
          docId:chatModal.docId,
          clientName:chatModal.clientName,
          tagDate:tagDate,
        });
        setChatModal(null);
        // Make sure the right screen is visible (client stays on home;
        // doc needs to be on the specific client view)
        if(user?.role==='doc'){
          const cl=clients.find(c=>c.id===chatModal.clientId);
          if(cl){setSelClient(cl);setScreen('clientView');}
        }else{
          setScreen('home');setSelMeal(null);
        }
      }}
    />}
    {/* Floating "back to chat" button shown after navigating from a tag */}
    {returnToChat && !chatModal && <button
      onClick={()=>{setChatModal(returnToChat);setReturnToChat(null);}}
      style={{position:'fixed',right:16,bottom:'calc(76px + env(safe-area-inset-bottom))',zIndex:9998,background:C.accent,color:'#fff',border:'none',borderRadius:100,padding:'12px 18px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 6px 20px rgba(45,95,63,.35)',display:'flex',alignItems:'center',gap:8,animation:'enter .25s'}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 14l-4-4 4-4M5 10h11a4 4 0 014 4v0a4 4 0 01-4 4H9"/></svg>
      Вернуться в чат
    </button>}
    {renaming && <div style={{position:'fixed',inset:0,zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn .15s'}}>
      <div onClick={()=>setRenaming(null)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.25)',backdropFilter:'blur(4px)'}}/>
      <div style={{position:'relative',background:C.surface,borderRadius:24,padding:28,width:'min(400px,90vw)',boxShadow:C.shadowHover,animation:'scaleIn .25s cubic-bezier(.16,1,.3,1)'}}>
        <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--fd)',marginBottom:4}}>Переименовать</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Клиент не увидит. Настоящее имя: {renaming.name}</div>
        <input value={renameVal} onChange={e=>setRenameVal(e.target.value)} placeholder="Пометка для себя" autoFocus
          style={{width:'100%',padding:'14px 16px',borderRadius:14,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:C.surface,marginBottom:14}}
          onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.tileBorder}
          onKeyDown={e=>{if(e.key==='Enter') doRename()}}/>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setRenaming(null)} style={{flex:1,padding:'12px',borderRadius:14,border:'none',background:C.surfaceAlt,color:C.soft,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>Отмена</button>
          <button onClick={doRename} style={{flex:1,padding:'12px',borderRadius:14,border:'none',background:C.accent,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 2px 8px rgba(45,95,63,.2)'}}>Сохранить</button>
        </div>
      </div>
    </div>}
    {showNotif&&user&&<NotificationsPanel
      userId={user.id}
      userRole={user.role}
      onClose={()=>setShowNotif(false)}
      onNavigate={(item)=>{
        if(item.date){
          const ps=item.date.split('-');
          setDate(new Date(+ps[0],+ps[1]-1,+ps[2]));
        }
        const isComment=item.kind==='comment';
        if(user.role==='doc'){
          // Doc: navigate to client view for that client
          const cl=clients.find(c=>c.id===item.client_id);
          if(cl){setSelClient(cl);setScreen('clientView');}
          // Only open meal detail for likes, not for comments
          if(item.meal_type&&!isComment){setSelMeal(item.meal_type);setScreen('clientMealDetail');}
        }else{
          // Client: navigate to home. For likes — open meal. For comments — stay on home & scroll to chat
          setScreen('home');
          if(item.meal_type&&!isComment)setSelMeal(item.meal_type);
          else setSelMeal(null);
        }
        // Open the chat modal directly for comment-type notifications
        if(isComment){
          setTimeout(()=>{
            if(user.role==='doc'){
              const cl=clients.find(c=>c.id===item.client_id);
              if(cl)openChat(cl.id, cl.nick||cl.name, user.id, item.date||null);
            }else{
              openChat(user.id, user.name||'Нутрициолог', null, item.date||null);
            }
          },200);
        }
      }}
    />}
    <div style={{maxWidth:520,margin:'0 auto',padding:'0 calc(20px + env(safe-area-inset-left)) 90px calc(20px + env(safe-area-inset-right))',paddingLeft:'max(20px, env(safe-area-inset-left))',paddingRight:'max(20px, env(safe-area-inset-right))'}}>
      {ch}
      {screen==='profile'&&<footer style={{marginTop:140,padding:'16px 0',textAlign:'center',fontSize:12,color:C.soft,lineHeight:2}}>
        <div>Разработано <a href="https://radema.ru" target="_blank" rel="noopener" style={{color:C.soft,textDecoration:'none',fontWeight:700}}>radema.ru</a></div>
        <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:4}}>
          <a href="/privacy" style={{color:C.soft,textDecoration:'none'}}>Политика конфиденциальности</a>
          <a href="/terms" style={{color:C.soft,textDecoration:'none'}}>Оферта</a>
        </div>
      </footer>}
    </div>
    {/* Bottom tab bar */}
    <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:10001,background:'#FFFFFF',borderTop:'0.5px solid #E8E8E8',paddingBottom:'calc(8px + env(safe-area-inset-bottom))'}}>
      <div style={{maxWidth:520,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-around',height:60,padding:'0 8px'}}>
        {[
          { id:'diary',     label:'Дневник',    icon:I.book,  badge:0 },
          { id:'analytics', label:'Аналитика',  icon:I.chart, badge:0 },
          { id:'chat',      label:'Чат',        icon:I.chat,  badge:chatBadge },
          { id:'profile',   label:'Профиль',    icon:I.user,  badge:0 },
        ].map(tab => {
          const active = activeTab === tab.id;
          return <button key={tab.id} onClick={()=>handleTabPress(tab.id)} style={{
            flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,
            border:'none',cursor:'pointer',fontFamily:'inherit',position:'relative',
            background:active?'#F0F0F0':'transparent',
            borderRadius:14,margin:'4px 3px',
            color:active?'#333333':'#99A2AD',
            transition:'all .15s',WebkitTapHighlightColor:'transparent',
            padding:'6px 0',
          }}>
            <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',width:26,height:26,color:'inherit'}}>
              <svg viewBox={tab.icon.props.viewBox} width="26" height="26" fill="none" stroke="currentColor" strokeWidth={tab.icon.props.strokeWidth||'1.5'} strokeLinecap={tab.icon.props.strokeLinecap||undefined} strokeLinejoin={tab.icon.props.strokeLinejoin||undefined}>{tab.icon.props.children}</svg>
              {tab.badge > 0 && <div style={{position:'absolute',top:-4,right:-10,minWidth:18,height:18,borderRadius:9,background:'#FF3B30',color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 5px',border:'2px solid #fff'}}>{tab.badge > 99 ? '99+' : tab.badge}</div>}
            </div>
            <span style={{fontSize:10,fontWeight:active?600:500,letterSpacing:'.05em',textTransform:'uppercase',lineHeight:1}}>{tab.label}</span>
          </button>;
        })}
      </div>
    </div>
  </div>;

  // ═══ PROFILE ═══
  if(screen==='profile') return shell(<Profile user={user} onBack={()=>setScreen('home')} onLogout={logout} photo={profilePhoto} onPhotoChange={updatePhoto} waterNorm={waterNorm} onWaterNormChange={setWaterNorm} onZoom={setLb} onOpenAnalytics={()=>setScreen('analytics')}/>);

  // Client analytics viewed by the nutritionist
  if(screen==='clientAnalytics'&&selClient) return shell(<AnalyticsScreen
    analytics={analytics}
    range={analyticsRange}
    onRangeChange={setAnalyticsRange}
    customDateRange={customDateRange}
    onCustomDateRange={setCustomDateRange}
    onBack={()=>setScreen('clientView')}
    waterNorm={selClient.waterNorm||waterNorm}
    title={(selClient.nick||selClient.name) + ' — аналитика'}
  />);

  // Own analytics (from profile)
  if(screen==='analytics') return shell(<AnalyticsScreen
    analytics={analytics}
    range={analyticsRange}
    onRangeChange={setAnalyticsRange}
    customDateRange={customDateRange}
    onCustomDateRange={setCustomDateRange}
    onBack={null}
    waterNorm={waterNorm}
  />);

  // ═══ CLIENT — MEAL DETAIL ═══
  if(!isDoc&&selMeal)return shell(<>
    <MealDetail meal={MEALS.find(m=>m.id===selMeal)} data={meals[selMeal]} onChange={v=>updateMeal(activePid,selMeal,v)} onZoom={setLb} onBack={()=>setSelMeal(null)} dis={false} onUploadPhoto={handleUploadMealPhoto}/>
  </>);

  // ═══ CLIENT — HOME ═══
  if(!isDoc&&!selMeal)return shell(<>
    <TopBar left={null} title="ELLME" subtitle="Eat Live Love ME" onHome={goHome} right={<IcoBtn icon={I.bell} badge={unread} onClick={()=>setShowNotif(true)}/>}/>
    <Cal sel={date} onSelect={setDate}/>

    <WeeklyGoalWidget goal={user.weeklyGoal} goalDays={user.weeklyGoalDays} goalStarted={user.weeklyGoalStarted} goalSetBy={user.weeklyGoalSetBy} daysDone={goalDays} onToggleDay={toggleGoalDay}/>

    <SecCard icon={I.fork} title="Приёмы пищи">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,paddingTop:12}}>
        {getVisibleMeals(meals).map((m,i) => <MealTile key={m.id} meal={m} data={meals[m.id]} onClick={()=>setSelMeal(m.id)} delay={i*0.05}/>)}
      </div>
    </SecCard>

    <DayExtras data={dayData} setData={v=>setDay(activePid,v)} dis={false} waterNorm={waterNorm} onCelebrate={setCelebration} dateKey={key}/>
    {!isDoc&&<DayChatPreview
      clientId={user.id}
      currentUserId={user.id}
      dateKey={key}
      role="client"
      onOpenChat={()=>openChat(user.id, user.name||'Нутрициолог', null, key)}
    />}
  </>);

  // ═══ DOCTOR ═══
  // Client meal detail
  if(isDoc&&screen==='clientMealDetail'&&selMeal&&selClient)return shell(<>
    <MealDetail meal={MEALS.find(m=>m.id===selMeal)} data={(getDay(selClient.id).meals||{})[selMeal]} onChange={v=>{
      // Doc can only toggle 'liked' field in read-only mode
      const cur=(getDay(selClient.id).meals||{})[selMeal]||{};
      if(v.liked!==cur.liked)toggleMealLike(selClient.id,selMeal);
    }} onZoom={setLb} onBack={()=>{setSelMeal(null);setScreen('clientView')}} dis={true}/>
  </>);

  // Client profile (read-only)
  if(isDoc&&screen==='clientProfile'&&selClient){
    if(!clientProfileData&&supabase){supabase.from('profiles').select('*').eq('id',selClient.id).single().then(({data})=>{if(data)setClientProfileData(data)});}
    const cp=clientProfileData;
    return shell(<div style={{animation:'slideRight .3s ease'}}>
      <TopBar left={<BackBtn onClick={()=>{setScreen('clientView');setClientProfileData(null)}}/>} title="Профиль клиента" right={null}/>
      <div style={{textAlign:'center',marginBottom:20}}>
        {cp?.photo_url||selClient.photo
          ? <button onClick={()=>setLb(cp?.photo_url||selClient.photo)} style={{width:96,height:96,borderRadius:'50%',background:'transparent',border:'none',padding:0,cursor:'zoom-in',overflow:'hidden',display:'block',margin:'0 auto 10px',boxShadow:'0 4px 16px rgba(0,0,0,.08)',WebkitTapHighlightColor:'transparent'}}>
              <img src={cp?.photo_url||selClient.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none',display:'block',background:C.surfaceAlt}}/>
            </button>
          : <div style={{width:96,height:96,borderRadius:'50%',background:C.accentSoft,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px',fontSize:36,fontWeight:700,fontFamily:'var(--fd)',color:C.accent}}>{(selClient.nick||selClient.name).charAt(0)}</div>
        }
        <div style={{fontSize:20,fontWeight:700,fontFamily:'var(--fd)'}}>{selClient.nick||selClient.name}</div>
        {selClient.nick&&<div style={{fontSize:13,color:C.muted}}>{selClient.name}</div>}
      </div>
      <div style={{background:C.surface,borderRadius:20,padding:20,boxShadow:C.shadowCard}}>
        {[['Email',cp?.email],['Телефон',cp?.phone],['Возраст',cp?.age?cp.age+' лет':null],['Пол',cp?.gender],['Рост',cp?.height_cm?cp.height_cm+' см':null],['Вес',cp?.weight_kg?cp.weight_kg+' кг':null],['Норма воды',cp?.water_norm?cp.water_norm+' мл/день':null],['Запрос',cp?.request]].map(([label,val])=>
          <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${C.surfaceAlt}`}}>
            <span style={{fontSize:13,color:C.muted}}>{label}</span>
            <span style={{fontSize:14,fontWeight:500,color:val?C.text:C.muted}}>{val||'—'}</span>
          </div>
        )}
        <div style={{fontSize:11,color:C.muted,marginTop:12}}>Зарегистрирован: {cp?.created_at?new Date(cp.created_at).toLocaleDateString('ru'):'—'}</div>
      </div>
    </div>);
  }

  // My diary meal detail
  if(isDoc&&screen==='myMealDetail'&&selMeal)return shell(<>
    <MealDetail meal={MEALS.find(m=>m.id===selMeal)} data={(getDay(user.id).meals||{})[selMeal]} onChange={v=>updateMeal(user.id,selMeal,v)} onZoom={setLb} onBack={()=>{setSelMeal(null);setScreen('myDiary')}} dis={false} onUploadPhoto={handleUploadMealPhoto}/>
  </>);

  // Client diary view
  if(isDoc&&screen==='clientView'&&selClient){
    const cd=getDay(selClient.id),cm=cd.meals||{};
    return shell(<>
      <TopBar left={<BackBtn onClick={()=>{setScreen('home');setSelClient(null);setDocComment('');window.scrollTo(0,0)}}/>} title={selClient.nick||selClient.name} right={<IcoBtn icon={I.chat} badge={docChatUnreadByClient[selClient.id]||0} onClick={()=>openChat(selClient.id, selClient.nick||selClient.name, user.id, null)}/>}/>
      <div style={{background:C.surface,borderRadius:16,padding:'12px 16px',marginBottom:12,boxShadow:C.shadowCard,display:'flex',alignItems:'center',gap:12}}>
        <div style={{position:'relative',flexShrink:0}}>
          {selClient.photo?<img src={selClient.photo} style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',display:'block',background:C.surfaceAlt}} alt=""/>:<div style={{width:40,height:40,borderRadius:'50%',background:C.accentSoft,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,fontFamily:'var(--fd)',color:C.accent}}>{(selClient.nick||selClient.name).charAt(0)}</div>}
          <div style={{position:'absolute',bottom:-1,right:-1,width:10,height:10,borderRadius:'50%',border:'2px solid '+C.surface,background:selClient.isOnline?'#34C759':'#ccc',...(selClient.isOnline?{animation:'pulse 2s infinite'}:{})}}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:C.soft}}>{selClient.request}{selClient.request&&selClient.age?' · ':''}{selClient.age?selClient.age+' лет':''}</div>
          <div style={{fontSize:11,color:selClient.isOnline?'#34C759':C.muted}}>{selClient.isOnline?'онлайн':selClient.lastSeen?formatLastSeen(selClient.lastSeen):daysBetween(selClient.joined,new Date())+' дн.'}</div>
        </div>
        <button onClick={()=>{setScreen('clientProfile');window.scrollTo(0,0)}} style={{background:C.surfaceAlt,border:'none',cursor:'pointer',padding:'6px 12px',borderRadius:8,fontSize:12,color:C.accent,fontFamily:'inherit',fontWeight:500}}>Профиль</button>
      </div>
      <Cal sel={date} onSelect={setDate}/>

      {/* Client analytics shortcut */}
      <button onClick={()=>{
        setAnalytics(null);
        setAnalyticsRange('week');
        // Temporarily override user.id for analytics to load client data
        setScreen('clientAnalytics');
      }} style={{width:'100%',padding:'13px 16px',borderRadius:16,border:`1.5px solid ${C.tileBorder}`,background:C.surface,color:C.text,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:14,boxShadow:C.shadowCard,transition:'all .15s'}}
        onMouseOver={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent}}
        onMouseOut={e=>{e.currentTarget.style.borderColor=C.tileBorder;e.currentTarget.style.color=C.text}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>
        Аналитика клиента
      </button>

      {/* Goal assignment for nutritionist */}
      <DocGoalAssigner clientId={selClient.id} docId={user.id} currentGoal={selClient.weeklyGoal} currentDays={selClient.weeklyGoalDays}/>

      <SecCard icon={I.fork} title="Приёмы пищи">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,paddingTop:12}}>
          {getVisibleMeals(cm).map((m,i) => <MealTile key={m.id} meal={m} data={cm[m.id]} onClick={()=>{setSelMeal(m.id);setScreen('clientMealDetail')}} delay={i*0.05} canLike={true} onToggleLike={()=>toggleMealLike(selClient.id,m.id)}/>)}
        </div>
      </SecCard>
      <DayExtras data={cd} setData={()=>{}} dis={true} waterNorm={waterNorm} dateKey={key}/>

      <DayChatPreview
        clientId={selClient.id}
        docId={user.id}
        currentUserId={user.id}
        dateKey={key}
        role="doc"
        clientName={selClient.nick||selClient.name}
        onOpenChat={()=>openChat(selClient.id, selClient.nick||selClient.name, user.id, key)}
      />
    </>);
  }

  // My diary
  if(isDoc&&screen==='myDiary'){
    const md=getDay(user.id),mm=md.meals||{};
    return shell(<>
      <TopBar left={<BackBtn onClick={()=>setScreen('home')}/>} title="Мой дневник" right={null}/>
      <Cal sel={date} onSelect={setDate}/>
      <SecCard icon={I.fork} title="Приёмы пищи">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,paddingTop:12}}>
          {getVisibleMeals(mm).map((m,i) => <MealTile key={m.id} meal={m} data={mm[m.id]} onClick={()=>{setSelMeal(m.id);setScreen('myMealDetail')}} delay={i*0.05}/>)}
        </div>
      </SecCard>
      <DayExtras data={md} setData={v=>setDay(user.id,v)} dis={false} waterNorm={waterNorm} onCelebrate={setCelebration} dateKey={key}/>
    </>);
  }

  // Doctor home — client list
  if(isDoc&&screen==='home'){
    const active=clients.filter(c=>c.status==='active'),archive=clients.filter(c=>c.status==='archive');
    const list=docTab==='active'?active:archive;
    const invLink=invCode?((typeof window!=='undefined'?window.location.origin:'https://ellme.ru')+'/?invite='+invCode):'';

    return shell(<>
      <TopBar left={null} title="ELLME" subtitle="Eat Live Love ME" onHome={goHome} right={<IcoBtn icon={I.bell} badge={docUnread} onClick={()=>setShowNotif(true)}/>}/>

      <div style={{display:'flex',borderRadius:14,overflow:'hidden',border:`1px solid ${C.tileBorder}`,marginBottom:14}}>
        {[{id:'active',l:`Активные · ${active.length}`},{id:'archive',l:`Архив · ${archive.length}`}].map(t=>
          <button key={t.id} onClick={()=>setDocTab(t.id)} style={{flex:1,padding:'11px',border:'none',fontSize:13,fontWeight:docTab===t.id?600:400,fontFamily:'inherit',cursor:'pointer',background:docTab===t.id?C.surface:C.surfaceAlt,color:docTab===t.id?C.text:C.muted,transition:'all .15s'}}>{t.l}</button>
        )}
      </div>

      {/* My diary */}
      <button onClick={()=>{setScreen('myDiary');setDate(new Date())}} style={{width:'100%',padding:'18px',borderRadius:20,border:`2px solid ${C.accent}`,background:C.accentSoft,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:14,marginBottom:14,boxShadow:'0 4px 16px rgba(45,95,63,.12)',transition:'all .25s',transform:'perspective(400px) rotateX(0)'}}
        onMouseOver={e=>{e.currentTarget.style.transform='perspective(400px) rotateX(-2deg) translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(45,95,63,.18)'}}
        onMouseOut={e=>{e.currentTarget.style.transform='perspective(400px) rotateX(0)';e.currentTarget.style.boxShadow='0 4px 16px rgba(45,95,63,.12)'}}>
        <div style={{width:44,height:44,borderRadius:14,background:C.accent,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>{I.fork}</div>
        <div style={{textAlign:'left'}}>
          <div style={{fontSize:16,fontWeight:600,color:C.accent}}>Мой дневник</div>
          <div style={{fontSize:12,color:C.soft}}>Личный дневник здоровья</div>
        </div>
      </button>

      {list.map((c,i)=><div key={c.id} style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,position:'relative',animation:`enter .35s ease ${i*0.04}s both`,zIndex:clientMenu===c.id?10000:1}}>
        <button onClick={()=>{setSelClient(c);setScreen('clientView');setDate(new Date())}} className="card-hover" style={{flex:1,display:'flex',alignItems:'center',gap:12,padding:'16px',borderRadius:18,border:'none',background:C.surface,cursor:'pointer',textAlign:'left',fontFamily:'inherit',boxShadow:C.shadowCard,transition:'all .2s',transform:'perspective(400px) rotateX(0)'}}
          onMouseOver={e=>{e.currentTarget.style.transform='perspective(400px) rotateX(-2deg) translateY(-2px)';e.currentTarget.style.boxShadow=C.shadowHover}}
          onMouseOut={e=>{e.currentTarget.style.transform='perspective(400px) rotateX(0)';e.currentTarget.style.boxShadow=C.shadowCard}}>
          <div style={{position:'relative',flexShrink:0}}>
            {c.photo?<img src={c.photo} style={{width:42,height:42,borderRadius:'50%',objectFit:'cover',display:'block',background:C.surfaceAlt}} alt=""/>:<div style={{width:42,height:42,borderRadius:'50%',background:C.surfaceAlt,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,fontFamily:'var(--fd)',color:C.accent}}>{(c.nick||c.name).charAt(0)}</div>}
            <div style={{position:'absolute',bottom:-1,right:-1,width:12,height:12,borderRadius:'50%',border:'2px solid '+C.surface,background:c.isOnline?'#34C759':'#ccc',...(c.isOnline?{animation:'pulse 2s infinite'}:{})}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:600}}>{c.nick||c.name}</div>
            {c.nick&&<div style={{fontSize:11,color:C.muted}}>{c.name}</div>}
            <div style={{fontSize:12,color:C.soft,marginTop:1}}>{[c.request,c.age?c.age+' лет':null].filter(Boolean).join(' · ')||''}</div>
            <div style={{fontSize:11,color:c.isOnline?'#34C759':C.muted,marginTop:1}}>{c.isOnline?'онлайн':c.lastSeen?formatLastSeen(c.lastSeen):daysBetween(c.joined,new Date())+' дней'}</div>
          </div>
          <span style={{color:C.muted,display:'flex'}}>{I.chev}</span>
        </button>
        <button onClick={e=>{e.stopPropagation();setClientMenu(clientMenu===c.id?null:c.id)}} style={{background:C.surface,border:'none',cursor:'pointer',padding:10,borderRadius:12,color:C.muted,display:'flex',boxShadow:C.shadowCard,fontSize:18,lineHeight:1}}>⋮</button>
        {clientMenu===c.id&&<>
          <div onClick={()=>setClientMenu(null)} style={{position:'fixed',inset:0,zIndex:9998}}/>
          <div style={{position:'absolute',right:0,top:'100%',marginTop:4,background:C.surface,borderRadius:14,boxShadow:'0 8px 32px rgba(0,0,0,.18)',padding:6,zIndex:9999,width:200,animation:'scaleIn .15s ease'}}>
            <button onClick={()=>{setRenaming(c);setRenameVal(c.nick||'');setClientMenu(null)}} style={{width:'100%',padding:'10px 14px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontFamily:'inherit',textAlign:'left',borderRadius:8,color:C.text,display:'flex',alignItems:'center',gap:8}}
              onMouseOver={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseOut={e=>e.currentTarget.style.background='transparent'}>{I.edit} Переименовать</button>
            <button onClick={()=>{toggleArchive(c.id);setClientMenu(null)}} style={{width:'100%',padding:'10px 14px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontFamily:'inherit',textAlign:'left',borderRadius:8,color:C.text,display:'flex',alignItems:'center',gap:8}}
              onMouseOver={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseOut={e=>e.currentTarget.style.background='transparent'}>{c.status==='active'?I.archive:I.restore} {c.status==='active'?'В архив':'В активные'}</button>
            <button onClick={()=>deleteClient(c.id)} style={{width:'100%',padding:'10px 14px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontFamily:'inherit',textAlign:'left',borderRadius:8,color:C.danger,display:'flex',alignItems:'center',gap:8}}
              onMouseOver={e=>e.currentTarget.style.background=C.dangerSoft} onMouseOut={e=>e.currentTarget.style.background='transparent'}>{I.x} Удалить</button>
          </div>
        </>}
      </div>)}

      <button onClick={createInvite} style={{width:'100%',marginTop:10,padding:'14px',borderRadius:16,border:`1.5px dashed ${C.tileBorder}`,background:'transparent',cursor:'pointer',fontSize:14,fontWeight:500,color:C.muted,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .2s'}}
        onMouseOver={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent}} onMouseOut={e=>{e.currentTarget.style.borderColor=C.tileBorder;e.currentTarget.style.color=C.muted}}>
        {I.plus} Добавить клиента
      </button>

      {inv&&<div style={{position:'fixed',inset:0,zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn .15s'}}>
        <div onClick={()=>{setInv(false);loadClients()}} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.25)',backdropFilter:'blur(4px)'}}/>
        <div style={{position:'relative',background:C.surface,borderRadius:24,padding:28,width:'min(420px,90vw)',boxShadow:C.shadowHover,animation:'scaleIn .25s cubic-bezier(.16,1,.3,1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <span style={{color:C.accent,display:'flex'}}>{I.link}</span>
            <span style={{fontSize:18,fontWeight:700,fontFamily:'var(--fd)'}}>Пригласить клиента</span>
          </div>
          <p style={{fontSize:13,color:C.soft,lineHeight:1.6,margin:'0 0 14px'}}>Отправьте ссылку — клиент зарегистрируется и появится в вашем списке.</p>
          <div style={{display:'flex',gap:8}}>
            <input readOnly value={invLink} style={{flex:1,padding:'10px 12px',borderRadius:12,border:`1.5px solid ${C.tileBorder}`,fontSize:12,fontFamily:'monospace',background:C.surfaceAlt,outline:'none'}}/>
            <button onClick={()=>{navigator.clipboard?.writeText(invLink);setCopied(true);setTimeout(()=>{setCopied(false);setInv(false);loadClients()},1200)}} style={{padding:'10px 18px',borderRadius:12,border:'none',background:C.accent,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',boxShadow:'0 2px 8px rgba(45,95,63,.2)'}}>{copied?'Скопировано ✓':'Копировать'}</button>
          </div>
        </div>
      </div>}
    </>);
  }

  return shell(<div/>);
}

// ═══ IMAGE COMPRESSION UTILITY ═══
function compressImage(file, maxDim = 1200, quality = 0.80) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
          else { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
          'image/jpeg', quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
