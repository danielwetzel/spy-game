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

  async restartGame(code: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE}/sessions/${code}/restart`, {
      method: 'POST',
      headers: this.getAuthHeaders(token, false),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to restart game')
    }
  }

  async updateEmoji(code: string, token: string, emoji: string): Promise<{ emoji: string }> {
    const response = await fetch(`${API_BASE}/sessions/${code}/emoji`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ emoji }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || error.error || 'Failed to update emoji')
    }

    return response.json()
  }

  async toggleReady(code: string, token: string): Promise<{ isReady: boolean }> {
    const response = await fetch(`${API_BASE}/sessions/${code}/ready`, {
      method: 'POST',
      headers: this.getAuthHeaders(token, false),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || error.error || 'Failed to toggle ready status')
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()