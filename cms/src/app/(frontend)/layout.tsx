import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Panel EJH PRIVÉ',
  title: 'Panel EJH PRIVÉ',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
