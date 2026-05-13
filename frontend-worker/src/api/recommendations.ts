export type RecommendationUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface FarmRecommendation {
  id: string
  field_id?: string
  rule_id?: string
  title?: string
  description?: string
  action?: string
  rationale?: string
  urgency?: RecommendationUrgency | string
  status?: string
  created_at?: string
  field_name?: string
  crop_type?: string
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

export async function fetchRecommendations(fieldId: string, accessToken?: string): Promise<FarmRecommendation[]> {
  const data = await request<{ recommendations?: FarmRecommendation[] }>(`/recommend/${fieldId}`, accessToken)
  return data.recommendations ?? []
}
