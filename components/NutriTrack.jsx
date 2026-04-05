"use client"

import { useState, useRef, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

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

const MEALS=[
  {id:"breakfast",label:"Завтрак"},{id:"lunch",label:"Обед"},{id:"dinner",label:"Ужин"},
  {id:"snack1",label:"Перекус 1"},{id:"snack2",label:"Перекус 2"},{id:"snack3",label:"Перекус 3"},
];
const HUNGER=["Сильный","Умеренный","Лёгкий","Нейтральный","Сытость"];
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
  fork:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  stool:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2h6l1 7H8L9 2z"/><path d="M8 9l-2 13M16 9l2 13M12 9v13"/></svg>,
  steth:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3"/><path d="M8 15v1a6 6 0 006 6 6 6 0 006-6v-4"/><circle cx="20" cy="10" r="2"/></svg>,
};

// ═══ DATA ═══
const CL_INIT=[
  {id:"c1",name:"Анна Козлова",age:34,request:"Снижение веса",status:"active",nick:"",joined:new Date(2026,0,5)},
  {id:"c2",name:"Михаил Петров",age:28,request:"Набор массы",status:"active",nick:"",joined:new Date(2026,1,12)},
  {id:"c3",name:"Елена Сидорова",age:45,request:"Контроль диабета",status:"active",nick:"",joined:new Date(2026,2,20)},
  {id:"c4",name:"Ольга Кравцова",age:52,request:"Здоровое старение",status:"archive",nick:"",joined:new Date(2025,8,1)},
];

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
  return <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0 12px',minHeight:52,position:'sticky',top:0,background:C.bg,zIndex:100,borderBottom:noBorder?'none':`1px solid ${C.surfaceAlt}`}}>
    <div style={{width:48,display:'flex',justifyContent:'flex-start'}}>{left}</div>
    <div style={{textAlign:'center',cursor:onHome?'pointer':'default'}} onClick={onHome||undefined}>
      <div style={{fontSize:20,fontWeight:700,fontFamily:'var(--fd)',letterSpacing:'-.02em',color:C.text}}>{title}</div>
      {subtitle&&<div style={{fontSize:9,color:C.muted,letterSpacing:'.1em',textTransform:'uppercase',marginTop:1}}>{subtitle}</div>}
    </div>
    <div style={{width:48,display:'flex',justifyContent:'flex-end'}}>{right}</div>
  </div>;
}

function BackBtn({onClick}){
  return <button onClick={onClick} style={{background:'none',border:'none',cursor:'pointer',color:C.soft,display:'flex',padding:4}}>{I.back}</button>;
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
    const start=Date.now(),ms=duration*1000;
    const tick=()=>{const el=Date.now()-start;const raw=Math.min(100,Math.round((el/ms)*100));setPct(Math.min(100,raw));if(el<ms)requestAnimationFrame(tick);else{setPct(100);if(onDone)setTimeout(onDone,200);}};
    requestAnimationFrame(tick);
  },[]);
  return <div style={{width:'min(280px,80vw)',textAlign:'center'}}>
    <div style={{fontSize:32,fontWeight:700,fontFamily:'var(--fd)',letterSpacing:'.06em',color:C.text,marginBottom:4}}>ELLME</div>
    <div style={{fontSize:10,color:C.muted,letterSpacing:'.15em',textTransform:'uppercase',marginBottom:32}}>Eat Live Love ME</div>
    <div style={{height:4,borderRadius:2,background:C.surfaceAlt,overflow:'hidden',marginBottom:8}}>
      <div style={{height:'100%',borderRadius:2,background:C.accent,width:pct+'%',transition:'width .15s ease'}}/>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <span style={{fontSize:13,color:C.muted}}>{label}</span>
      <span style={{fontSize:13,color:C.accent,fontWeight:600}}>{pct}%</span>
    </div>
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
      {['00','05','10','15','20','25','30','35','40','45','50','55'].map(v=><option key={v} value={v}>{v}</option>)}
    </select>
  </div>;
}

function Chip({children,sel,onClick,dis}){
  if(dis&&!sel)return null;
  return <button onClick={dis?undefined:onClick} style={{padding:'7px 16px',borderRadius:100,fontSize:13,fontWeight:sel?600:400,fontFamily:'inherit',border:`1.5px solid ${sel?C.accent:'transparent'}`,cursor:dis?'default':'pointer',background:sel?C.accentSoft:C.surfaceAlt,color:sel?C.accent:C.soft,transition:'all .15s'}}>{children}</button>;
}

function Scale({max=10,value:v,onChange,dis}){
  if(dis){
    if(v==null)return <span style={{fontSize:13,color:C.muted}}>—</span>;
    return <div style={{display:'flex',alignItems:'center',gap:10}}>
      <span style={{fontSize:22,fontWeight:700,fontFamily:'var(--fd)',color:C.accent}}>{v}</span>
      <div style={{flex:1,height:5,borderRadius:3,background:C.surfaceAlt,overflow:'hidden',maxWidth:160}}><div style={{height:'100%',width:`${(v/max)*100}%`,borderRadius:3,background:C.accent,transition:'width .4s'}}/></div>
      <span style={{fontSize:12,color:C.muted}}>/ {max}</span>
    </div>;
  }
  return <div style={{display:'flex',gap:3}}>
    {Array.from({length:max},(_,i)=>i+1).map(n=><button key={n} onClick={()=>onChange(v===n?null:n)} style={{flex:1,height:36,minWidth:0,borderRadius:8,border:'none',fontSize:12,fontWeight:600,fontFamily:'inherit',cursor:'pointer',background:v===n?C.accent:C.surfaceAlt,color:v===n?'#fff':C.soft,transition:'all .12s',transform:v===n?'scale(1.05)':'scale(1)',boxShadow:v===n?'0 2px 8px rgba(45,95,63,.25)':'none'}}>{n}</button>)}
  </div>;
}

