import { useMemo, useState } from 'react'
import { Flame, Clock, CheckCircle2, BookOpen } from 'lucide-react'
import { calculateLearningStats, type JournalPost } from '../../lib/journal'

type LearningHeatmapProps = {
  posts: JournalPost[]
  subjectsCount: number
}

export default function LearningHeatmap({ posts, subjectsCount }: LearningHeatmapProps) {
  const [referenceTime] = useState(() => Date.now())
  const stats = useMemo(() => calculateLearningStats(posts), [posts])

  // Generate last 60 days for heatmap
  const days = useMemo(() => {
    const list: { dateStr: string; dayLabel: string; count: number }[] = []
    const today = new Date(referenceTime)
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      list.push({
        dateStr,
        dayLabel,
        count: stats.activityDates[dateStr] || 0,
      })
    }
    return list
  }, [stats.activityDates, referenceTime])

  const totalHours = Math.round((stats.totalStudyMinutes / 60) * 10) / 10

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-6 shadow-xs space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Streak */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-orange-50/80 border border-orange-200/70 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Flame size={20} className={stats.streakDays > 0 ? 'fill-orange-500' : ''} />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-black text-orange-950 leading-tight">
              {stats.streakDays} {stats.streakDays === 1 ? 'Day' : 'Days'}
            </p>
            <p className="text-[11px] font-semibold text-orange-800/80 truncate">Learning Streak</p>
          </div>
        </div>

        {/* Study Time */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/70 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-black text-blue-950 leading-tight">
              {totalHours > 0 ? `${totalHours} hrs` : `${stats.totalStudyMinutes} m`}
            </p>
            <p className="text-[11px] font-semibold text-blue-800/80 truncate">Study Focus</p>
          </div>
        </div>

        {/* Questions Solved */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-black text-emerald-950 leading-tight">
              {stats.totalQuestionsAnswered}
            </p>
            <p className="text-[11px] font-semibold text-emerald-800/80 truncate">Q&As Solved</p>
          </div>
        </div>

        {/* Subjects Explored */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-purple-50/80 border border-purple-200/70 flex items-center gap-3">
          <div className="size-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-black text-purple-950 leading-tight">{subjectsCount}</p>
            <p className="text-[11px] font-semibold text-purple-800/80 truncate">Subjects</p>
          </div>
        </div>
      </div>

      {/* 60-Day Consistency Heatmap */}
      <div className="pt-2 border-t border-[var(--color-border)]/60">
        <div className="flex items-center justify-between text-xs text-[var(--color-muted)] mb-2 font-medium">
          <span>Journaling Activity (Last 60 Days)</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Less</span>
            <span className="size-2.5 rounded-xs bg-gray-100" />
            <span className="size-2.5 rounded-xs bg-[var(--color-primary-soft)]/50" />
            <span className="size-2.5 rounded-xs bg-[var(--color-primary)]" />
            <span>More</span>
          </div>
        </div>

        {/* Grid of days */}
        <div className="grid grid-flow-col grid-rows-4 sm:grid-rows-3 gap-1.5 overflow-x-auto pb-1">
          {days.map((d) => {
            let bgClass = 'bg-gray-100 hover:ring-1 hover:ring-gray-300'
            if (d.count >= 3) {
              bgClass = 'bg-[var(--color-primary)] text-white hover:opacity-90'
            } else if (d.count === 2) {
              bgClass = 'bg-[var(--color-primary)]/75 hover:opacity-90'
            } else if (d.count === 1) {
              bgClass = 'bg-[var(--color-primary-soft)] hover:opacity-90'
            }

            return (
              <div
                key={d.dateStr}
                title={`${d.dayLabel}: ${d.count} ${d.count === 1 ? 'post' : 'posts'}`}
                className={`size-3.5 sm:size-4 rounded-xs transition-transform cursor-pointer hover:scale-125 ${bgClass}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
