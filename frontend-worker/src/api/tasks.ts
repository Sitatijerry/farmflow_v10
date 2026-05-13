export type TaskStatus = 'pending' | 'in-progress' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'

export interface TaskField {
  id?: string
  name?: string
  field_name?: string
  crop_type?: string
}

export interface FarmTask {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority?: TaskPriority | string
  due_date?: string
  due_time?: string
  start_time?: string
  scheduled_time?: string
  instructions?: string[] | string
  location?: string
  field_name?: string
  crop_type?: string
  fields?: TaskField | null
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request<T>(path: string, accessToken?: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function fetchTasks(accessToken?: string): Promise<FarmTask[]> {
  const data = await request<{ tasks?: FarmTask[] }>('/tasks', accessToken)
  return data.tasks ?? []
}

export async function updateTaskStatus(taskId: string, status: TaskStatus, accessToken?: string): Promise<FarmTask[]> {
  const data = await request<{ task?: FarmTask[] }>(`/tasks/${taskId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

  return data.task ?? []
}
