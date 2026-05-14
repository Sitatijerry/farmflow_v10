'use client'

import { useEffect, useMemo, useState, FormEvent } from 'react'
import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const green = '#2D5A27'
const fallbackFieldId = '1'

type Tab = 'dashboard' | 'operations' | 'plots' | 'analytics' | 'settings'
type TaskStatus = 'pending' | 'in-progress' | 'done'
type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  assigned_to?: string
  worker_name?: string
  due_date?: string
  field_name?: string
  crop_type?: string
}

interface Recommendation {
  id: string
  rule_id?: string
  title?: string
  description?: string
  action?: string
  rationale?: string
  urgency: Urgency
  created_at?: string
  field_name?: string
  crop_type?: string
}

interface Activity {
  id: string
  activity_type?: string
  description?: string
  notes?: string
  duration_minutes?: number
  hours_logged?: number
  location?: string
  created_at?: string
  field_name?: string
}

interface Field {
  id: string
  name: string
  farm_id?: string | number
  crop_type?: string
}

interface Worker {
  id: string
  name: string
  role: string
  contact: string
  assigned_sector: string
  login_id: string
}

interface WorkerForm {
  name: string
  role: string
  contact: string
  assigned_sector: string
  password: string
}

const yieldData = [
  { month: 'Jan', forecast: 8.2, actual: 7.9 },
  { month: 'Feb', forecast: 9.1, actual: 8.7 },
  { month: 'Mar', forecast: 7.8, actual: 8.1 },
  { month: 'Apr', forecast: 10.2, actual: 9.6 },
  { month: 'May', forecast: 9.8, actual: 9.4 },
  { month: 'Jun', forecast: 11.0, actual: 10.2 },
]

const resourceData = [
  { name: 'Water', value: 42, color: '#2196F3' },
  { name: 'Fertilizer', value: 24, color: '#FBC02D' },
  { name: 'Seeds', value: 18, color: '#A5D6A7' },
  { name: 'Labor', value: 16, color: '#757575' },
]

const resourceTrend = [
  { day: 'Mon', water: 31, power: 18 },
  { day: 'Tue', water: 38, power: 22 },
  { day: 'Wed', water: 42, power: 24 },
  { day: 'Thu', water: 35, power: 20 },
  { day: 'Fri', water: 47, power: 29 },
  { day: 'Sat', water: 40, power: 23 },
]

const plots = [
  { name: 'Block A', crop: 'Kale', health: 82, moisture: 38, status: 'Needs attention', color: '#FBC02D' },
  { name: 'Block B', crop: 'Spinach', health: 91, moisture: 52, status: 'Healthy', color: '#4CAF50' },
  { name: 'Block C', crop: 'Cabbage', health: 67, moisture: 29, status: 'Critical', color: '#D32F2F' },
  { name: 'Block D', crop: 'Tomatoes', health: 88, moisture: 47, status: 'Healthy', color: '#4CAF50' },
]

function safeUrgency(value?: string): Urgency {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'CRITICAL') return value
  return 'MEDIUM'
}

function recommendationText(rec: Recommendation) {
  return rec.description || rec.rationale || rec.action || 'Review recommendation details.'
}

function statusClasses(status: TaskStatus) {
  if (status === 'done') return 'bg-green-50 text-green-700'
  if (status === 'in-progress') return 'bg-blue-50 text-blue-700'
  return 'bg-yellow-50 text-yellow-700'
}

function taskProgress(status: TaskStatus) {
  if (status === 'done') return 100
  if (status === 'in-progress') return 58
  return 18
}

function activityText(activity: Activity) {
  return activity.description || activity.notes || activity.activity_type || 'Field activity logged'
}

