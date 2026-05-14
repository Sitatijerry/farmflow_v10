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


// API Configuration - Avoid double /api issue
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const API_BASE_URL = BASE_URL.endsWith('/api') 
  ? BASE_URL 
  : `${BASE_URL}/api`

async function request<T>(
  path: string, 
  accessToken?: string, 
  init?: RequestInit
): Promise<T> {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const url = `${API_BASE_URL}${cleanPath}`

  console.log(`🌐 API Request: ${init?.method || 'GET'} ${url}`)

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers,
      },
      ...init,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`❌ API Error ${response.status}:`, errorText)
      throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`)
    }

    return await response.json() as T

  } catch (error) {
    console.error(`🚨 Network Error calling ${url}:`, error)
    throw error
  }
}

export async function fetchTasks(accessToken?: string): Promise<FarmTask[]> {
  try {
    const data = await request<{ tasks?: FarmTask[] }>('/tasks', accessToken)
    return data.tasks ?? []
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    throw error
  }
}

export async function updateTaskStatus(
  taskId: string, 
  status: TaskStatus, 
  accessToken?: string
): Promise<FarmTask> {
  try {
    const data = await request<{ task?: FarmTask }>(`/tasks/${taskId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })

    return data.task ?? { id: taskId, title: '', status } as FarmTask
  } catch (error) {
    console.error(`Failed to update task ${taskId}:`, error)
    throw error
  }
}