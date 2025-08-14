import { 
  CreateSessionRequest, 
  CreateSessionResponse, 
  JoinSessionRequest, 
  JoinSessionResponse,
  SessionState 
} from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

class ApiClient {
  private getAuthHeaders(token?: string, includeContentType: boolean = true) {
    const headers: Record<string, string> = {}
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json'
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    return headers
  }

  async createSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create session')
    }
    
    return response.json()
  }

  async joinSession(code: string, data: JoinSessionRequest): Promise<JoinSessionResponse> {
    const response = await fetch(`${API_BASE}/sessions/${code}/join`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to join session')
    }
    
    return response.json()
  }

  async getSession(code: string): Promise<SessionState> {
    const response = await fetch(`${API_BASE}/sessions/${code}`, {
      headers: this.getAuthHeaders(),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get session')
    }
    
    return response.json()
  }

  async startGame(code: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE}/sessions/${code}/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(token, false),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to start game')
    }
  }

  async updateSeating(code: string, token: string, playerIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE}/sessions/${code}/seating`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ playerIds }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update seating')
    }
  }

  async kickPlayer(code: string, token: string, playerId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/sessions/${code}/kick`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ playerId }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to kick player')
    }
  }
}

export const apiClient = new ApiClient()