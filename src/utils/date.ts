export const todayStr = (): string => new Date().toISOString().slice(0, 10)

export const yesterdayStr = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export const minutesSince = (ts: number): number =>
  Math.floor((Date.now() - ts) / 60000)