function Mood({value:v,onChange,dis}){
  const f=['😫','😔','😐','🙂','😄'];
  if(dis){if(v==null)return <span style={{fontSize:13,color:C.muted}}>—</span>;return <div style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:32}}>{f[v]}</span><span style={{fontSize:14,fontWeight:500}}>{MOOD_L[v]}</span></div>;}
  return <div style={{display:'flex',gap:6}}>{f.map((c,i)=><button key={i} onClick={()=>onChange(v===i?null:i)} style={{flex:1,padding:'8px 2px',borderRadius:16,border:`2px solid ${v===i?C.accent:'transparent'}`,background:v===i?C.accentSoft:C.surfaceAlt,cursor:'pointer',transition:'all .15s',display:'flex',flexDirection:'column',alignItems:'center',gap:4,transform:v===i?'scale(1.06)':'scale(1)',boxShadow:v===i?'0 3px 12px rgba(45,95,63,.2)':'none',fontFamily:'inherit'}}><span style={{fontSize:26}}>{c}</span><span style={{fontSize:9,color:v===i?C.accent:C.muted,fontWeight:v===i?600:400}}>{MOOD_L[i]}</span></button>)}</div>;
}

function Area({value:v,onChange,placeholder:ph,dis,rows=3}){
  if(dis)return <div style={{fontSize:14,color:v?C.text:C.muted,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{v||'—'}</div>;
  return <textarea value={v||''} onChange={e=>onChange(e.target.value)} placeholder={ph} rows={rows} style={{width:'100%',padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',resize:'vertical',outline:'none',boxSizing:'border-box',background:C.surface,lineHeight:1.6,color:C.text,transition:'border-color .2s'}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.tileBorder}/>;
}

function Lbl({children}){return <div style={{fontSize:11,fontWeight:600,color:C.muted,letterSpacing:'.06em',textTransform:'uppercase',marginBottom:8}}>{children}</div>;}

function Lightbox({src,onClose}){
  useEffect(()=>{const h=e=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[onClose]);
  return <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(10,10,10,.92)',backdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out',animation:'fadeIn .2s'}}>
    <img src={src} alt="" style={{maxWidth:'94vw',maxHeight:'92vh',objectFit:'contain',borderRadius:16,boxShadow:'0 32px 80px rgba(0,0,0,.4)',animation:'scaleIn .3s cubic-bezier(.16,1,.3,1)'}}/>
    <button onClick={onClose} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,.1)',backdropFilter:'blur(8px)',border:'none',color:'#fff',width:44,height:44,borderRadius:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{I.x}</button>
  </div>;
}

// ═══ MEAL TILE (2×3 grid) ═══
function MealTile({meal,data,onClick,delay=0}){
  const d=data||{};
  const has=d.text||d.photo;
  return <button onClick={onClick} className="tile3d" style={{
    aspectRatio:'1',borderRadius:20,border:'none',cursor:'pointer',fontFamily:'inherit',
    background:d.photo?`url(${d.photo}) center/cover`:C.tile,
    display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:14,
    position:'relative',overflow:'hidden',textAlign:'left',
    boxShadow:has?C.shadow3d:'none',
    animation:`tileIn .4s cubic-bezier(.34,1.56,.64,1) ${delay}s both`,
    transform:'perspective(600px) rotateX(0deg)',
  }}
    onMouseOver={e=>{e.currentTarget.style.transform='perspective(600px) rotateX(-3deg) translateY(-4px)';e.currentTarget.style.boxShadow=C.shadowHover}}
    onMouseOut={e=>{e.currentTarget.style.transform='perspective(600px) rotateX(0deg)';e.currentTarget.style.boxShadow=has?C.shadow3d:'none'}}
  >
    {d.photo&&<div style={{position:'absolute',inset:0,background:'linear-gradient(transparent 40%, rgba(0,0,0,.6))',borderRadius:20}}/>}
    {!d.photo&&!has&&<div style={{position:'absolute',inset:0,border:`1.5px dashed ${C.tileBorder}`,borderRadius:20,pointerEvents:'none'}}/>}
    <div style={{position:'relative',zIndex:1}}>
      {!has&&<div style={{fontSize:13,color:C.muted,marginBottom:2}}>Добавить</div>}
      <div style={{fontSize:15,fontWeight:700,color:d.photo?'#fff':C.text}}>{meal.label}</div>
      {d.time&&<div style={{fontSize:12,color:d.photo?'rgba(255,255,255,.8)':C.soft,marginTop:2}}>{d.time}</div>}
    </div>
  </button>;
}

// ═══ MEAL DETAIL ═══
function MealDetail({meal,data,onChange,onZoom,onBack,dis,onUploadPhoto}){
  const d=data||{},upd=(k,v)=>onChange({...d,[k]:v});
  const fRef=useRef(null),cRef=useRef(null);
  const[uploading,setUploading]=useState(false);
  const hFile=async(e)=>{
    const f=e.target.files?.[0];if(!f)return;
    e.target.value='';
    if(onUploadPhoto){
      setUploading(true);
      try{
        const url=await onUploadPhoto(f);
        if(url)upd('photo',url);
      }catch(err){console.error('Photo upload error:',err)}
      setUploading(false);
    }else{
      // Fallback: data URL (dev mode without Supabase)
      const r=new FileReader();r.onload=ev=>upd('photo',ev.target.result);r.readAsDataURL(f);
    }
  };

  return <div style={{animation:'slideRight .3s ease'}}>
    <TopBar left={<BackBtn onClick={onBack}/>} title={meal.label} right={null}/>

    {/* Photo */}
    {d.photo&&<div style={{position:'relative',borderRadius:20,overflow:'hidden',marginBottom:16,boxShadow:C.shadow3d}}>
      <div onClick={()=>onZoom(d.photo)} style={{cursor:'zoom-in',width:'100%',aspectRatio:'16/10'}}>
        <img src={d.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
      </div>
      <button onClick={()=>onZoom(d.photo)} style={{position:'absolute',bottom:12,right:12,background:'rgba(0,0,0,.4)',backdropFilter:'blur(8px)',border:'none',color:'#fff',padding:'5px 12px',borderRadius:10,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontFamily:'inherit'}}>{I.expand}</button>
      {!dis&&<button onClick={()=>upd('photo',null)} style={{position:'absolute',top:10,right:10,background:'rgba(0,0,0,.4)',backdropFilter:'blur(8px)',border:'none',color:'#fff',width:30,height:30,borderRadius:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{I.x}</button>}
    </div>}
    {!dis&&<>
      <input ref={fRef} type="file" accept="image/*" onChange={hFile} style={{display:'none'}}/>
      <input ref={cRef} type="file" accept="image/*" capture="environment" onChange={hFile} style={{display:'none'}}/>
      {!d.photo&&<div style={{display:'flex',gap:8,marginBottom:16}}>
        {uploading
          ?<div style={{flex:1,padding:'14px',borderRadius:16,border:`1.5px solid ${C.tileBorder}`,background:C.accentSoft,fontSize:13,color:C.accent,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <span style={{animation:'pulseGlow 1.5s infinite'}}>⏳</span> Загрузка фото...
          </div>
          :[{r:fRef,i:I.img,t:'Галерея'},{r:cRef,i:I.cam,t:'Камера'}].map((b,i)=>
            <button key={i} onClick={()=>b.r.current?.click()} style={{flex:1,padding:'14px',borderRadius:16,border:`1.5px dashed ${C.tileBorder}`,background:'transparent',cursor:'pointer',fontSize:13,color:C.muted,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .2s'}}
              onMouseOver={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent}} onMouseOut={e=>{e.currentTarget.style.borderColor=C.tileBorder;e.currentTarget.style.color=C.muted}}>
              {b.i}{b.t}
            </button>)
        }
      </div>}
    </>}

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

      <div style={{marginBottom:18}}>
        <Lbl>Что ели</Lbl>
        <Area value={d.text} onChange={v=>upd('text',v)} placeholder="Опишите приём пищи..." dis={dis} rows={2}/>
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
        <Area value={d.feelingNote} onChange={v=>upd('feelingNote',v)} placeholder="Подробнее об ощущениях..." dis={dis} rows={2}/>
      </div>
    </div>
  </div>;
}

// ═══ SECTIONS (water, sleep, etc) ═══
function SecCard({icon,title,children}){
  const[open,setOpen]=useState(true);
  return <div style={{background:C.surface,borderRadius:20,boxShadow:C.shadowCard,overflow:'hidden',marginTop:12}}>
    <button onClick={()=>setOpen(!open)} style={{width:'100%',padding:'14px 18px',display:'flex',alignItems:'center',gap:10,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
      <span style={{color:C.accent,display:'flex'}}>{icon}</span>
      <span style={{flex:1,textAlign:'left',fontSize:15,fontWeight:600,color:C.text}}>{title}</span>
      <span style={{transition:'transform .2s',transform:open?'rotate(90deg)':'rotate(0)',color:C.muted,display:'flex'}}>{I.chev}</span>
    </button>
    {open&&<div style={{padding:'0 18px 18px',borderTop:`1px solid ${C.surfaceAlt}`}}>{children}</div>}
  </div>;
}

function DayExtras({data,setData,dis,waterNorm=2200,onCelebrate}){
  const d=data||{},upd=(k,v)=>setData({...d,[k]:v});
  const waterMl=d.water||0;
  const waterPct=Math.min(100,Math.round((waterMl/waterNorm)*100));
  const addWater=(ml)=>{if(dis)return;const nv=Math.min(waterNorm+500,waterMl+ml);upd('water',nv);if(waterMl<waterNorm&&nv>=waterNorm&&onCelebrate)onCelebrate('water')};
  const checkSleep=(s)=>{if(!s.bed||!s.wake||!onCelebrate)return;const[bh,bm]=s.bed.split(':').map(Number);const[wh,wm]=s.wake.split(':').map(Number);let hrs=wh-bh+(wm-bm)/60;if(hrs<=0)hrs+=24;if(hrs>=8&&hrs<=12)onCelebrate('sleep')};
  return <>
    {/* Water — bottle style */}
    <SecCard icon={I.drop} title={`Вода · ${waterMl} мл`}>
      <div style={{padding:'14px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
          {/* Bottle visualization */}
          <div style={{width:48,height:100,borderRadius:12,border:`2px solid ${C.tileBorder}`,position:'relative',overflow:'hidden',background:C.surfaceAlt,flexShrink:0}}>
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:`${waterPct}%`,background:'linear-gradient(to top, #7BC8E8, #A8DFF0)',transition:'height .5s cubic-bezier(.34,1.56,.64,1)',borderRadius:'0 0 10px 10px'}}/>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:waterPct>45?'#fff':C.soft,textShadow:waterPct>45?'0 1px 3px rgba(0,0,0,.2)':'none'}}>{waterPct}%</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:24,fontWeight:700,fontFamily:'var(--fd)',color:C.text}}>{waterMl} <span style={{fontSize:14,fontWeight:400,color:C.muted}}>мл</span></div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Норма: {waterNorm} мл</div>
            <div style={{height:6,borderRadius:3,background:C.surfaceAlt,overflow:'hidden',marginTop:8}}>
              <div style={{height:'100%',width:`${waterPct}%`,borderRadius:3,background:waterPct>=100?C.accent:'#7BC8E8',transition:'width .5s'}}/>
            </div>
            <div style={{fontSize:11,color:waterPct>=100?C.accent:C.muted,marginTop:4,fontWeight:waterPct>=100?600:400}}>{waterPct>=100?'Норма выполнена':'Осталось '+(waterNorm-waterMl)+' мл'}</div>
          </div>
        </div>
        {!dis&&<div style={{display:'flex',gap:6}}>
          {[100,200,250,330,500].map(ml=><button key={ml} onClick={()=>addWater(ml)} style={{flex:1,padding:'8px 4px',borderRadius:10,border:`1.5px solid ${C.tileBorder}`,background:C.surface,cursor:'pointer',fontSize:12,fontWeight:500,color:C.soft,fontFamily:'inherit',transition:'all .15s'}}
            onMouseOver={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;e.currentTarget.style.background=C.accentSoft}}
            onMouseOut={e=>{e.currentTarget.style.borderColor=C.tileBorder;e.currentTarget.style.color=C.soft;e.currentTarget.style.background=C.surface}}>
            +{ml}
          </button>)}
        </div>}
      </div>
    </SecCard>

    <SecCard icon={I.pill} title="Препараты / БАДы">
      <div style={{padding:'12px 0'}}><Area value={d.supplements} onChange={v=>upd('supplements',v)} placeholder="Что принимали..." dis={dis} rows={2}/></div>
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
          <Area value={d.stoolNote} onChange={v=>upd('stoolNote',v)} placeholder="Подробности..." dis={dis} rows={2}/>
        </div>
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
        <div><Lbl>Качество сна</Lbl><Scale max={10} value={d.sleep?.quality} onChange={v=>upd('sleep',{...(d.sleep||{}),quality:v})} dis={dis}/></div>
      </div>
    </SecCard>

    <SecCard icon={I.run} title="Движение">
      <div style={{padding:'12px 0'}}><Area value={d.movement} onChange={v=>upd('movement',v)} placeholder="Активность, продолжительность..." dis={dis} rows={2}/></div>
    </SecCard>

    <SecCard icon={I.brain} title="Стресс">
      <div style={{padding:'12px 0',display:'flex',flexDirection:'column',gap:14}}>
        <div><Lbl>Уровень</Lbl><Scale max={10} value={d.stress?.level} onChange={v=>upd('stress',{...(d.stress||{}),level:v})} dis={dis}/></div>
        <div><Lbl>Практики расслабления</Lbl><Area value={d.stress?.practices} onChange={v=>upd('stress',{...(d.stress||{}),practices:v})} placeholder="Медитация, дыхание..." dis={dis} rows={2}/></div>
      </div>
    </SecCard>

    <SecCard icon={I.heart} title="Самочувствие">
      <div style={{padding:'12px 0',display:'flex',flexDirection:'column',gap:14}}>
        <div><Lbl>Энергия</Lbl><Scale max={10} value={d.well?.energy} onChange={v=>upd('well',{...(d.well||{}),energy:v})} dis={dis}/></div>
        <div><Lbl>Настроение</Lbl><Mood value={d.well?.mood} onChange={v=>upd('well',{...(d.well||{}),mood:v})} dis={dis}/></div>
        <div><Lbl>Заметка дня</Lbl><Area value={d.well?.comment} onChange={v=>upd('well',{...(d.well||{}),comment:v})} placeholder="Как прошёл день..." dis={dis} rows={3}/></div>
      </div>
    </SecCard>
  </>;
}

// ═══ CALENDAR ═══
function Cal({sel,onSelect}){
  const days=[];for(let i=-3;i<=3;i++){const d=new Date(sel);d.setDate(sel.getDate()+i);days.push(d);}
  const today=new Date();
  const goM=dir=>{const d=new Date(sel);d.setMonth(d.getMonth()+dir);onSelect(d)};
  return <div style={{marginBottom:12}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
      <button onClick={()=>goM(-1)} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:8,display:'flex',transform:'rotate(180deg)'}}>{I.chev}</button>
      <span style={{fontSize:16,fontWeight:600,fontFamily:'var(--fd)',color:C.text}}>{MO[sel.getMonth()]} {sel.getFullYear()}</span>
      <button onClick={()=>goM(1)} style={{background:'none',border:'none',cursor:'pointer',color:C.muted,padding:8,display:'flex'}}>{I.chev}</button>
    </div>
    <div style={{display:'flex',justifyContent:'center',gap:4}}>
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
    <div style={{textAlign:'center',marginTop:6,fontSize:13,color:C.muted}}>{sameD(sel,new Date())?'Сегодня, ':''}{ sameD(sel,ago(1))?'Вчера, ':''}{fmtD(sel)}</div>
  </div>;
}

// ═══ PROFILE PAGE ═══
function Profile({user,onBack,onLogout,photo,onPhotoChange,waterNorm,onWaterNormChange,onZoom}){
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
        <div onClick={()=>photo?onZoom(photo):avatarRef.current?.click()} style={{width:110,height:110,borderRadius:'50%',background:photo?'transparent':C.accentSoft,display:'flex',alignItems:'center',justifyContent:'center',color:C.accent,boxShadow:'0 4px 16px rgba(45,95,63,.1)',cursor:'pointer',overflow:'hidden'}}>
        {photo
          ? <img src={photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          : <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.2" opacity=".5"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0112 0v1"/></svg>
        }
        </div>
        <button onClick={()=>avatarRef.current?.click()} style={{position:'absolute',bottom:4,right:4,width:28,height:28,borderRadius:'50%',background:C.accent,border:'2px solid '+C.bg,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>
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
      {!isDoc&&<div style={{marginBottom:16}}>
        <Lbl>Дневная норма воды, мл</Lbl>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input value={wn} onChange={e=>setWn(e.target.value)} type="number" style={{flex:1,padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:C.surface,color:C.text}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>{e.target.style.borderColor=C.tileBorder;const v=parseInt(wn);if(v>0)onWaterNormChange(v)}}/>
          <span style={{fontSize:13,color:C.muted,whiteSpace:'nowrap'}}>мл / день</span>
        </div>
      </div>}
      {!isDoc&&<>{inp('Основной запрос',request,setRequest)}</>}
      <button onClick={saveProfile} style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:saved?C.accentSoft:C.accent,color:saved?C.accent:'#fff',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit',marginTop:4,transition:'all .3s',boxShadow:saved?'none':'0 2px 8px rgba(45,95,63,.2)'}}>
        {saved?'Сохранено ✓':'Сохранить'}
      </button>
    </div>

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
function Celebration({type,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t)},[onClose]);
  const colors=['#4CAF50','#8BC34A','#CDDC39','#FFC107','#FF9800','#00BCD4','#2196F3','#E91E63'];
  const msg=type==='water'?{title:'Норма воды выполнена!',sub:'Отличная привычка — так держать!'}:{title:'Отличный сон!',sub:'8 часов — идеальный отдых для организма'};
  return <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn .3s',pointerEvents:'auto'}}>
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
    <div style={{position:'relative',background:C.surface,borderRadius:28,padding:'40px 32px',textAlign:'center',maxWidth:320,boxShadow:'0 20px 60px rgba(0,0,0,.2)',animation:'bounceIn .5s cubic-bezier(.34,1.56,.64,1)'}}>
      <div style={{fontSize:56,marginBottom:12,animation:'celebrate .6s ease .2s both'}}>{type==='water'?'💧':'🌙'}</div>
      <div style={{fontSize:22,fontWeight:700,fontFamily:'var(--fd)',marginBottom:6,animation:'celebrate .6s ease .3s both'}}>{msg.title}</div>
      <div style={{fontSize:14,color:C.soft,lineHeight:1.6,animation:'celebrate .6s ease .4s both'}}>{msg.sub}</div>
      {/* Sparkles */}
      {[{t:40,l:20,d:0},{t:30,l:80,d:.2},{t:70,l:15,d:.4},{t:65,l:85,d:.1}].map((s,i) => <div key={i} style={{
        position:'absolute',top:`${s.t}%`,left:`${s.l}%`,width:12,height:12,
        background:C.accent,borderRadius:'50%',opacity:0,
        animation:`sparkle 1s ease ${s.d+.5}s infinite`,
      }}/>)}
    </div>
  </div>;
}

// ═══ LOGIN ═══
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
  const[show,setShow]=useState(false);
  useEffect(()=>{setTimeout(()=>setShow(true),60)},[]);

  const inputStyle={width:'100%',padding:'16px 18px',borderRadius:16,border:`1.5px solid ${C.tileBorder}`,fontSize:15,fontFamily:'inherit',outline:'none',boxSizing:'border-box',background:C.surface,color:C.text,marginBottom:12,transition:'border-color .2s'};
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
    if (/^[a-zA-Z\s:.,!?]+$/.test(msg)) return 'Ошибка: ' + msg;
    return msg;
  };

  // ── Email Sign In ──
  const handleSignIn = async () => {
    if (!supabase) { onLogin('client', email, 'c1'); return; }
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (err) setError(ruError(err.message));
    } catch(e) { setError('Ошибка подключения'); }
    setLoading(false);
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
        }
      }
    } catch(e) { setError('Ошибка подключения'); }
    setLoading(false);
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
      <ProgressBar duration={4} label="Подключаемся..."/>
    </div>}
    <div style={{width:'100%',maxWidth:400,margin:'0 auto',opacity:show?1:0,transform:show?'none':'translateY(16px)',transition:'all .7s cubic-bezier(.16,1,.3,1)'}}>

      {mode==='auth'&&<>
        <Logo/>
        {errBox}{sucBox}

        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={inputStyle} onFocus={onFB} onBlur={offFB}/>
        <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Пароль" type="password" style={inputStyle} onFocus={onFB} onBlur={offFB}
          onKeyDown={e=>{if(e.key==='Enter')handleSignIn()}}/>
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
          <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Пароль (мин. 6 символов)" type="password" style={inputStyle} onFocus={onFB} onBlur={offFB}/>
          <input value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Повторите пароль" type="password" style={inputStyle} onFocus={onFB} onBlur={offFB}/>
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
        <input placeholder="Пароль" type="password" style={inputStyle} value={pass} onChange={e=>setPass(e.target.value)} onFocus={onFB} onBlur={offFB}
          onKeyDown={e=>{if(e.key==='Enter')handleDocSignIn()}}/>
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
          <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Пароль (мин. 6 символов)" type="password" style={inputStyle} onFocus={onFB} onBlur={offFB}/>
          <input value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Повторите пароль" type="password" style={inputStyle} onFocus={onFB} onBlur={offFB}/>
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
  const[authLoading,setAuthLoading]=useState(!!supabase);
  const[showLoader,setShowLoader]=useState(false);

  // Only show loading screen if auth takes > 1.5 seconds
  useEffect(()=>{
    if(!authLoading){setShowLoader(false);return;}
    const timer=setTimeout(()=>{if(authLoading)setShowLoader(true)},1500);
    return()=>clearTimeout(timer);
  },[authLoading]);
  const[diaries,setDiaries]=useState({});
  const[comments,setComments]=useState({});
  const[clients,setClients]=useState([]);
  const[date,setDate]=useState(new Date());
  const[lb,setLb]=useState(null);

  // Navigation stack
  const[screen,setScreen]=useState('home');
  const[selMeal,setSelMeal]=useState(null);
  const[selClient,setSelClient]=useState(null);
  const[docTab,setDocTab]=useState('active');
  const[docComment,setDocComment]=useState('');
  const[showNotif,setShowNotif]=useState(false);
  const[inv,setInv]=useState(false);
  const[invCode,setInvCode]=useState('');
  const[copied,setCopied]=useState(false);

  // ═══ SAVE TIMERS (per-pid to avoid cross-client data loss) ═══
  const saveTimers=useRef({});

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
    const{data:links}=await supabase.from('doc_clients').select('*,profiles!doc_clients_client_id_fkey(id,name,email,age,request,created_at)').eq('doc_id',user.id);
    if(links&&links.length>0){
      const cls=links.map(l=>({
        id:l.client_id,
        name:l.profiles?.name||l.profiles?.email||'Клиент',
        email:l.profiles?.email,
        age:l.profiles?.age,
        request:l.profiles?.request||'',
        nick:l.nick||'',
        status:l.status||'active',
        joined:new Date(l.profiles?.created_at||l.created_at),
      }));
      setClients(cls);
    }
  };

  // Load clients when doc logs in
  useEffect(()=>{if(user?.role==='doc')loadClients()},[user?.id,user?.role]);
  const[renaming,setRenaming]=useState(null);
  const[renameVal,setRenameVal]=useState('');
  const[profilePhoto,setProfilePhoto]=useState(()=>{try{return typeof window!=='undefined'?localStorage.getItem('ellme_photo'):null}catch(e){return null}});
  const updatePhoto=(url)=>{setProfilePhoto(url);try{if(url)localStorage.setItem('ellme_photo',url);else localStorage.removeItem('ellme_photo')}catch(e){}};
  const[waterNorm,setWaterNorm]=useState(2200);
  const[celebration,setCelebration]=useState(null);
  const[clientMenu,setClientMenu]=useState(null);
  const[clientProfileData,setClientProfileData]=useState(null); // client id for open menu

  // Detect password recovery redirect and send to /reset-password
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        window.location.replace('/reset-password' + hash);
      }
    }
  }, []);

  // ── Supabase auth listener ──
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }

    const loadProfile = async (session) => {
      if (!session?.user) { setUser(null); setAuthLoading(false); return; }
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
      if (typeof window !== 'undefined') {
        try {
          const params = new URLSearchParams(window.location.search);
          const oauthRole = params.get('oauth_role');
          if (oauthRole === 'doc' && profile.role === 'client') {
            await supabase.from('profiles').update({ role: 'doc' }).eq('id', u.id);
            profile.role = 'doc';
          }
          // Clean oauth_role from URL
          if (oauthRole) {
            params.delete('oauth_role');
            const cleanUrl = params.toString() ? '?' + params.toString() : '/';
            window.history.replaceState({}, '', cleanUrl);
          }
        } catch(e) {}
      }

      setUser({ id: u.id, role: profile.role || authRole, name: profile.name || authName, email: profile.email || authEmail, cid: u.id, waterNorm: profile.water_norm || 2200 });
      setWaterNorm(profile.water_norm || 2200);
      if (profile.photo_url) updatePhoto(profile.photo_url);

      // Handle invite linking — if client registered via invite link
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const inviteCode = params.get('invite');
        if (inviteCode && (profile.role || authRole) === 'client') {
          const { data: inv } = await supabase.from('invites').select('*').eq('code', inviteCode).eq('used', false).single();
          if (inv) {
            // Check if link already exists
            const { data: existing } = await supabase.from('doc_clients').select('id').eq('doc_id', inv.doc_id).eq('client_id', u.id).single();
            if (!existing) {
              await supabase.from('doc_clients').insert({ doc_id: inv.doc_id, client_id: u.id, status: 'active' });
            }
            await supabase.from('invites').update({ used: true, used_by: u.id }).eq('id', inv.id);
            // Clean URL
            window.history.replaceState({}, '', '/');
          }
        }
      }

      setAuthLoading(false);
    };

    // Проверяем hash — если в URL есть access_token (после Яндекс OAuth), устанавливаем сессию
    const hash2 = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash2.includes('access_token=')) {
      const params = new URLSearchParams(hash2.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ data: { session } }) => {
          window.history.replaceState({}, '', '/');
          loadProfile(session);
        });
      }
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => loadProfile(session));
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => loadProfile(session));
    return () => subscription.unsubscribe();
  }, []);

  // ── Database: load day ──
  const loadDayFromDb = async (pid, dateStr) => {
    if (!supabase || !pid) return null;
    try {
      const { data: day } = await supabase.from('diary_days').select('*').eq('user_id', pid).eq('date', dateStr).single();
      if (!day) return {};
      // Load meals for this day
      const { data: mealRows } = await supabase.from('meals').select('*').eq('diary_day_id', day.id);
      const meals = {};
      (mealRows || []).forEach(m => {
        meals[m.meal_type] = { time: m.time, hunger: m.hunger, text: m.description, feeling: m.feeling, feelingNote: m.feeling_note, photo: m.photo_url };
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
          feeling_note: m.feelingNote || '', photo_url: m.photo || null,
        }, { onConflict: 'diary_day_id,meal_type' });
      }
    } catch(e) { console.error('Save error:', e); }
  };

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
    // Compress image before upload (max 1200px, quality 0.82)
    const compressed = await compressImage(file, 1200, 0.82);
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
  // Loading: show nothing for first 1.5s, then show progress bar
  if (authLoading) {
    if (!showLoader) return <><style>{CSS}</style><div style={{minHeight:'100vh',background:C.bg}}/></>;
    return <><style>{CSS}</style><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg}}>
      <ProgressBar duration={5} label="Загрузка..."/>
    </div></>;
  }

  if(!user) return <><style>{CSS}</style><Login onLogin={login}/></>;

  const isDoc=user.role==='doc';
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
  const unread=!isDoc?(comments[user.cid]||[]).filter(c=>!c.read).length:0;

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
    const cm = {id:'cm'+Date.now(), date:dateKey, text, ts:Date.now(), read:false};
    setComments(p => {
      const list = [...(p[clientId]||[]), cm];
      return Object.assign({}, p, {[clientId]: list});
    });
    setDocComment('');
  };

  const goHome = () => { setScreen('home'); setSelMeal(null); setSelClient(null); };
  const openSupport = () => { window.open('https://t.me/ellme_support','_blank'); };

  const shell = ch => <div style={{minHeight:'100vh',background:C.bg,fontFamily:'var(--fb)'}}>
    <style>{CSS}</style>
    {lb && <Lightbox src={lb} onClose={()=>setLb(null)}/>}
    {celebration && <Celebration type={celebration} onClose={()=>setCelebration(null)}/>}
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
    {showNotif&&<div style={{position:'fixed',inset:0,zIndex:999,animation:'fadeIn .15s'}}>
      <div onClick={()=>setShowNotif(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.2)'}}/>
      <div style={{position:'absolute',top:0,right:0,bottom:0,width:'min(380px,92vw)',background:C.bg,boxShadow:C.shadowHover,overflowY:'auto',animation:'slideRight .25s',padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <span style={{fontSize:20,fontWeight:700,fontFamily:'var(--fd)'}}>Уведомления</span>
          <IcoBtn icon={I.x} onClick={()=>setShowNotif(false)}/>
        </div>
        {(comments[user.cid]||[]).length===0?<p style={{color:C.muted,textAlign:'center',padding:40}}>Нет уведомлений</p>
        :[...(comments[user.cid]||[])].reverse().map(c=><div key={c.id} onClick={()=>{markRead(user.cid,c.id);const ps=c.date.split('-');setDate(new Date(+ps[0],+ps[1]-1,+ps[2]));setShowNotif(false);setScreen('home');setSelMeal(null)}} style={{padding:16,borderRadius:16,background:c.read?C.surface:C.accentSoft,boxShadow:c.read?'none':C.shadowCard,marginBottom:10,cursor:'pointer',border:`1px solid ${c.read?C.surfaceAlt:'transparent'}`}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{c.date}</div>
          <p style={{fontSize:13,lineHeight:1.6,margin:0}}>{c.text}</p>
          <span style={{fontSize:12,color:C.accent,fontWeight:600,marginTop:6,display:'inline-block'}}>Перейти →</span>
        </div>)}
      </div>
    </div>}
    <div style={{maxWidth:520,margin:'0 auto',padding:'0 16px 48px'}}>
      {ch}
      <footer style={{marginTop:40,padding:'20px 0',borderTop:`1px solid ${C.surfaceAlt}`,textAlign:'center',fontSize:12,color:C.muted,lineHeight:2}}>
        <div>Разработано <a href="https://radema.ru" target="_blank" rel="noopener" style={{color:C.accent,textDecoration:'none',fontWeight:500}}>radema.ru</a></div>
        <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:4}}>
          <a href="/privacy" style={{color:C.muted,textDecoration:'none'}}>Политика конфиденциальности</a>
          <a href="/terms" style={{color:C.muted,textDecoration:'none'}}>Оферта</a>
        </div>
      </footer>
    </div>
  </div>;

  // ═══ PROFILE ═══
  if(screen==='profile') return shell(<Profile user={user} onBack={()=>setScreen('home')} onLogout={logout} photo={profilePhoto} onPhotoChange={updatePhoto} waterNorm={waterNorm} onWaterNormChange={setWaterNorm} onZoom={setLb}/>);

  // ═══ CLIENT — MEAL DETAIL ═══
  if(!isDoc&&selMeal)return shell(<>
    <MealDetail meal={MEALS.find(m=>m.id===selMeal)} data={meals[selMeal]} onChange={v=>updateMeal(activePid,selMeal,v)} onZoom={setLb} onBack={()=>setSelMeal(null)} dis={false} onUploadPhoto={handleUploadMealPhoto}/>
  </>);

  // ═══ CLIENT — HOME ═══
  if(!isDoc&&!selMeal)return shell(<>
    <TopBar left={<IcoBtn icon={I.support} onClick={openSupport}/>} title="ELLME" subtitle="Eat Live Love ME" onHome={goHome} right={<div style={{display:'flex',gap:4}}><IcoBtn icon={I.bell} badge={unread} onClick={()=>setShowNotif(true)}/><IcoBtn icon={I.user} onClick={()=>setScreen('profile')}/></div>}/>
    <Cal sel={date} onSelect={setDate}/>

    <SecCard icon={I.fork} title="Приёмы пищи">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,paddingTop:12}}>
        {MEALS.map((m,i) => <MealTile key={m.id} meal={m} data={meals[m.id]} onClick={()=>setSelMeal(m.id)} delay={i*0.05}/>)}
      </div>
    </SecCard>

    <DayExtras data={dayData} setData={v=>setDay(activePid,v)} dis={false} waterNorm={waterNorm} onCelebrate={setCelebration}/>
  </>);

  // ═══ DOCTOR ═══
  // Client meal detail
  if(isDoc&&screen==='clientMealDetail'&&selMeal&&selClient)return shell(<>
    <MealDetail meal={MEALS.find(m=>m.id===selMeal)} data={(getDay(selClient.id).meals||{})[selMeal]} onChange={()=>{}} onZoom={setLb} onBack={()=>{setSelMeal(null);setScreen('clientView')}} dis={true}/>
  </>);

  // Client profile (read-only)
  if(isDoc&&screen==='clientProfile'&&selClient){
    if(!clientProfileData&&supabase){supabase.from('profiles').select('*').eq('id',selClient.id).single().then(({data})=>{if(data)setClientProfileData(data)});}
    const cp=clientProfileData;
    return shell(<div style={{animation:'slideRight .3s ease'}}>
      <TopBar left={<BackBtn onClick={()=>{setScreen('clientView');setClientProfileData(null)}}/>} title="Профиль клиента" right={null}/>
      <div style={{textAlign:'center',marginBottom:20}}>
        <div style={{width:72,height:72,borderRadius:22,background:C.accentSoft,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px',fontSize:28,fontWeight:700,fontFamily:'var(--fd)',color:C.accent}}>{(selClient.nick||selClient.name).charAt(0)}</div>
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
      <TopBar left={<BackBtn onClick={()=>{setScreen('home');setSelClient(null);setDocComment('')}}/>} title={selClient.nick||selClient.name} right={<IcoBtn icon={I.user} onClick={()=>setScreen('clientProfile')}/>}/>
      <div style={{background:C.surface,borderRadius:16,padding:'12px 16px',marginBottom:12,boxShadow:C.shadowCard,display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:40,height:40,borderRadius:12,background:C.accentSoft,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,fontFamily:'var(--fd)',color:C.accent}}>{(selClient.nick||selClient.name).charAt(0)}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:C.soft}}>{selClient.request} · {selClient.age} лет</div>
          <div style={{fontSize:11,color:C.muted}}>Работает {daysBetween(selClient.joined,new Date())} дн.</div>
        </div>
        <button onClick={()=>setScreen('clientProfile')} style={{background:C.surfaceAlt,border:'none',cursor:'pointer',padding:'6px 12px',borderRadius:8,fontSize:12,color:C.accent,fontFamily:'inherit',fontWeight:500}}>Профиль</button>
      </div>
      <Cal sel={date} onSelect={setDate}/>
      <SecCard icon={I.fork} title="Приёмы пищи">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,paddingTop:12}}>
          {MEALS.map((m,i) => <MealTile key={m.id} meal={m} data={cm[m.id]} onClick={()=>{setSelMeal(m.id);setScreen('clientMealDetail')}} delay={i*0.05}/>)}
        </div>
      </SecCard>
      <DayExtras data={cd} setData={()=>{}} dis={true} waterNorm={waterNorm}/>

      <div style={{background:C.surface,borderRadius:20,padding:18,boxShadow:C.shadowCard,marginTop:16}}>
        <Lbl>Комментарий за день</Lbl>
        <textarea value={docComment} onChange={e=>setDocComment(e.target.value)} placeholder="Напишите клиенту..." rows={3}
          style={{width:'100%',padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.tileBorder}`,fontSize:14,fontFamily:'inherit',resize:'vertical',outline:'none',boxSizing:'border-box',background:C.surface,lineHeight:1.6,marginBottom:10}}
          onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.tileBorder}/>
        <button disabled={!docComment.trim()} onClick={()=>sendComment(selClient.id,key,docComment.trim())} style={{width:'100%',padding:'12px',borderRadius:14,border:'none',background:docComment.trim()?C.accent:'#ddd',color:docComment.trim()?'#fff':'#aaa',fontSize:14,fontWeight:600,cursor:docComment.trim()?'pointer':'default',fontFamily:'inherit'}}>Отправить</button>
        {(comments[selClient.id]||[]).filter(c=>c.date===key).map(c=><div key={c.id} style={{marginTop:10,padding:'12px 14px',borderRadius:12,background:C.surfaceAlt,fontSize:13,lineHeight:1.6}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{new Date(c.ts).toLocaleString('ru')}</div>{c.text}
        </div>)}
      </div>
    </>);
  }

  // My diary
  if(isDoc&&screen==='myDiary'){
    const md=getDay(user.id),mm=md.meals||{};
    return shell(<>
      <TopBar left={<BackBtn onClick={()=>setScreen('home')}/>} title="Мой дневник" right={<IcoBtn icon={I.user} onClick={()=>setScreen('profile')}/>}/>
      <Cal sel={date} onSelect={setDate}/>
      <SecCard icon={I.fork} title="Приёмы пищи">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,paddingTop:12}}>
          {MEALS.map((m,i) => <MealTile key={m.id} meal={m} data={mm[m.id]} onClick={()=>{setSelMeal(m.id);setScreen('myMealDetail')}} delay={i*0.05}/>)}
        </div>
      </SecCard>
      <DayExtras data={md} setData={v=>setDay(user.id,v)} dis={false} waterNorm={waterNorm} onCelebrate={setCelebration}/>
    </>);
  }

  // Doctor home — client list
  if(isDoc&&screen==='home'){
    const active=clients.filter(c=>c.status==='active'),archive=clients.filter(c=>c.status==='archive');
    const list=docTab==='active'?active:archive;
    const invLink=invCode?((typeof window!=='undefined'?window.location.origin:'https://ellme.ru')+'/?invite='+invCode):'';

    return shell(<>
      <TopBar left={<IcoBtn icon={I.support} onClick={openSupport}/>} title="ELLME" subtitle="Eat Live Love ME" onHome={goHome} right={<IcoBtn icon={I.user} onClick={()=>setScreen('profile')}/>}/>

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

      {list.map((c,i)=><div key={c.id} style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,animation:`enter .35s ease ${i*0.04}s both`}}>
        <button onClick={()=>{setSelClient(c);setScreen('clientView');setDate(new Date())}} className="card-hover" style={{flex:1,display:'flex',alignItems:'center',gap:12,padding:'16px',borderRadius:18,border:'none',background:C.surface,cursor:'pointer',textAlign:'left',fontFamily:'inherit',boxShadow:C.shadowCard,transition:'all .2s',transform:'perspective(400px) rotateX(0)'}}
          onMouseOver={e=>{e.currentTarget.style.transform='perspective(400px) rotateX(-2deg) translateY(-2px)';e.currentTarget.style.boxShadow=C.shadowHover}}
          onMouseOut={e=>{e.currentTarget.style.transform='perspective(400px) rotateX(0)';e.currentTarget.style.boxShadow=C.shadowCard}}>
          <div style={{width:42,height:42,borderRadius:14,background:C.surfaceAlt,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,fontFamily:'var(--fd)',color:C.accent}}>{(c.nick||c.name).charAt(0)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:600}}>{c.nick||c.name}</div>
            {c.nick&&<div style={{fontSize:11,color:C.muted}}>{c.name}</div>}
            <div style={{fontSize:12,color:C.soft,marginTop:1}}>{c.request} · {c.age}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:1}}>{daysBetween(c.joined,new Date())} дней</div>
          </div>
          <span style={{color:C.muted,display:'flex'}}>{I.chev}</span>
        </button>
        <div style={{position:'relative'}}>
          <button onClick={e=>{e.stopPropagation();setClientMenu(clientMenu===c.id?null:c.id)}} style={{background:C.surface,border:'none',cursor:'pointer',padding:10,borderRadius:12,color:C.muted,display:'flex',boxShadow:C.shadowCard,fontSize:18,lineHeight:1}}>⋮</button>
          {clientMenu===c.id&&<div style={{position:'absolute',right:0,top:44,background:C.surface,borderRadius:14,boxShadow:C.shadowHover,padding:6,zIndex:50,width:180,animation:'scaleIn .15s ease'}}>
            <button onClick={()=>{setRenaming(c);setRenameVal(c.nick||'');setClientMenu(null)}} style={{width:'100%',padding:'10px 14px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontFamily:'inherit',textAlign:'left',borderRadius:8,color:C.text,display:'flex',alignItems:'center',gap:8}}
              onMouseOver={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseOut={e=>e.currentTarget.style.background='transparent'}>{I.edit} Переименовать</button>
            <button onClick={()=>{toggleArchive(c.id);setClientMenu(null)}} style={{width:'100%',padding:'10px 14px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontFamily:'inherit',textAlign:'left',borderRadius:8,color:C.text,display:'flex',alignItems:'center',gap:8}}
              onMouseOver={e=>e.currentTarget.style.background=C.surfaceAlt} onMouseOut={e=>e.currentTarget.style.background='transparent'}>{c.status==='active'?I.archive:I.restore} {c.status==='active'?'В архив':'В активные'}</button>
            <button onClick={()=>deleteClient(c.id)} style={{width:'100%',padding:'10px 14px',border:'none',background:'transparent',cursor:'pointer',fontSize:13,fontFamily:'inherit',textAlign:'left',borderRadius:8,color:C.danger,display:'flex',alignItems:'center',gap:8}}
              onMouseOver={e=>e.currentTarget.style.background=C.dangerSoft} onMouseOut={e=>e.currentTarget.style.background='transparent'}>{I.x} Удалить</button>
          </div>}
        </div>
      </div>)}

      <button onClick={createInvite} style={{width:'100%',marginTop:10,padding:'14px',borderRadius:16,border:`1.5px dashed ${C.tileBorder}`,background:'transparent',cursor:'pointer',fontSize:14,fontWeight:500,color:C.muted,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .2s'}}
        onMouseOver={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent}} onMouseOut={e=>{e.currentTarget.style.borderColor=C.tileBorder;e.currentTarget.style.color=C.muted}}>
        {I.plus} Добавить клиента
      </button>

      {inv&&<div style={{position:'fixed',inset:0,zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn .15s'}}>
        <div onClick={()=>setInv(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.25)',backdropFilter:'blur(4px)'}}/>
        <div style={{position:'relative',background:C.surface,borderRadius:24,padding:28,width:'min(420px,90vw)',boxShadow:C.shadowHover,animation:'scaleIn .25s cubic-bezier(.16,1,.3,1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <span style={{color:C.accent,display:'flex'}}>{I.link}</span>
            <span style={{fontSize:18,fontWeight:700,fontFamily:'var(--fd)'}}>Пригласить клиента</span>
          </div>
          <p style={{fontSize:13,color:C.soft,lineHeight:1.6,margin:'0 0 14px'}}>Отправьте ссылку — клиент зарегистрируется и появится в вашем списке.</p>
          <div style={{display:'flex',gap:8}}>
            <input readOnly value={invLink} style={{flex:1,padding:'10px 12px',borderRadius:12,border:`1.5px solid ${C.tileBorder}`,fontSize:12,fontFamily:'monospace',background:C.surfaceAlt,outline:'none'}}/>
            <button onClick={()=>{navigator.clipboard?.writeText(invLink);setCopied(true);setTimeout(()=>setCopied(false),2000)}} style={{padding:'10px 18px',borderRadius:12,border:'none',background:C.accent,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',boxShadow:'0 2px 8px rgba(45,95,63,.2)'}}>{copied?'Готово':'Копировать'}</button>
          </div>
          <button onClick={()=>setInv(false)} style={{width:'100%',marginTop:14,padding:'10px',borderRadius:12,border:'none',background:C.surfaceAlt,color:C.soft,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Закрыть</button>
        </div>
      </div>}
    </>);
  }

  return shell(<div/>);
}

// ═══ IMAGE COMPRESSION UTILITY ═══
function compressImage(file, maxDim = 1200, quality = 0.82) {
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
