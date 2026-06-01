export const letterBounceIn = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.25, 1],
    opacity: 1,
    transition: { duration: 0.55, times: [0, 0.7, 1], ease: 'easeOut' },
  },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } },
}

export const slideUp = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
}

export const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export const staggerItem = {
  initial: { opacity: 0, y: 20, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20 } },
}

export const xpFloat = {
  initial: { opacity: 1, y: 0, scale: 1 },
  animate: {
    opacity: [1, 1, 0],
    y: [0, -30, -60],
    scale: [1, 1.2, 0.8],
    transition: { duration: 1.2, times: [0, 0.4, 1] },
  },
}

export const shakeX = {
  animate: {
    x: [0, -12, 12, -8, 8, -4, 4, 0],
    transition: { duration: 0.45 },
  },
}

export const popIn = {
  initial: { scale: 0 },
  animate: { scale: 1, transition: { type: 'spring', stiffness: 400, damping: 15 } },
}

export const scalePress = {
  whileTap: { scale: 0.93 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}
