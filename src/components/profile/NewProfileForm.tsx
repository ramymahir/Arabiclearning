import { useState } from 'react'
import { motion } from 'framer-motion'
import { AvatarSelector } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (name: string, avatar: number) => void
}

export function NewProfileForm({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(1)

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim(), avatar)
    setName('')
    setAvatar(1)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-3xl p-6 mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-5">👤 New Learner</h2>

        <label className="block text-sm font-semibold text-gray-600 mb-2">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Enter name..."
          maxLength={20}
          autoFocus
          className="w-full border-2 border-border rounded-2xl px-4 py-3 text-lg outline-none focus:border-primary mb-4"
        />

        <label className="block text-sm font-semibold text-gray-600 mb-2">Choose Avatar</label>
        <AvatarSelector selected={avatar} onChange={setAvatar} />

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="flex-1">
            Start! 🚀
          </Button>
        </div>
      </div>
    </Modal>
  )
}
