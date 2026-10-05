import { useMemo, useState } from 'react'
import { Flame, BookOpen, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { calculateLearningStats, type JournalPost } from '../../lib/journal'

type LearningHeatmapProps = {
  posts: JournalPost[]
  subjectsCount: number
}

type ViewMode = '30days' | 'month'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function LearningHeatmap({ posts, subjectsCount }: LearningHeatmapProps) {
  const [referenceTime] = useState(() => Date.now())
  const [viewMode, setViewMode] = useState<ViewMode>('30days')
  const [monthOffset, setMonthOffset] = useState(0) // 0 = current month, -1 = last month, etc.

  const stats = useMemo(() => calculateLearningStats(posts), [posts])

  // Last 30 Days data
  const days30 = useMemo(() => {
    const list: { dateStr: string; dayLabel: string; shortDate: string; count: number; dayOfWeek: string }[] = []
    const today = new Date(referenceTime)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const shortDate = String(d.getDate())
      const dayOfWeek = WEEKDAYS[d.getDay()]
      list.push({
        dateStr,
        dayLabel,
        shortDate,
        dayOfWeek,
        count: stats.activityDates[dateStr] || 0,
      })
    }
    return list
  }, [stats.activityDates, referenceTime])

  const totalEntries30Days = useMemo(() => {
    return days30.reduce((acc, d) => acc + d.count, 0)
  }, [days30])

  const activeDays30Days = useMemo(() => {
    return days30.filter((d) => d.count > 0).length
  }, [days30])

  // Month-wise calendar calculation
  const currentMonthDate = useMemo(() => {
    const base = new Date(referenceTime)
    base.setDate(1) // set to 1st to avoid overflow issues
    base.setMonth(base.getMonth() + monthOffset)
    return base
  }, [referenceTime, monthOffset])

  const monthYearLabel = useMemo(() => {
    return currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [currentMonthDate])

  const monthCalendarData = useMemo(() => {
    const year = currentMonthDate.getFullYear()
    const month = currentMonthDate.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()

    const daysList: { dayNumber: number; dateStr: string; dayLabel: string; count: number; isToday: boolean }[] = []
    const todayStr = new Date(referenceTime).toISOString().split('T')[0]

    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(month + 1).padStart(2, '0')
      const dayStr = String(day).padStart(2, '0')
      const dateStr = `${year}-${monthStr}-${dayStr}`
      const dayLabel = `${currentMonthDate.toLocaleDateString('en-US', { month: 'short' })} ${day}`
      daysList.push({
        dayNumber: day,
        dateStr,
        dayLabel,
        count: stats.activityDates[dateStr] || 0,
        isToday: dateStr === todayStr,
      })
    }

    return {
      firstDayIndex,
      daysList,
      totalEntries: daysList.reduce((acc, d) => acc + d.count, 0),
      activeDays: daysList.filter((d) => d.count > 0).length,
    }
  }, [currentMonthDate, stats.activityDates, referenceTime])

  function getHeatClass(count: number, isToday: boolean = false) {
    if (count >= 3) {
      return 'bg-[var(--color-primary)] text-white hover:opacity-90 font-bold shadow-2xs'
    }
    if (count === 2) {
      return 'bg-[var(--color-primary)]/80 text-white hover:opacity-90 font-bold shadow-2xs'
    }
    if (count === 1) {
      return 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/80 font-semibold'
    }
    return isToday
      ? 'bg-gray-50 text-[var(--color-foreground)] border border-[var(--color-primary)] font-semibold'
      : 'bg-gray-50/80 text-[var(--color-muted)] hover:bg-gray-100'
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-6 shadow-xs space-y-5">
      {/* Metric Cards: Streak & Subjects */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* Journaling Activity Section */}
      <div className="pt-2 border-t border-[var(--color-border)]/60 space-y-3">
        {/* View Switcher & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[var(--color-primary)]" />
            <h3 className="text-sm font-bold text-[var(--color-foreground)]">
              {viewMode === '30days' ? 'Last 30 Days Activity' : 'Monthly Activity Calendar'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[var(--color-muted)] font-medium">
              {viewMode === '30days'
                ? `${activeDays30Days} active days • ${totalEntries30Days} entries`
                : `${monthCalendarData.activeDays} active days • ${monthCalendarData.totalEntries} entries`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-gray-50/70 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('30days')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === '30days'
                    ? 'bg-white text-[var(--color-primary)] shadow-2xs font-bold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-[var(--color-primary)] shadow-2xs font-bold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                }`}
              >
                Month Wise
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: Last 30 Days */}
        {viewMode === '30days' && (
          <div className="space-y-2">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5 sm:gap-2">
              {days30.map((d) => (
                <div
                  key={d.dateStr}
                  title={`${d.dayLabel} (${d.dayOfWeek}): ${d.count} ${d.count === 1 ? 'entry' : 'entries'}`}
                  className={`p-2 rounded-xl text-center border border-black/5 transition-all cursor-pointer hover:scale-105 flex flex-col justify-between aspect-square ${getHeatClass(
                    d.count
                  )}`}
                >
                  <span className="text-[10px] opacity-70 leading-none">{d.dayOfWeek}</span>
                  <span className="text-xs sm:text-sm font-bold leading-none my-0.5">{d.shortDate}</span>
                  <span className="text-[9px] opacity-80 leading-none">
                    {d.count > 0 ? `${d.count}p` : '·'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] pt-1">
              <span>Showing last 30 daily logs</span>
              <div className="flex items-center gap-1.5">
                <span>0</span>
                <span className="size-2.5 rounded-xs bg-gray-100 border border-gray-200" />
                <span className="size-2.5 rounded-xs bg-[var(--color-primary-soft)]" />
                <span className="size-2.5 rounded-xs bg-[var(--color-primary)]" />
                <span>3+ entries</span>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Month Wise Calendar */}
        {viewMode === 'month' && (
          <div className="space-y-3">
            {/* Month Navigator */}
            <div className="flex items-center justify-between bg-gray-50/70 border border-[var(--color-border)] rounded-xl px-3 py-1.5">
              <button
                type="button"
                onClick={() => setMonthOffset((prev) => prev - 1)}
                className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-white transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-[var(--color-foreground)]">
                  {monthYearLabel}
                </span>
                {monthOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => setMonthOffset(0)}
                    className="text-[10px] font-semibold text-[var(--color-primary)] px-2 py-0.5 rounded-full bg-[var(--color-primary-soft)]/30 hover:bg-[var(--color-primary-soft)]/50 transition-colors cursor-pointer"
                  >
                    Current
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMonthOffset((prev) => prev + 1)}
                className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-white transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--color-muted)]">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-0.5">
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {/* Empty leading slots */}
              {Array.from({ length: monthCalendarData.firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-lg bg-transparent" />
              ))}

              {/* Month days */}
              {monthCalendarData.daysList.map((d) => (
                <div
                  key={d.dateStr}
                  title={`${d.dayLabel}: ${d.count} ${d.count === 1 ? 'entry' : 'entries'}${
                    d.isToday ? ' (Today)' : ''
                  }`}
                  className={`aspect-square p-1 rounded-lg text-center flex flex-col items-center justify-between border border-black/5 transition-transform hover:scale-105 cursor-pointer ${getHeatClass(
                    d.count,
                    d.isToday
                  )}`}
                >
                  <span className="text-[11px] leading-tight font-medium">{d.dayNumber}</span>
                  {d.count > 0 ? (
                    <span className="size-1.5 rounded-full bg-current opacity-80" />
                  ) : d.isToday ? (
                    <span className="text-[8px] leading-none uppercase text-[var(--color-primary)] font-bold">
                      today
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] pt-1">
              <span>{monthCalendarData.totalEntries} entries logged in {monthYearLabel}</span>
              <div className="flex items-center gap-1.5">
                <span>0</span>
                <span className="size-2.5 rounded-xs bg-gray-50 border border-gray-200" />
                <span className="size-2.5 rounded-xs bg-[var(--color-primary-soft)]" />
                <span className="size-2.5 rounded-xs bg-[var(--color-primary)]" />
                <span>3+ entries</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
