import { create } from 'zustand'
import { SessionState, PlayerId, PrivateRole, GameEndResult } from '@/types'
import { socketManager } from './socket'
import { toast } from './use-toast'

interface SessionStore {
  // State
  session: SessionState | null
  gameResult: GameEndResult | null
  me: {
    playerId: PlayerId | null
    token: string | null
    role: PrivateRole | null
    name: string | null
    emoji: string | null
  }
  isConnected: boolean
  elimination: {
    isVisible: boolean
    playerName: string
    playerEmoji: string
    wasWhite: boolean
  } | null
  votingResult: {
    isVisible: boolean
    accusedPlayerId: string | null
    accusedPlayerName: string
    accusedPlayerEmoji: string
    isTie: boolean
    wasWhite: boolean
  } | null
  
  // Actions
  setSession: (session: SessionState) => void
  setGameResult: (result: GameEndResult) => void
  setMe: (me: Partial<SessionStore['me']>) => void
  setRole: (role: PrivateRole) => void
  setConnected: (connected: boolean) => void
  showElimination: (playerName: string, playerEmoji: string, wasWhite: boolean) => void
  hideElimination: () => void
  showVotingResult: (accusedPlayerId: string | null, accusedPlayerName: string, accusedPlayerEmoji: string, isTie: boolean, wasWhite: boolean) => void
  hideVotingResult: () => void
  connect: (code: string, token: string) => void
  disconnect: () => void
  confirmSpoken: () => void
  castVote: (targetPlayerId: PlayerId | null) => void
  submitWhiteGuess: (guess: string) => void
  skipPlayer: () => void
  reset: () => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: null,
  gameResult: null,
  me: {
    playerId: null,
    token: null,
    role: null,
    name: null,
    emoji: null,
  },
  isConnected: false,
  elimination: null,
  votingResult: null,

  setSession: (session) => set({ session }),
  
  setGameResult: (result) => set({ gameResult: result }),
  
  setMe: (me) => set((state) => ({ 
    me: { ...state.me, ...me } 
  })),
  
  setRole: (role) => set((state) => ({
    me: { ...state.me, role }
  })),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  showElimination: (playerName, playerEmoji, wasWhite) => set({ 
    elimination: { 
      isVisible: true, 
      playerName, 
      playerEmoji, 
      wasWhite 
    } 
  }),
  
  hideElimination: () => set({ elimination: null }),
  
  showVotingResult: (accusedPlayerId, accusedPlayerName, accusedPlayerEmoji, isTie, wasWhite) => set({ 
    votingResult: { 
      isVisible: true, 
      accusedPlayerId,
      accusedPlayerName, 
      accusedPlayerEmoji, 
      isTie,
      wasWhite 
    } 
  }),
  
  hideVotingResult: () => set({ votingResult: null }),

