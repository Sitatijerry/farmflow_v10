import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchTasks, updateTaskStatus, type FarmTask, type TaskStatus } from '../api/tasks'

export function useTasks(accessToken?: string) {
  const [tasks, setTasks] = useState<FarmTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const nextTasks = await fetchTasks(accessToken)
      setTasks(nextTasks)
    } catch {
      setError('Unable to load tasks. Check the backend connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  const setTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    const previousTasks = tasks
    setUpdatingTaskId(taskId)
    setError(null)
    setTasks(currentTasks => currentTasks.map(task => (
      task.id === taskId ? { ...task, status } : task
    )))

    try {
      await updateTaskStatus(taskId, status, accessToken)
    } catch {
      setTasks(previousTasks)
      setError('Task update failed. Your previous task status was restored.')
    } finally {
      setUpdatingTaskId(null)
    }
  }, [accessToken, tasks])

  const summary = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(task => task.status === 'done').length,
    active: tasks.filter(task => task.status === 'in-progress').length,
    remaining: tasks.filter(task => task.status !== 'done').length,
  }), [tasks])

  return {
    tasks,
    loading,
    error,
    updatingTaskId,
    summary,
    reload: loadTasks,
    setTaskStatus,
  }
}
