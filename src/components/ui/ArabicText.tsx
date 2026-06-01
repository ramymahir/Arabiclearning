interface Props {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl'
}

const sizeMap = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
  '7xl': 'text-7xl',
  '8xl': 'text-8xl',
}

export function ArabicText({ children, className = '', size = 'xl' }: Props) {
  return (
    <span dir="rtl" lang="ar" className={`font-arabic leading-loose ${sizeMap[size]} ${className}`}>
      {children}
    </span>
  )
}
