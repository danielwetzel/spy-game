import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/'

class SocketManager {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private hasSetupListeners = false

  connect(): Socket {
    // If socket exists and is connected or connecting, return it
    if (this.socket) {
      return this.socket
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
    })

    this.socket.on('connect', () => {
      console.log('Connected to server')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
        this.socket?.disconnect()
      }
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
      this.hasSetupListeners = false
      this.reconnectAttempts = 0
    }
  }

  hasListeners(): boolean {
    return this.hasSetupListeners
  }

  markListenersSetup(): void {
    this.hasSetupListeners = true
  }

  getSocket(): Socket | null {
    return this.socket
  }

  joinSession(code: string, token: string) {
    if (!this.socket) {
      throw new Error('Socket not connected')
    }
    
    this.socket.emit('ws/join_session', { code, playerToken: token })
  }

  confirmSpoken(code: string, token: string) {
    if (!this.socket) return
    this.socket.emit('ws/turn/confirm_spoken', { code, playerToken: token })
  }

  castVote(code: string, token: string, targetPlayerId: string | null) {
    if (!this.socket) return
    this.socket.emit('ws/vote/cast', { code, playerToken: token, targetPlayerId })
  }

  submitWhiteGuess(code: string, token: string, guess: string) {
    if (!this.socket) return
    this.socket.emit('white/guess', { code, playerToken: token, guess })
  }

  skipPlayer(code: string, token: string) {
    if (!this.socket) return
    this.socket.emit('ws/host/skip_player', { code, playerToken: token })
  }
}

export const socketManager = new SocketManager()