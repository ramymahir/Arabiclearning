import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { ProfileCard } from '@/components/profile/ProfileCard'
import { NewProfileForm } from '@/components/profile/NewProfileForm'
import { Button } from '@/components/ui/Button'
import { ArabicText } from '@/components/ui/ArabicText'
import { MAX_PROFILES } from '@/data/constants'
import { audioManager } from '@/audio/audioManager'

export function ProfilePage() {
  const navigate = useNavigate()
  const { profiles, setActiveProfile, addProfile, removeProfile } = useProfileStore()
  const { getProgress, initProfile } = useProgressStore()
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    audioManager.init()
    setActiveProfile(id)
    initProfile(id)
    navigate('/home')
  }

  const handleAdd = (name: string, avatar: number) => {
    const id = addProfile(name, avatar)
    handleSelect(id)
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) removeProfile(deleteTarget)
    setDeleteTarget(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-sky/10 flex flex-col items-center px-4 py-10 font-ui">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-6xl mb-2">🌙</div>
        <h1 className="text-4xl font-black text-gray-800">نور</h1>
        <p className="text-xl font-bold text-gray-600">Arabic Reading Adventure</p>
        <div className="mt-2">
          <ArabicText size="base" className="text-gray-500">تعلّم القراءة العربية</ArabicText>
        </div>
      </motion.div>

      {/* Profiles */}
      {profiles.length > 0 ? (
        <div className="w-full max-w-sm space-y-3 mb-6">
          <h2 className="font-bold text-gray-600 text-center">Who's learning today?</h2>
          {profiles.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <ProfileCard
                profile={profile}
                progress={getProgress(profile.id)}
                onSelect={() => handleSelect(profile.id)}
                onDelete={() => setDeleteTarget(profile.id)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8 p-8 bg-white rounded-3xl shadow-sm border border-border"
        >
          <div className="text-5xl mb-3">👋</div>
          <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
          <p className="text-gray-500">Create a profile to start your Arabic learning journey!</p>
        </motion.div>
      )}

      {/* Add profile */}
      {profiles.length < MAX_PROFILES && (
        <Button onClick={() => setShowForm(true)} variant="secondary" className="w-full max-w-sm">
          + Add Learner
        </Button>
      )}

      <NewProfileForm open={showForm} onClose={() => setShowForm(false)} onSave={handleAdd} />

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-xl font-bold mb-2">Delete profile?</h3>
            <p className="text-gray-500 mb-5">All progress will be lost!</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm} className="flex-1">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
