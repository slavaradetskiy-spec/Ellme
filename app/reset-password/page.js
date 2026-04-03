'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

let supabase = null
const sbUrl = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : null
const sbKey = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : null
if (sbUrl && sbKey && sbUrl !== 'undefined') supabase = createClient(sbUrl, sbKey)

const C = { bg:'#F4F1EB', surface:'#FFFFFF', accent:'#2D5F3F', accentSoft:'#E3EFE7', text:'#1A1A1A', muted:'#ABABAB', soft:'#6B6B6B', tileBorder:'#E8E4DC', danger:'#D32F2F', dangerSoft:'#FDECEA' }

const eyeOpen = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const eyeClosed = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
const fieldStyle = { width:'100%', padding:'16px 48px 16px 18px', borderRadius:16, border:'1.5px solid #E8E4DC', fontSize:15, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', boxSizing:'border-box', background:'#FFFFFF', color:'#1A1A1A', marginBottom:12 }
const eyeStyle = { position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#ABABAB', display:'flex', padding:2 }

export default function ResetPasswordPage() {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) { setStatus('expired'); return }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      setStatus(prev => {
        if (prev === 'success') return 'success'
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') return 'ready'
        return prev
      })
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus('ready')
      else setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session: s2 } }) => {
          setStatus(prev => prev === 'success' ? 'success' : s2 ? 'ready' : 'expired')
        })
      }, 2000)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (!pw || !pw2) { setError('Заполните оба поля'); return }
    if (pw !== pw2) { setError('Пароли не совпадают'); return }
    if (pw.length < 6) { setError('Минимум 6 символов'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password: pw })
    if (err) setError(err.message === 'New password should be different from the old password.' ? 'Новый пароль должен отличаться от текущего' : err.message)
    else {
      setStatus('success')
      try { await supabase.auth.signOut({ scope: 'global' }) } catch(e) {}
      // Force clear all Supabase auth storage
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) localStorage.removeItem(key)
        })
        Object.keys(sessionStorage || {}).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) sessionStorage.removeItem(key)
        })
      } catch(e) {}
      setTimeout(() => { window.location.href = '/' }, 2000)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, fontFamily:"'Plus Jakarta Sans',sans-serif", padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <h1 style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:28, fontWeight:400, margin:'0 0 4px' }}>
            {status === 'success' ? 'Готово!' : 'Смена пароля'}
          </h1>
          {status === 'ready' && <p style={{ fontSize:13, color:C.muted }}>Введите новый пароль</p>}
        </div>

        {status === 'loading' && <div style={{ textAlign:'center', padding:40 }}><p style={{ color:C.muted, fontSize:14 }}>Проверяем ссылку...</p></div>}

        {status === 'expired' && <div style={{ textAlign:'center', padding:20 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>⏰</div>
          <p style={{ color:C.soft, fontSize:14, lineHeight:1.6, marginBottom:24 }}>Ссылка недействительна или истекла. Запросите восстановление пароля заново.</p>
          <a href="/" style={{ display:'inline-block', padding:'14px 32px', borderRadius:16, background:C.accent, color:'#fff', fontSize:15, fontWeight:600, textDecoration:'none' }}>На главную</a>
        </div>}

        {status === 'ready' && <>
          {error && <div style={{ padding:'12px 16px', borderRadius:12, background:C.dangerSoft, color:C.danger, fontSize:13, marginBottom:12 }}>{error}</div>}
          <div style={{ position:'relative' }}>
            <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="Новый пароль (мин. 6 символов)" style={fieldStyle} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={eyeStyle}>{showPw ? eyeOpen : eyeClosed}</button>
          </div>
          <div style={{ position:'relative' }}>
            <input type={showPw2 ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Повторите пароль" style={fieldStyle}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }} />
            <button type="button" onClick={() => setShowPw2(!showPw2)} style={eyeStyle}>{showPw2 ? eyeOpen : eyeClosed}</button>
          </div>
          <button disabled={loading} onClick={handleSubmit} style={{
            width:'100%', padding:'16px', borderRadius:16, border:'none',
            background: pw && pw2 ? C.accent : '#ccc', color:'#fff',
            fontSize:16, fontWeight:600, cursor: loading ? 'wait' : 'pointer',
            fontFamily:'inherit', marginTop:4, boxShadow:'0 2px 12px rgba(45,95,63,.2)',
            opacity: loading ? 0.7 : 1
          }}>{loading ? 'Сохраняю...' : 'Сохранить новый пароль'}</button>
        </>}

        {status === 'success' && <div style={{ textAlign:'center', padding:20 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
          <p style={{ color:C.soft, fontSize:14, lineHeight:1.6, marginBottom:24 }}>Пароль успешно обновлён. Теперь вы можете войти с новым паролем.</p>
          <button onClick={async()=>{try{await supabase.auth.signOut()}catch(e){}window.location.href='/'}} style={{ display:'inline-block', padding:'14px 32px', borderRadius:16, background:C.accent, color:'#fff', fontSize:15, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit' }}>Войти</button>
        </div>}
      </div>
    </div>
  )
}
