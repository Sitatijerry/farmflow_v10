import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { useAuth } from './hooks/useAuth'
import { useRecommendations } from './hooks/useRecommendations'
import { useTasks } from './hooks/useTasks'
import type { FarmRecommendation, RecommendationUrgency } from './api/recommendations'
import type { FarmTask, TaskPriority, TaskStatus } from './api/tasks'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const green = '#2d5016'
const FIELD_ID = '1'

type PageId = 'home' | 'tasks' | 'fields' | 'schedule' | 'alerts'

interface NavTab {
  id: PageId
  label: string
  icon: string
}

function BottomNav({ active, setActive }: { active: PageId; setActive: (page: PageId) => void }) {
  const tabs: NavTab[] = [
    { id: 'home', label: 'Home', icon: 'H' },
    { id: 'tasks', label: 'Tasks', icon: 'T' },
    { id: 'fields', label: 'Capture', icon: 'C' },
    { id: 'schedule', label: 'Plan', icon: 'P' },
    { id: 'alerts', label: 'Alerts', icon: 'A' },
  ]

  return (
    <nav style={{ background: green }} className="fixed bottom-0 left-0 right-0 z-10 flex justify-around py-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className={`flex min-w-14 flex-col items-center rounded-lg px-2 py-1 text-xs transition-all ${
            active === tab.id ? 'bg-white/20 text-white' : 'text-white/60'
          }`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 text-xs font-bold">
            {tab.icon}
          </span>
          <span className="mt-1">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

function formatToday() {
  return new Intl.DateTimeFormat('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date())
}

function recommendationUrgency(rec: FarmRecommendation): RecommendationUrgency {
  const urgency = rec.urgency?.toUpperCase()
  if (urgency === 'LOW' || urgency === 'MEDIUM' || urgency === 'HIGH' || urgency === 'CRITICAL') {
    return urgency
  }

  return 'MEDIUM'
}

function recommendationTitle(rec: FarmRecommendation) {
  return rec.title || rec.action || rec.rule_id || 'Farm Tip'
}

function recommendationBody(rec: FarmRecommendation) {
  return rec.description || rec.rationale || rec.action || 'Review this recommendation before starting field work.'
}

function recommendationTime(rec: FarmRecommendation) {
  if (!rec.created_at) return 'Today'

  return new Intl.DateTimeFormat('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(new Date(rec.created_at))
}

function RecommendationCard({ recommendation }: { recommendation: FarmRecommendation }) {
  const urgency = recommendationUrgency(recommendation)
  const styles: Record<RecommendationUrgency, { label: string; shell: string; icon: string }> = {
    CRITICAL: { label: 'Urgent', shell: 'border-red-100 bg-red-50 text-red-700', icon: '!' },
    HIGH: { label: 'Action Required', shell: 'border-orange-100 bg-orange-50 text-orange-700', icon: 'A' },
    MEDIUM: { label: 'Insight', shell: 'border-yellow-100 bg-yellow-50 text-yellow-700', icon: 'I' },
    LOW: { label: 'Daily Tip', shell: 'border-green-100 bg-green-50 text-green-700', icon: 'T' },
  }

  return (
    <article className={`rounded-xl border p-4 ${styles[urgency].shell}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-bold">
          {styles[urgency].icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide">{styles[urgency].label}</p>
            <p className="whitespace-nowrap text-xs opacity-70">{recommendationTime(recommendation)}</p>
          </div>
          <h3 className="mt-1 text-sm font-semibold text-gray-900">{recommendationTitle(recommendation)}</h3>
          <p className="mt-1 text-sm leading-5 text-gray-700">{recommendationBody(recommendation)}</p>
          {(recommendation.field_name || recommendation.crop_type) && (
            <p className="mt-2 text-xs text-gray-500">
              {[recommendation.field_name, recommendation.crop_type].filter(Boolean).join(' - ')}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function HomePage({ accessToken, setActive }: { accessToken?: string; setActive: (page: PageId) => void }) {
  const { tasks, summary } = useTasks(accessToken)
  const { recommendations, loading, error, reload } = useRecommendations(FIELD_ID, accessToken)
  const [showPastRecommendations, setShowPastRecommendations] = useState(false)
  const latestRecommendations = showPastRecommendations ? recommendations : recommendations.slice(0, 3)
  const activeRecommendations = recommendations.filter(rec => rec.status !== 'expired')
  const urgentCount = recommendations.filter(rec => {
    const urgency = recommendationUrgency(rec)
    return urgency === 'CRITICAL' || urgency === 'HIGH'
  }).length

  return (
    <div className="space-y-4 p-4">
      <header style={{ background: green }} className="rounded-2xl p-5 text-white">
        <p className="text-sm font-medium text-white/70">Good morning</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">FarmFlow Worker</h1>
            <p className="mt-1 text-sm text-white/80">Farm to Feed Kenya - Kiambu Region</p>
          </div>
          <p className="rounded-lg bg-white/15 px-2 py-1 text-right text-xs font-semibold">{formatToday()}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Tasks Today', value: summary.total || tasks.length, icon: 'T', color: '#dcfce7' },
          { label: 'Hours Logged', value: '4.5h', icon: 'H', color: '#fef9c3' },
          { label: 'Active Fields', value: '2', icon: 'F', color: '#dbeafe' },
          { label: 'Farm Tips', value: activeRecommendations.length, icon: 'R', color: '#fee2e2' },
        ].map(card => (
          <div key={card.label} style={{ background: card.color }} className="rounded-xl p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-sm font-bold">{card.icon}</div>
            <div className="mt-2 text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-gray-600">{card.label}</div>
          </div>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActive('tasks')}
          style={{ background: green }}
          className="rounded-xl px-3 py-3 text-sm font-semibold text-white"
        >
          View Tasks
        </button>
        <button
          type="button"
          onClick={() => setActive('fields')}
          className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-700"
        >
          Capture Image
        </button>
      </section>

      {urgentCount > 0 && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-red-600">Priority farm tips</span>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-red-600">{urgentCount}</span>
          </div>
          <p className="text-sm text-gray-700">Review high-priority recommendations before starting field work.</p>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Farm Tips</h2>
            <p className="text-xs text-gray-500">Daily recommendations for Block A</p>
          </div>
          <button type="button" onClick={reload} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm">
            Refresh
          </button>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-4 text-sm text-gray-500 shadow-sm">Loading farm tips...</div>
        )}

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>
        )}

        {!loading && recommendations.length === 0 && (
          <div className="rounded-xl bg-white p-4 text-sm text-gray-500 shadow-sm">No farm tips yet.</div>
        )}

        {!loading && latestRecommendations.map(recommendation => (
          <RecommendationCard key={recommendation.id} recommendation={recommendation} />
        ))}

        {recommendations.length > 3 && (
          <button
            type="button"
            onClick={() => setShowPastRecommendations(current => !current)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-700"
          >
            {showPastRecommendations ? 'Show Latest Recommendations' : 'View Past Recommendations'}
          </button>
        )}
      </section>
    </div>
  )
}

function LoginScreen({
  loading,
  error,
  onLogin,
}: {
  loading: boolean
  error: string | null
  onLogin: (email: string, password: string) => Promise<boolean>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (!email.trim() || !password) {
      setFormError('Enter your worker email and password.')
      return
    }

    await onLogin(email.trim(), password)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-50 px-4 py-6">
      <section style={{ background: green }} className="rounded-2xl p-5 text-white">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold">
          FF
        </div>
        <p className="text-sm font-medium text-white/75">Farm to Feed Kenya</p>
        <h1 className="mt-1 text-2xl font-bold leading-8">Worker Login</h1>
        <p className="mt-2 text-sm leading-5 text-white/80">Sign in to view today&apos;s farm tasks.</p>
      </section>

      <form onSubmit={submit} className="mt-5 space-y-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="worker-email" className="text-sm font-medium text-gray-700">Worker ID / Email</label>
          <input
            id="worker-email"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="worker@example.com"
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label htmlFor="worker-password" className="text-sm font-medium text-gray-700">Password</label>
          <input
            id="worker-password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
          />
        </div>

        {(formError || error) && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {formError || error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ background: loading ? '#e0e0e0' : '#4CAF50', color: loading ? '#9ca3af' : '#ffffff' }}
          className="w-full rounded-xl py-3 text-base font-semibold"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <button type="button" className="w-full py-1 text-center text-sm font-medium text-gray-500">
          Forgot ID?
        </button>
      </form>
    </main>
  )
}

function normalizePriority(priority?: string): TaskPriority {
  const normalized = priority?.toLowerCase()
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized
  }

  return 'medium'
}

function taskTime(task: FarmTask) {
  return task.due_time || task.start_time || task.scheduled_time || task.due_date || 'Today'
}

function taskLocation(task: FarmTask) {
  return task.location || task.field_name || task.fields?.field_name || task.fields?.name || 'Field location'
}

function taskCrop(task: FarmTask) {
  return task.crop_type || task.fields?.crop_type || 'Crop'
}

function taskDate(task: FarmTask) {
  if (!task.due_date) return formatToday()

  return new Intl.DateTimeFormat('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(task.due_date))
}

function taskInstructions(task: FarmTask) {
  if (Array.isArray(task.instructions) && task.instructions.length > 0) {
    return task.instructions
  }

  if (typeof task.instructions === 'string' && task.instructions.trim()) {
    return task.instructions.split('\n').filter(Boolean)
  }

  if (task.description?.trim()) {
    return [task.description]
  }

  return [
    'Check the assigned field before starting work.',
    'Follow the farm manager instruction for this task.',
    'Mark the task complete when the field work is finished.',
  ]
}

function TaskCompletionControls({
  task,
  updating,
  onStatusChange,
}: {
  task: FarmTask
  updating: boolean
  onStatusChange: (taskId: string, status: TaskStatus) => void
}) {
  const isDone = task.status === 'done'
  const isActive = task.status === 'in-progress'

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button
        type="button"
        disabled={updating || isActive || isDone}
        onClick={event => {
          event.stopPropagation()
          onStatusChange(task.id, 'in-progress')
        }}
        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
      >
        {isActive ? 'Started' : 'Start Task'}
      </button>
      <button
        type="button"
        disabled={updating || isDone}
        onClick={event => {
          event.stopPropagation()
          onStatusChange(task.id, 'done')
        }}
        style={{ background: isDone ? '#dcfce7' : green, color: isDone ? '#166534' : '#ffffff' }}
        className="rounded-lg px-3 py-2 text-sm font-semibold disabled:bg-gray-100 disabled:text-gray-400"
      >
        {isDone ? 'Completed' : updating ? 'Saving...' : 'Complete'}
      </button>
    </div>
  )
}

function TaskCard({
  task,
  updating,
  onStatusChange,
  onOpen,
}: {
  task: FarmTask
  updating: boolean
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onOpen: (taskId: string) => void
}) {
  const priority = normalizePriority(task.priority)
  const priorityStyles: Record<TaskPriority, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  }
  const statusText: Record<TaskStatus, string> = {
    pending: 'Pending',
    'in-progress': 'In progress',
    done: 'Done',
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task.id)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(task.id)
        }
      }}
      className="rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${priorityStyles[priority]}`}>
              {priority} priority
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
              {statusText[task.status]}
            </span>
          </div>
          <h3 className="text-base font-semibold leading-6 text-gray-900">{task.title}</h3>
        </div>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-green-700">
          {task.status === 'done' ? 'OK' : 'TO'}
        </div>
      </div>

      {task.description && <p className="mt-2 text-sm leading-5 text-gray-600">{task.description}</p>}

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div className="rounded-lg bg-gray-50 p-2">
          <span className="block font-medium text-gray-700">Time</span>
          {taskTime(task)}
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <span className="block font-medium text-gray-700">Location</span>
          {taskLocation(task)}
        </div>
      </div>

      <TaskCompletionControls task={task} updating={updating} onStatusChange={onStatusChange} />
    </article>
  )
}

