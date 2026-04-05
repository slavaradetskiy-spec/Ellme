import dynamic from 'next/dynamic'

const NutriTrack = dynamic(() => import('../components/NutriTrack'), { ssr: false })

export default function Home() {
  return <NutriTrack />
}
