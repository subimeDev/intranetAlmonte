'use client'
import Link from 'next/link'
import { CSSProperties } from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'lg'
}

const Logo = ({ className = '', size = 'lg' }: LogoProps) => {
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

