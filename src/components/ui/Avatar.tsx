import { AVATARS } from '@/data/constants'

interface Props {
  avatarId: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'text-xl w-8 h-8',
  md: 'text-3xl w-12 h-12',
  lg: 'text-5xl w-20 h-20',
  xl: 'text-7xl w-28 h-28',
}

export function Avatar({ avatarId, size = 'md', className = '' }: Props) {
  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0]
  return (
    <div className={`rounded-full flex items-center justify-center bg-surface border-2 border-border ${sizeMap[size]} ${className}`}>
      <span>{avatar.emoji}</span>
    </div>
  )
}

interface SelectorProps {
  selected: number
  onChange: (id: number) => void
}

export function AvatarSelector({ selected, onChange }: SelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARS.map((a) => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          className={`
            rounded-2xl p-2 text-4xl flex flex-col items-center gap-1 border-2 transition-all
            ${selected === a.id ? 'border-primary bg-primary/10 scale-110' : 'border-border hover:border-gray-300'}
          `}
        >
          <span>{a.emoji}</span>
          <span className="text-xs text-gray-500">{a.label}</span>
        </button>
      ))}
    </div>
  )
}