function formatActivityTime(value?: string) {
  if (!value) return 'Recently'
  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-gray-100 bg-white shadow-sm ${className}`}>{children}</section>
}

function StatCard({ label, value, detail, color }: { label: string; value: string | number; detail: string; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <span style={{ backgroundColor: color }} className="h-3 w-3 rounded-full" />
      </div>
      <p className="mt-3 text-xs text-gray-500">{detail}</p>
    </Card>
  )
}

function AlertCard({ recommendation }: { recommendation: Recommendation }) {
  const urgency = safeUrgency(recommendation.urgency)
  const color = {
    CRITICAL: '#D32F2F',
    HIGH: '#F97316',
    MEDIUM: '#FBC02D',
    LOW: '#4CAF50',
  }[urgency]

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p style={{ color }} className="text-xs font-bold uppercase">{urgency}</p>
          <h3 className="mt-1 text-sm font-semibold text-gray-900">{recommendation.title || recommendation.rule_id || 'AI Recommendation'}</h3>
          <p className="mt-1 text-sm leading-5 text-gray-600">{recommendationText(recommendation)}</p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-500">
          {recommendation.field_name || 'Block A'}
        </span>
      </div>
    </div>
  )
}

function DashboardView({
  tasks,
  recommendations,
  setTab,
}: {
  tasks: Task[]
  recommendations: Recommendation[]
  setTab: (tab: Tab) => void
}) {
  const critical = recommendations.filter(rec => safeUrgency(rec.urgency) === 'CRITICAL').length
  const high = recommendations.filter(rec => safeUrgency(rec.urgency) === 'HIGH').length
  const activeTasks = tasks.filter(task => task.status !== 'done').length
  const done = tasks.filter(task => task.status === 'done').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Critical Alerts" value={critical} detail="Immediate manager review" color="#D32F2F" />
        <StatCard label="High Priority" value={high} detail="Action needed today" color="#F97316" />
        <StatCard label="Active Tasks" value={activeTasks} detail={`${done} completed`} color={green} />
        <StatCard label="Expected Yield" value="10.2 t/ha" detail="+6% vs last season" color="#2196F3" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Weather Widget</h2>
              <p className="text-sm text-gray-500">Githunguri Farm, Kiambu</p>
            </div>
            <button onClick={() => setTab('operations')} style={{ backgroundColor: green }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white">
              Schedule Next Task
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Temperature</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">24 C</p>
              <p className="text-xs text-red-600">+2.3 C anomaly</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Humidity</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">68%</p>
              <p className="text-xs text-gray-500">Nominal</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Soil Moisture</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">38%</p>
              <p className="text-xs text-amber-700">Irrigation watch</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-gray-900">AI Alert Center</h2>
          <div className="mt-4 space-y-3">
            {recommendations.slice(0, 3).map(rec => <AlertCard key={rec.id} recommendation={rec} />)}
            {recommendations.length === 0 && <p className="text-sm text-gray-500">No AI alerts yet.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-xl font-semibold text-gray-900">Activity Feed</h2>
          <div className="mt-4 space-y-3">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.field_name || 'Field task'} {task.due_date ? `- ${task.due_date}` : ''}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClasses(task.status)}`}>{task.status}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-gray-900">Yield Forecast vs Actual</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yieldData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="forecast" fill="#A5D6A7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill={green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}

