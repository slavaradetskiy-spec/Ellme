import './globals.css'

export const metadata = {
  title: 'ELLME – дневник питания',
  description: 'Пространство осознанного отношения к себе, своему здоровью и питанию. Подходит для самостоятельного ведения или совместной работы с нутрициологом.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  manifest: '/manifest.json',
  themeColor: '#2D5F3F',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ELLME',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
