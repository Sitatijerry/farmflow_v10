import { useCallback, useEffect, useState } from 'react'
import { fetchRecommendations, type FarmRecommendation } from '../api/recommendations'

export function useRecommendations(fieldId: string, accessToken?: string) {
  const [recommendations, setRecommendations] = useState<FarmRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecommendations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const nextRecommendations = await fetchRecommendations(fieldId, accessToken)
      setRecommendations(nextRecommendations)
    } catch {
      setError('Unable to load farm tips right now.')
    } finally {
      setLoading(false)
    }
  }, [accessToken, fieldId])

  useEffect(() => {
    void loadRecommendations()
  }, [loadRecommendations])

  return {
    recommendations,
    loading,
    error,
    reload: loadRecommendations,
  }
}
