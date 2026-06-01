import { motion } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props {
  children: React.ReactNode
  onClick?: () => void
  variant?: Variant
  disabled?: boolean
  className?: string
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-white font-bold shadow-[0_4px_0_#46A302] active:shadow-none active:translate-y-1 hover:brightness-110',
  secondary:
    'bg-sky text-white font-bold shadow-[0_4px_0_#1295d4] active:shadow-none active:translate-y-1 hover:brightness-110',
  ghost:
    'bg-transparent border-2 border-border text-gray-600 font-semibold hover:bg-gray-100',
  danger:
    'bg-hearts text-white font-bold shadow-[0_4px_0_#cc3b3b] active:shadow-none active:translate-y-1 hover:brightness-110',
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  fullWidth = false,
}: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-2xl px-6 py-3 text-lg transition-all duration-100 select-none
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