function TaskDetailPage({
  task,
  updating,
  onBack,
  onStatusChange,
}: {
  task: FarmTask
  updating: boolean
  onBack: () => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}) {
  const [notes, setNotes] = useState('')
  const [proofName, setProofName] = useState('')
  const priority = normalizePriority(task.priority)
  const priorityStyles: Record<TaskPriority, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  }
  const statusText: Record<TaskStatus, string> = {
    pending: 'Pending',
    'in-progress': 'In progress',
    done: 'Done',
  }

  const openNavigation = () => {
    const destination = encodeURIComponent(taskLocation(task))
    window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-4 p-4">
      <button
        type="button"
        onClick={onBack}
        className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm"
      >
        Back
      </button>

      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${priorityStyles[priority]}`}>
            {priority} priority
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            {statusText[task.status]}
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-8 text-gray-900">{task.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{taskDate(task)} - {taskTime(task)}</p>
      </header>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Instructions</h2>
        <div className="mt-3 space-y-3">
          {taskInstructions(task).map((instruction, index) => (
            <div key={`${instruction}-${index}`} className="flex gap-3 text-sm leading-5 text-gray-700">
              <span style={{ background: green }} className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                {index + 1}
              </span>
              <p>{instruction}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Location</h2>
            <p className="mt-1 text-sm text-gray-600">{taskLocation(task)}</p>
            <p className="text-xs text-gray-400">{taskCrop(task)}</p>
          </div>
          <button
            type="button"
            onClick={openNavigation}
            className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
          >
            Navigate
          </button>
        </div>
        <div className="mt-4 flex h-32 items-center justify-center rounded-xl border border-dashed border-green-200 bg-green-50 text-center text-sm font-medium text-green-800">
          Field map preview
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <label htmlFor="worker-notes" className="text-lg font-semibold text-gray-900">Worker Notes</label>
        <textarea
          id="worker-notes"
          value={notes}
          onChange={event => setNotes(event.target.value)}
          rows={4}
          placeholder="Add field observations before completing..."
          className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:border-green-500"
        />
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Visual Proof</h2>
        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{proofName || 'Upload Image Proof'}</span>
          <span className="mt-1 text-xs text-gray-400">Camera or gallery image</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={event => setProofName(event.target.files?.[0]?.name || '')}
          />
        </label>
      </section>

      <button
        type="button"
        disabled={updating || task.status === 'done'}
        onClick={() => onStatusChange(task.id, 'done')}
        style={{ background: task.status === 'done' ? '#dcfce7' : green, color: task.status === 'done' ? '#166534' : '#ffffff' }}
        className="w-full rounded-xl py-3 text-base font-semibold disabled:bg-gray-100 disabled:text-gray-400"
      >
        {task.status === 'done' ? 'Task Completed' : updating ? 'Saving...' : 'Complete Task'}
      </button>
    </div>
  )
}

function DailyTasksPage({ accessToken }: { accessToken?: string }) {
  const { tasks, loading, error, updatingTaskId, summary, reload, setTaskStatus } = useTasks(accessToken)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const sortedTasks = useMemo(() => {
    const order: Record<TaskStatus, number> = { 'in-progress': 0, pending: 1, done: 2 }
    return [...tasks].sort((a, b) => order[a.status] - order[b.status])
  }, [tasks])
  const selectedTask = tasks.find(task => task.id === selectedTaskId)

  if (selectedTask) {
    return (
      <TaskDetailPage
        task={selectedTask}
        updating={updatingTaskId === selectedTask.id}
        onBack={() => setSelectedTaskId(null)}
        onStatusChange={setTaskStatus}
      />
    )
  }

  return (
    <div className="space-y-4 p-4">
      <header style={{ background: green }} className="rounded-2xl p-5 text-white">
        <p className="text-sm font-medium text-white/75">Githunguri Farm</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Daily Tasks</h1>
            <p className="mt-1 text-sm text-white/80">{formatToday()}</p>
          </div>
          <button
            type="button"
            onClick={reload}
            className="rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white"
          >
            Refresh
          </button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-gray-900">{summary.total}</p>
          <p className="text-xs text-gray-500">Assigned</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-blue-600">{summary.active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-green-600">{summary.completed}</p>
          <p className="text-xs text-gray-500">Done</p>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <div className="rounded-xl bg-white p-5 text-center text-sm text-gray-500 shadow-sm">Loading daily tasks...</div>}

      {!loading && sortedTasks.length === 0 && (
        <div className="rounded-xl bg-white p-5 text-center text-sm text-gray-500 shadow-sm">
          No daily tasks assigned yet.
        </div>
      )}

      {!loading && sortedTasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          updating={updatingTaskId === task.id}
          onStatusChange={setTaskStatus}
          onOpen={setSelectedTaskId}
        />
      ))}
    </div>
  )
}

type ImageType = 'crop' | 'soil' | 'pest' | 'irrigation' | 'disease'

function ImageCapturePage() {
  const [imageType, setImageType] = useState<ImageType>('crop')
  const [notes, setNotes] = useState('')
  const [imageName, setImageName] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'checking' | 'ready' | 'unavailable'>('checking')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable')
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => setGpsStatus('ready'),
      () => setGpsStatus('unavailable'),
      { enableHighAccuracy: true, timeout: 6000 },
    )
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const selectImage = (file?: File) => {
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setImageName(file.name)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const submit = async () => {
    setSubmitting(true)

    await fetch(`${API}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field_id: TEST_FIELD_ID,
        activity_type: `image-${imageType}`,
        hours_logged: 0,
        notes: notes || `Submitted ${imageType} field image${imageName ? `: ${imageName}` : ''}`,
      }),
    })

    setSubmitting(false)
    setSubmitted(true)
    setNotes('')
    window.setTimeout(() => setSubmitted(false), 3000)
  }

  const gpsCopy = {
    checking: 'Checking GPS',
    ready: 'GPS ready',
    unavailable: 'GPS unavailable',
  }

  const imageTypes: ImageType[] = ['crop', 'soil', 'pest', 'irrigation', 'disease']

  return (
    <div className="space-y-4 p-4">
      <header style={{ background: green }} className="rounded-2xl p-5 text-white">
        <p className="text-sm font-medium text-white/75">Githunguri Farm</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Image Capture</h1>
            <p className="mt-1 text-sm text-white/80">Block A - Kale</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
            gpsStatus === 'ready' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
          }`}>
            {gpsCopy[gpsStatus]}
          </span>
        </div>
      </header>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-gray-900">
          {previewUrl ? (
            <img src={previewUrl} alt="Selected field preview" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center text-white">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 text-lg font-bold">
                C
              </div>
              <p className="text-sm font-semibold">Preview</p>
              <p className="mt-1 text-xs text-white/60">Capture or upload a field image</p>
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs font-semibold text-white">
            {imageType.toUpperCase()}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            style={{ background: green }}
            className="rounded-xl px-3 py-3 text-sm font-semibold text-white"
          >
            Capture
          </button>
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700"
          >
            Upload
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={event => selectImage(event.target.files?.[0])}
          />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={event => selectImage(event.target.files?.[0])}
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <label htmlFor="image-type" className="text-sm font-medium text-gray-700">Image Type</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {imageTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setImageType(type)}
              style={imageType === type ? { background: green } : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${
                imageType === type ? 'text-white' : 'bg-gray-50 text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <label htmlFor="observation-notes" className="text-sm font-medium text-gray-700">Observation Notes</label>
        <textarea
          id="observation-notes"
          value={notes}
          onChange={event => setNotes(event.target.value)}
          rows={4}
          placeholder="Describe crop condition, pest signs, soil moisture, or irrigation issue..."
          className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:border-green-500"
        />
        {imageName && <p className="mt-2 text-xs text-gray-400">Selected: {imageName}</p>}
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        Image preview is captured locally. The current backend stores the observation activity only; photo storage can be wired when the upload endpoint is available.
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <button
          type="button"
          disabled={submitting}
          onClick={submit}
          style={{ background: submitting ? '#e0e0e0' : green, color: submitting ? '#9ca3af' : '#ffffff' }}
          className="w-full rounded-xl py-3 text-base font-semibold"
        >
          {submitted ? 'Field Data Submitted' : submitting ? 'Submitting...' : 'Submit Field Data'}
        </button>
      </div>
    </div>
  )
}

function SchedulePage() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date().getDay()
  const schedule = [
    { day: 'Mon', task: 'Irrigation check', field: 'Block A' },
    { day: 'Tue', task: 'Fertilizer application', field: 'Block B' },
    { day: 'Wed', task: 'Pest inspection', field: 'Block A' },
    { day: 'Thu', task: 'Harvest assessment', field: 'Block C' },
    { day: 'Fri', task: 'Water meter reading', field: 'All fields' },
  ]

  return (
    <div className="space-y-3 p-4">
      <h2 style={{ color: green }} className="text-xl font-bold">This Week</h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((day, index) => (
          <div
            key={day}
            style={{
              background: index + 1 === today ? green : '#f1f5f9',
              color: index + 1 === today ? 'white' : '#64748b',
            }}
            className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl text-xs font-medium"
          >
            <span>{day}</span>
            <span className="font-bold">{index + 8}</span>
          </div>
        ))}
      </div>
      {schedule.map(item => (
        <div key={item.day} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div style={{ background: green }} className="h-10 w-2 flex-shrink-0 rounded-full" />
          <div>
            <p className="text-sm font-medium text-gray-800">{item.task}</p>
            <p className="text-xs text-gray-500">{item.field} - {item.day}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

interface Notification {
  id: string
  title: string
  content: string
  created_at: string
  read?: boolean
  notification_type?: string
}

function AlertsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    fetch(`${API}/notifications`)
      .then(response => response.json())
      .then((data: { notifications?: Notification[] }) => setNotifications(data.notifications || []))
      .catch(() => {})
  }, [])

  const urgencyColor: Record<string, string> = {
    recommendation: '#fee2e2',
    task_assigned: '#dbeafe',
    deadline_approaching: '#fef9c3',
  }

  return (
    <div className="space-y-3 p-4">
      <h2 style={{ color: green }} className="text-xl font-bold">Alerts & Notifications</h2>
      {notifications.length === 0 && <p className="text-sm text-gray-500">No notifications yet.</p>}
      {notifications.map(notification => (
        <div
          key={notification.id}
          style={{ background: urgencyColor[notification.notification_type || ''] || '#f8fafc' }}
          className="rounded-xl border border-gray-100 p-4"
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-gray-800">{notification.title}</p>
            {!notification.read && <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />}
          </div>
          <p className="mt-1 text-sm text-gray-600">{notification.content}</p>
          <p className="mt-2 text-xs text-gray-400">{new Date(notification.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}

function WorkerApp({ user, accessToken, onSignOut }: { user: User; accessToken?: string; onSignOut: () => Promise<void> }) {
  const [active, setActive] = useState<PageId>('home')

  const pages: Record<PageId, JSX.Element> = {
    home: <HomePage accessToken={accessToken} setActive={setActive} />,
    tasks: <DailyTasksPage accessToken={accessToken} />,
    fields: <ImageCapturePage />,
    schedule: <SchedulePage />,
    alerts: <AlertsPage />,
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-gray-50 pb-20">
      <div style={{ background: green }} className="h-1 w-full" />
      <div className="flex items-center justify-between bg-white px-4 py-2 text-xs text-gray-500">
        <span className="truncate pr-3">{user.email}</span>
        <button type="button" onClick={onSignOut} className="font-semibold text-gray-700">Sign out</button>
      </div>
      {pages[active]}
      <BottomNav active={active} setActive={setActive} />
    </div>
  )
}

export default function App() {
  const { session, user, loading, error, signIn, signOut } = useAuth()

  if (loading && !session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-gray-50 p-4 text-sm text-gray-500">
        Loading worker session...
      </div>
    )
  }

  if (!session || !user) {
    return <LoginScreen loading={loading} error={error} onLogin={signIn} />
  }

  return <WorkerApp user={user} accessToken={session.access_token} onSignOut={signOut} />
}
