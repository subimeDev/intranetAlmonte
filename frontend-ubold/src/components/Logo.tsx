'use client'
import Image from 'next/image'
import Link from 'next/link'
import { CSSProperties } from 'react'

// Si tienes una imagen del logo, descomenta estas líneas y reemplaza la ruta:
// import logoMoraleja from '@/assets/images/logo-moraleja.png'
// import logoMoralejaSm from '@/assets/images/logo-moraleja-sm.png'

interface LogoProps {
  className?: string
  size?: 'sm' | 'lg'
  useImage?: boolean // Si quieres usar imagen en lugar de texto
}

const Logo = ({ className = '', size = 'lg', useImage = false }: LogoProps) => {
  // Si quieres usar una imagen, descomenta esto:
  // if (useImage) {
  //   return (
  //     <Link href="/" className={className} style={{ textDecoration: 'none' }}>
  //       <Image 
  //         src={size === 'sm' ? logoMoralejaSm : logoMoraleja} 
  //         alt="MORALEJA Logo" 
  //         width={size === 'sm' ? 80 : 120} 
  //         height={size === 'sm' ? 22 : 30}
  //         style={{ objectFit: 'contain' }}
  //       />
  //     </Link>
  //   )
  // }

  // Versión con texto estilizado (actual)
  const logoStyle: CSSProperties = {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontWeight: 'bold',
    fontSize: size === 'sm' ? '14px' : '20px',
    color: '#14b8a6', // Color teal/verde azulado más brillante
    letterSpacing: '1px',
    textTransform: 'uppercase',
    textDecoration: 'none',
    display: 'inline-block',
    lineHeight: '1.2',
    padding: size === 'sm' ? '4px 8px' : '6px 12px',
    backgroundColor: '#000000', // Fondo negro
    borderRadius: '4px',
  }

  return (
    <Link href="/" className={className} style={{ textDecoration: 'none' }}>
      <span style={logoStyle}>MORALEJA</span>
    </Link>
  )
}

export default Logo

