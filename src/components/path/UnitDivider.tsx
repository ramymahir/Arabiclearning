import type { LessonUnit } from '@/types'
import { ArabicText } from '@/components/ui/ArabicText'

interface Props {
  unit: LessonUnit
}

export function UnitDivider({ unit }: Props) {
  return (
    <div className={`${unit.bgColor} text-white rounded-2xl py-4 px-6 mx-4 my-3 shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-lg">{unit.title}</div>
          <div className="text-white/80 text-sm">{unit.description}</div>
        </div>
        <ArabicText size="3xl" className="text-white/90">
          {unit.titleArabic}
        </ArabicText>
      </div>
    </div>
  )
}
