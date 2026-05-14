import { useEffect, useState, FormEvent } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const green = '#2D5A27'

interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in-progress' | 'done'
  priority?: string
  due_date?: string
  field_name?: string
  worker_name?: string
}

export default function WorkerTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [workerId, setWorkerId] = useState(localStorage.getItem('farmflow_worker_id') || '')
  const [inputId, setInputId] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchTasks = async (id: string) => {
    setLoading(true)
    setStatusMsg('')
    try {
      const res = await fetch(`${API}/api/tasks?assigned_to=${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to load tasks')
      setTasks(data.tasks || [])
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Error loading tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (workerId) {
      void fetchTasks(workerId)
    }
  }, [workerId])

  const handleLogin = (e: FormEvent) => {
    e.preventDefault()
    if (!inputId.trim()) return
    localStorage.setItem('farmflow_worker_id', inputId.trim())
    setWorkerId(inputId.trim())
  }

  const updateStatus = async (taskId: string, status: string) => {
    setUpdatingId(taskId)
    setStatusMsg('')
    try {
      const res = await fetch(`${API}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Update failed')

      setStatusMsg(`Task marked as ${status}`)
      await fetchTasks(workerId)
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : 'Failed to update task')
    } finally {
      setUpdatingId(null)
    }
  }

  if (!workerId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-sm rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">FarmFlow Worker</h1>
          <p className="mt-1 text-sm text-gray-500">Enter your Worker ID to view assigned tasks.</p>
          <form onSubmit={handleLogin} className="mt-4 space-y-3">
            <input
              type="number"
              value={inputId}
              onChange={e => setInputId(e.target.value)}
              placeholder="Worker ID (e.g. 3)"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700"
              required
            />
            <button
              type="submit"
              style={{ backgroundColor: green }}
              className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white"
            >
              View My Tasks
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-sm text-gray-500">Worker ID: {workerId}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('farmflow_worker_id')
              setWorkerId('')
              setTasks([])
            }}
            className="rounded-lg bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
          >
            Change Worker
          </button>
        </div>

        {statusMsg && (
          <div className={`mt-3 rounded-lg p-3 text-sm ${statusMsg.includes('failed') || statusMsg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {statusMsg}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-gray-500">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <div className="mt-6 rounded-xl bg-white p-6 text-center shadow-sm">
            <p className="text-gray-500">No tasks assigned right now.</p>
            <button
              onClick={() => fetchTasks(workerId)}
              className="mt-3 text-sm font-semibold text-green-700 underline"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{task.description || 'No additional details.'}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="rounded bg-gray-100 px-2 py-1">{task.field_name || 'Field'}</span>
                      <span className="rounded bg-gray-100 px-2 py-1">Due: {task.due_date || 'Not set'}</span>
                      <span className="rounded bg-gray-100 px-2 py-1 capitalize">Priority: {task.priority || 'medium'}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                    task.status === 'done' ? 'bg-green-50 text-green-700' :
                    task.status === 'in-progress' ? 'bg-blue-50 text-blue-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>
                    {task.status}
                  </span>
                </div>

                {task.status !== 'done' && (
                  <div className="mt-3 flex gap-2">
                    {task.status === 'pending' && (
                      <button
                        disabled={updatingId === task.id}
                        onClick={() => updateStatus(task.id, 'in-progress')}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {updatingId === task.id ? 'Updating...' : 'Start Task'}
                      </button>
                    )}
                    <button
                      disabled={updatingId === task.id}
                      onClick={() => updateStatus(task.id, 'done')}
                      style={{ backgroundColor: green }}
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {updatingId === task.id ? 'Updating...' : 'Mark Done'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}