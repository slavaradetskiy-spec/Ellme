'use client'
import dynamic from 'next/dynamic'
import { Component } from 'react'

const NutriTrack = dynamic(() => import('../components/NutriTrack'), { ssr: false })

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('ELLME crash:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'sans-serif', textAlign: 'center' }}>
          <h2 style={{ color: '#B8453A' }}>Что-то пошло не так</h2>
          <p style={{ color: '#666', fontSize: 14 }}>Попробуйте обновить страницу</p>
          <button onClick={() => window.location.reload()} style={{
            marginTop: 16, padding: '12px 24px', borderRadius: 12, border: 'none',
            background: '#2D5F3F', color: '#fff', fontSize: 15, cursor: 'pointer'
          }}>Обновить</button>
          <details style={{ marginTop: 24, textAlign: 'left', fontSize: 11, color: '#999' }}>
            <summary>Подробности ошибки</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: 8 }}>
              {this.state.error?.message}{'\n'}{this.state.error?.stack}
            </pre>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Home() {
  return <ErrorBoundary><NutriTrack /></ErrorBoundary>
}