  connect: (code, token) => {
    const socket = socketManager.connect()
    
    socket.on('session/state', (state: SessionState) => {
      get().setSession(state)
    })
    
    socket.on('session/players_update', (players) => {
      const currentSession = get().session
      if (currentSession) {
        get().setSession({ ...currentSession, players })
      }
    })
    
    socket.on('game/dealt_private', (role: PrivateRole) => {
      get().setRole(role)
    })
    
    socket.on('voting/ended', (data: { accusedPlayerId: string | null; isTie: boolean }) => {
      const currentSession = get().session
      if (!currentSession) return
      
      // Find the accused player's details
      const accusedPlayer = data.accusedPlayerId 
        ? currentSession.players.find(p => p.id === data.accusedPlayerId)
        : null
      
      // Determine if the accused was White
      const wasWhite = accusedPlayer && currentSession.whitePlayerId === data.accusedPlayerId
      
      // Show voting result animation for ties or White catches
      if (data.isTie || !data.accusedPlayerId || wasWhite) {
        get().showVotingResult(
          data.accusedPlayerId,
          accusedPlayer?.name || '',
          accusedPlayer?.emoji || '',
          data.isTie,
          !!wasWhite
        )
      }
      // Note: Regular eliminations will be handled by the existing player/eliminated event
    })
    
    socket.on('player/eliminated', (data: { playerId: string; wasWhite: boolean; playerName: string }) => {
      // Find the eliminated player's emoji
      const currentSession = get().session
      const eliminatedPlayer = currentSession?.players.find(p => p.id === data.playerId)
      
      if (eliminatedPlayer) {
        // Show the full-screen elimination animation
        get().showElimination(data.playerName, eliminatedPlayer.emoji, data.wasWhite)
      }
      
      // Still show toast as backup
      toast({
        title: `${data.playerName} eliminated!`,
        description: data.wasWhite ? `${data.playerName} was Mr/Ms White!` : `${data.playerName} was innocent.`,
        variant: data.wasWhite ? 'destructive' : 'default'
      })
    })
    
    socket.on('game/ended', (result: GameEndResult) => {
      get().setGameResult(result)
      const amIWhite = get().me.playerId === result.whitePlayerId
      const didIWin = (amIWhite && result.winner === 'white') || (!amIWhite && result.winner === 'others')
      
      toast({
        title: didIWin ? 'You won! 🎉' : 'You lost!',
        description: result.winner === 'white' 
          ? 'Mr/Ms White guessed correctly!' 
          : 'The word bearers found Mr/Ms White!',
        variant: didIWin ? 'default' : 'destructive'
      })
    })
    
    socket.on('white/guess_started', (data: { guessEndsAt: number }) => {
      // The White player has started their guess phase
      const currentSession = get().session
      if (currentSession) {
        get().setSession({ 
          ...currentSession, 
          phase: 'white_guess',
          whiteGuess: {
            guessEndsAt: data.guessEndsAt,
            guess: null
          }
        })
      }
    })
    
    socket.on('white/guess_pending', (data: { guessEndsAt: number }) => {
      // Others are waiting for White's guess
      const currentSession = get().session
      if (currentSession) {
        get().setSession({ 
          ...currentSession, 
          phase: 'white_guess',
          whiteGuess: {
            guessEndsAt: data.guessEndsAt,
            guess: null
          }
        })
      }
    })
    
    socket.on('white/guess_result', (data: { isCorrect: boolean }) => {
      toast({
        title: data.isCorrect ? 'White guessed correctly!' : 'White guessed wrong!',
        description: data.isCorrect ? 'Mr/Ms White wins!' : 'The word bearers win!',
        variant: data.isCorrect ? 'destructive' : 'default'
      })
    })
    
    socket.on('connect', () => {
      get().setConnected(true)
    })
    
    socket.on('disconnect', () => {
      get().setConnected(false)
    })
    
    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
    
    socketManager.joinSession(code, token)
  },

  disconnect: () => {
    socketManager.disconnect()
    set({ isConnected: false })
  },

  confirmSpoken: () => {
    const { session, me } = get()
    if (session && me.token) {
      socketManager.confirmSpoken(session.code, me.token)
    }
  },

  castVote: (targetPlayerId) => {
    const { session, me } = get()
    if (session && me.token) {
      socketManager.castVote(session.code, me.token, targetPlayerId)
    }
  },

  submitWhiteGuess: (guess) => {
    const { session, me } = get()
    if (session && me.token) {
      socketManager.submitWhiteGuess(session.code, me.token, guess)
    }
  },

  skipPlayer: () => {
    const { session, me } = get()
    if (session && me.token) {
      socketManager.skipPlayer(session.code, me.token)
    }
  },

  reset: () => set({
    session: null,
    gameResult: null,
    me: {
      playerId: null,
      token: null,
      role: null,
      name: null,
      emoji: null,
    },
    isConnected: false,
    elimination: null,
    votingResult: null,
  }),
}))