function OperationsView({
  tasks,
  activities,
  fields,
  workers,
  onTaskCreated,
}: {
  tasks: Task[]
  activities: Activity[]
  fields: Field[]
  workers: Worker[]
  onTaskCreated: () => void
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [selectedPlot, setSelectedPlot] = useState(plots[0])
  const visibleTasks = statusFilter === 'all' ? tasks : tasks.filter(task => task.status === statusFilter)
  const activeTasks = tasks.filter(task => task.status !== 'done').length
  const inProgress = tasks.filter(task => task.status === 'in-progress').length
  const completed = tasks.filter(task => task.status === 'done').length

  const [taskForm, setTaskForm] = useState({
    taskType: 'Irrigation check',
    fieldId: '',
    assignedTo: '',
    priority: 'Medium',
    dueDate: '',
    description: '',
  })
  const [creating, setCreating] = useState(false)
  const [createStatus, setCreateStatus] = useState<string | null>(null)

  useEffect(() => {
    if (fields.length > 0 && !taskForm.fieldId) {
      setTaskForm(prev => ({ ...prev, fieldId: String(fields[0].id) }))
    }
  }, [fields])

  useEffect(() => {
    if (workers.length > 0 && !taskForm.assignedTo) {
      setTaskForm(prev => ({ ...prev, assignedTo: String(workers[0].id) }))
    }
  }, [workers])

  const handleCreateTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    setCreateStatus(null)

    try {
      const field = fields.find(f => String(f.id) === String(taskForm.fieldId))
      if (!field) throw new Error('Please select a field')

      const priorityMap: Record<string, string> = {
        High: 'high',
        Medium: 'medium',
        Low: 'low',
      }

      const response = await fetch(`${API}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farm_id: parseInt(String(field.farm_id || 1)),
          field_id: parseInt(String(taskForm.fieldId)),
          assigned_to: parseInt(String(taskForm.assignedTo)),
          assigned_by: 1,
          title: taskForm.taskType,
          description: taskForm.description || `${taskForm.taskType} for ${field.name}`,
          priority: priorityMap[taskForm.priority] || 'medium',
          due_date: taskForm.dueDate || null,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Failed to create task')

      setCreateStatus('Task created successfully!')
      setTaskForm({
        taskType: 'Irrigation check',
        fieldId: String(fields[0]?.id || ''),
        assignedTo: String(workers[0]?.id || ''),
        priority: 'Medium',
        dueDate: '',
        description: '',
      })
      onTaskCreated()
    } catch (err) {
      setCreateStatus(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active Queue" value={activeTasks} detail="Pending or in progress" color={green} />
        <StatCard label="In Progress" value={inProgress} detail="Workers currently assigned" color="#2196F3" />
        <StatCard label="Completed" value={completed} detail="Closed tasks" color="#4CAF50" />
        <StatCard label="Water Use" value="47 m3" detail="+12% from yesterday" color="#FBC02D" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Active Task Queue</h2>
              <p className="text-sm text-gray-500">Track progress, status, assigned field, and worker handoff.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'in-progress', 'done'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${statusFilter === status ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-3">Task</th>
                  <th>Field</th>
                  <th>Assigned Worker</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleTasks.map(task => {
                  const progress = taskProgress(task.status)
                  return (
                    <tr key={task.id}>
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.description || 'No task notes'}</p>
                      </td>
                      <td className="text-gray-600">{task.field_name || 'Unassigned'}</td>
                      <td className="text-gray-600">{task.worker_name || task.assigned_to || 'Worker pending'}</td>
                      <td><span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClasses(task.status)}`}>{task.status}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-32 rounded-full bg-gray-100">
                            <div style={{ width: `${progress}%`, backgroundColor: green }} className="h-2 rounded-full" />
                          </div>
                          <span className="text-xs text-gray-500">{progress}%</span>
                        </div>
                      </td>
                      <td className="text-gray-600">{task.due_date || 'Today'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {visibleTasks.length === 0 && <p className="py-6 text-sm text-gray-500">No tasks match this filter.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-gray-900">Schedule Next Task</h2>
          <p className="mt-1 text-sm text-gray-500">Create a task and assign it to a worker.</p>
          <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Task Type
              <select value={taskForm.taskType} onChange={e => setTaskForm({ ...taskForm, taskType: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700">
                <option>Irrigation check</option>
                <option>Pest inspection</option>
                <option>Fertilizer application</option>
                <option>Harvest assessment</option>
                <option>Weeding</option>
                <option>Soil sampling</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Field
              <select value={taskForm.fieldId} onChange={e => setTaskForm({ ...taskForm, fieldId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700">
                {fields.map(field => (
                  <option key={field.id} value={String(field.id)}>
                    {field.name}{field.crop_type ? ` - ${field.crop_type}` : ''}
                  </option>
                ))}
                {fields.length === 0 && <option value="">No fields available</option>}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Assign To
              <select value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700">
                {workers.map(worker => (
                  <option key={worker.id} value={String(worker.id)}>{worker.name}</option>
                ))}
                {workers.length === 0 && <option value="">No workers available</option>}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Priority
              <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Due Date
              <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700" />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Notes
              <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                rows={3} placeholder="Optional instructions for the worker..."
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700" />
            </label>

            <button type="submit" disabled={creating || fields.length === 0 || workers.length === 0}
              style={{ backgroundColor: creating || fields.length === 0 || workers.length === 0 ? '#BDBDBD' : green }}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white">
              {creating ? 'Creating Task...' : 'Create Task'}
            </button>
          </form>

          {createStatus && (
            <p className={`mt-3 rounded-lg p-3 text-sm ${createStatus.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {createStatus}
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <h2 className="text-xl font-semibold text-gray-900">Resource Usage Monitor</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={resourceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {resourceData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={resourceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="water" stroke="#2196F3" strokeWidth={3} />
                  <Line type="monotone" dataKey="power" stroke="#FBC02D" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Live Field Monitoring</h2>
              <p className="text-sm text-gray-500">Mini-map view of plot health and active work zones.</p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">4 sectors online</span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
            <div className="grid min-h-[300px] grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
              {plots.map((plot, index) => (
                <button key={plot.name} onClick={() => setSelectedPlot(plot)}
                  className="relative rounded-lg border bg-white p-4 text-left transition hover:shadow-sm"
                  style={{ borderColor: selectedPlot.name === plot.name ? green : '#e5e7eb' }}>
                  <div style={{ backgroundColor: plot.color }} className="mb-3 h-2 rounded-full" />
                  <p className="text-sm font-semibold text-gray-900">{plot.name}</p>
                  <p className="text-xs text-gray-500">{plot.crop}</p>
                  <span className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-green-800">
                    {index + 1}
                  </span>
                </button>
              ))}
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Selected sector</p>
              <h3 className="mt-1 text-2xl font-semibold text-gray-900">{selectedPlot.name}</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Health</span><span className="font-semibold">{selectedPlot.health}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Moisture</span><span className="font-semibold">{selectedPlot.moisture}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-semibold">{selectedPlot.status}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Active worker</span><span className="font-semibold">Field team</span></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-xl font-semibold text-gray-900">Recent Worker Activity</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activities.slice(0, 6).map(activity => (
            <div key={activity.id} className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">{activity.activity_type || 'Activity'}</p>
              <p className="mt-1 text-sm text-gray-600">{activityText(activity)}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{activity.field_name || activity.location || 'Field'}</span>
                <span>{formatActivityTime(activity.created_at)}</span>
              </div>
            </div>
          ))}
          {activities.length === 0 && <p className="text-sm text-gray-500">No worker activity logs yet.</p>}
        </div>
      </Card>
    </div>
  )
}

function PlotsView() {
  const [selectedPlot, setSelectedPlot] = useState(plots[0])

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <Card className="p-5">
        <h2 className="text-xl font-semibold text-gray-900">Interactive Farm Map</h2>
        <div className="mt-4 grid min-h-[420px] grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4">
          {plots.map(plot => (
            <button key={plot.name} onClick={() => setSelectedPlot(plot)}
              className="rounded-lg border bg-white p-4 text-left transition hover:shadow-sm"
              style={{ borderColor: selectedPlot.name === plot.name ? green : '#e5e7eb' }}>
              <div style={{ backgroundColor: plot.color }} className="mb-4 h-3 rounded-full" />
              <p className="font-semibold text-gray-900">{plot.name}</p>
              <p className="text-sm text-gray-500">{plot.crop}</p>
              <p className="mt-6 text-xs text-gray-500">Health {plot.health}%</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-semibold text-gray-900">Sector Details</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Selected plot</p>
            <p className="text-2xl font-semibold text-gray-900">{selectedPlot.name}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Health Index</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{selectedPlot.health}%</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Current Moisture</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{selectedPlot.moisture}%</p>
          </div>
          <button style={{ backgroundColor: green }} className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white">
            Open Boundary Editor
          </button>
        </div>
      </Card>
    </div>
  )
}

function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-xl font-semibold text-gray-900">Yield Trends</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yieldData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eeeeee" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="forecast" stroke="#A5D6A7" strokeWidth={3} />
                <Line type="monotone" dataKey="actual" stroke={green} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-gray-900">Resource Allocation</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resourceData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {resourceData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-xl font-semibold text-gray-900">Performance Audit Table</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="py-3">Plot</th>
                <th>Crop</th>
                <th>Health</th>
                <th>Moisture</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plots.map(plot => (
                <tr key={plot.name}>
                  <td className="py-3 font-medium text-gray-900">{plot.name}</td>
                  <td>{plot.crop}</td>
                  <td>{plot.health}%</td>
                  <td>{plot.moisture}%</td>
                  <td>{plot.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function SettingsView() {
  const [form, setForm] = useState<WorkerForm>({
    name: '',
    role: 'Field Worker',
    contact: '',
    assigned_sector: 'Block A',
    password: '',
  })
  const [workers, setWorkers] = useState<Worker[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const createWorker = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch(`${API}/api/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Worker creation failed')

      setWorkers(current => [data.worker, ...current])
      setStatus(`Worker created. Worker ID: ${data.worker.id} | Login: ${data.worker.contact}`)
      setForm({ name: '', role: 'Field Worker', contact: '', assigned_sector: 'Block A', password: '' })
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Worker creation failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-5">
        <h2 className="text-xl font-semibold text-gray-900">Profile Identity</h2>
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">Githunguri Farm Manager</p>
          <p className="text-sm text-gray-500">Farm to Feed Kenya - Kiambu</p>
        </div>

        <h2 className="mt-6 text-xl font-semibold text-gray-900">Operational Integrations</h2>
        <div className="mt-4 space-y-3">
          {['Open-Meteo climate feed', 'Supabase Auth', 'Worker mobile app'].map(item => (
            <div key={item} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm">
              <span className="text-gray-700">{item}</span>
              <span className="font-semibold text-green-700">Connected</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-semibold text-gray-900">Access Hierarchy</h2>
        <p className="mt-1 text-sm text-gray-500">Create farm workers for the mobile worker login.</p>

        <form onSubmit={createWorker} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Name
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700" />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Role
            <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700" />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Contact Email
            <input type="email" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} required
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700" />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Assigned Sector
            <select value={form.assigned_sector} onChange={e => setForm({ ...form, assigned_sector: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700">
              {plots.map(plot => <option key={plot.name}>{plot.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700 md:col-span-2">
            Temporary Password
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              required minLength={6}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-green-700" />
          </label>
          <button disabled={submitting} style={{ backgroundColor: submitting ? '#BDBDBD' : green }}
            className="rounded-lg px-4 py-3 text-sm font-semibold text-white md:col-span-2">
            {submitting ? 'Creating Worker...' : 'Create Worker Login'}
          </button>
        </form>

        {status && <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{status}</p>}

        <div className="mt-6 space-y-3">
          {workers.map(worker => (
            <div key={worker.id} className="rounded-lg border border-gray-100 p-3">
              <p className="font-semibold text-gray-900">{worker.name}</p>
              <p className="text-sm text-gray-500">{worker.role} - {worker.assigned_sector}</p>
              <p className="text-xs text-gray-500">Login: {worker.contact}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function FarmManagerDashboard() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [fields, setFields] = useState<Field[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string>(fallbackFieldId)
  const [selectedFarmId, setSelectedFarmId] = useState<string>('1')
  const [tasks, setTasks] = useState<Task[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkers = async () => {
    try {
      const res = await fetch(`${API}/api/workers`)
      const data = await res.json()
      if (res.ok) setWorkers(data.workers || [])
    } catch (e) {
      console.error('Failed to load workers:', e)
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [taskResponse, fieldResponse, activityResponse] = await Promise.all([
        fetch(`${API}/api/tasks`),
        fetch(`${API}/api/fields`),
        fetch(`${API}/api/activities`),
      ])

      const taskData = await taskResponse.json()
      const fieldData = await fieldResponse.json()
      const activityData = await activityResponse.json()

      if (!taskResponse.ok) throw new Error(taskData.detail || 'Unable to load tasks')
      if (!fieldResponse.ok) throw new Error(fieldData.detail || 'Unable to load fields')
      if (!activityResponse.ok) throw new Error(activityData.detail || 'Unable to load activities')

      setTasks(taskData.tasks || [])
      const nextFields: Field[] = fieldData.fields || []
      setFields(nextFields)

      if (nextFields.length > 0) {
        setSelectedFieldId(String(nextFields[0].id))
        setSelectedFarmId(String(nextFields[0].farm_id || '1'))
      }

      setActivities(activityData.activities || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    void fetchWorkers()
  }, [])

  useEffect(() => {
    async function loadRecommendations() {
      if (!selectedFieldId) return
      try {
        const res = await fetch(`${API}/api/recommend/${selectedFieldId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Unable to load recommendations')
        setRecommendations((data.recommendations || []).map((rec: Recommendation) => ({
          ...rec,
          urgency: safeUrgency(rec.urgency),
        })))
      } catch (e) {
        console.error('Recommendations error:', e)
      }
    }
    void loadRecommendations()
  }, [selectedFieldId])

  const navItems: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'operations', label: 'Operations' },
    { id: 'plots', label: 'Plots' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ]

  const content = useMemo(() => {
    if (tab === 'operations') return (
      <OperationsView
        tasks={tasks}
        activities={activities}
        fields={fields}
        workers={workers}
        onTaskCreated={loadData}
      />
    )
    if (tab === 'plots') return <PlotsView />
    if (tab === 'analytics') return <AnalyticsView />
    if (tab === 'settings') return <SettingsView />
    return <DashboardView tasks={tasks} recommendations={recommendations} setTab={setTab} />
  }, [activities, fields, recommendations, tab, tasks, workers])

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#212121]">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-gray-200 bg-white p-5 lg:block">
        <div>
          <p style={{ color: green }} className="text-2xl font-semibold">FarmFlow</p>
          <p className="mt-1 text-sm text-gray-500">Manager Command Center</p>
        </div>
        <nav className="mt-8 space-y-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${tab === item.id ? 'bg-green-50 text-green-800' : 'text-gray-600 hover:bg-gray-50'}`}>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Farm to Feed Kenya</p>
              <h1 className="text-3xl font-semibold text-gray-900">{navItems.find(item => item.id === tab)?.label}</h1>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <label className="text-xs font-semibold text-gray-500">
                Field
                <select value={selectedFieldId}
                  onChange={e => {
                    const newFieldId = e.target.value
                    setSelectedFieldId(newFieldId)
                    const field = fields.find(f => String(f.id) === newFieldId)
                    if (field?.farm_id) setSelectedFarmId(String(field.farm_id))
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-700 md:w-56">
                  {fields.length === 0 && <option value={fallbackFieldId}>Field {fallbackFieldId}</option>}
                  {fields.map(field => (
                    <option key={field.id} value={String(field.id)}>
                      {field.name}{field.crop_type ? ` - ${field.crop_type}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${tab === item.id ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {loading && <Card className="p-5 text-sm text-gray-500">Loading farm dashboard...</Card>}
          {error && <Card className="border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</Card>}
          {!loading && !error && content}
        </main>
      </div>
    </div>
  )
}