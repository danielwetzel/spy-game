import { Socket } from 'socket.io';
import { gameStore } from '../game/store';
import { GameEngine } from '../game/engine';

export function setupSocketEvents(io: any) {
  const gameEngine = new GameEngine(io);

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Join session room
    socket.on('ws/join_session', async (data: { code: string; playerToken: string }) => {
      try {
        const { code, playerToken } = data;
        const session = gameStore.getSession(code);
        
        if (!session) {
          socket.emit('error', { code: 404, message: 'Session not found' });
          return;
        }

        const playerId = gameStore.getPlayerIdFromToken(code, playerToken);
        if (!playerId) {
          socket.emit('error', { code: 401, message: 'Invalid token' });
          return;
        }

        // Join the session room
        await socket.join(code);
        
        // Track socket connection
        gameStore.addSocket(code, playerId, socket.id);
        
        // Update player connection status
        const player = session.state.players.find(p => p.id === playerId);
        if (player) {
          player.isConnected = true;
          gameStore.updateState(code, session.state);
        }

        // Send current session state (hide secrets)
        const sanitizedState = {
          ...session.state,
          secretWord: null,
          secretPlace: null,
          playerRoles: null
        };
        
        socket.emit('session/state', sanitizedState);
        
        // Broadcast player connection update
        socket.to(code).emit('session/players_update', session.state.players);

        // If game is in progress and player needs private role info
        if ((session.state.phase === 'round_play' ||
             session.state.phase === 'voting' ||
             session.state.phase === 'white_guess') && player) {

          let role;
          if (player.isWhite) {
            role = { role: 'white' as const };
          } else if (session.state.gameMode === 'places_roles') {
            role = {
              role: 'place_role' as const,
              place: session.state.secretPlace!,
              playerRole: session.state.playerRoles![playerId]
            };
          } else {
            role = { role: 'word' as const, word: session.state.secretWord! };
          }

          socket.emit('game/dealt_private', role);
        }

        console.log(`Player ${playerId} joined session ${code}`);
        
      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { code: 500, message: 'Internal server error' });
      }
    });

    // Player confirms they have spoken
    socket.on('ws/turn/confirm_spoken', (data: { code: string; playerToken: string }) => {
      try {
        const { code, playerToken } = data;
        const playerId = gameStore.getPlayerIdFromToken(code, playerToken);
        
        if (!playerId) {
          socket.emit('error', { code: 401, message: 'Invalid token' });
          return;
        }

        gameEngine.confirmSpoken(code, playerId);
        
      } catch (error) {
        console.error('Error confirming spoken:', error);
        socket.emit('error', { code: 500, message: 'Internal server error' });
      }
    });

    // Cast vote
    socket.on('ws/vote/cast', (data: { code: string; playerToken: string; targetPlayerId: string | null }) => {
      try {
        const { code, playerToken, targetPlayerId } = data;
        const playerId = gameStore.getPlayerIdFromToken(code, playerToken);
        
        if (!playerId) {
          socket.emit('error', { code: 401, message: 'Invalid token' });
          return;
        }

        gameEngine.castVote(code, playerId, targetPlayerId);
        
      } catch (error) {
        console.error('Error casting vote:', error);
        socket.emit('error', { code: 500, message: 'Internal server error' });
      }
    });

    // White player guess
    socket.on('white/guess', (data: { code: string; playerToken: string; guess: string }) => {
      try {
        const { code, playerToken, guess } = data;
        const playerId = gameStore.getPlayerIdFromToken(code, playerToken);
        
        if (!playerId) {
          socket.emit('error', { code: 401, message: 'Invalid token' });
          return;
        }

        gameEngine.submitWhiteGuess(code, playerId, guess);
        
      } catch (error) {
        console.error('Error submitting white guess:', error);
        socket.emit('error', { code: 500, message: 'Internal server error' });
      }
    });

    // Host skips current player's turn
    socket.on('ws/host/skip_player', (data: { code: string; playerToken: string }) => {
      try {
        const { code, playerToken } = data;
        const session = gameStore.getSession(code);
        
        if (!session) {
          socket.emit('error', { code: 404, message: 'Session not found' });
          return;
        }

        const playerId = gameStore.getPlayerIdFromToken(code, playerToken);
        if (!playerId || playerId !== session.state.hostPlayerId) {
          socket.emit('error', { code: 403, message: 'Only host can skip turns' });
          return;
        }

        if (session.state.phase === 'round_play' && session.state.round) {
          const currentPlayer = session.state.players[session.state.round.currentTurnIndex];
          gameEngine.confirmSpoken(code, currentPlayer.id);
        }
        
      } catch (error) {
        console.error('Error skipping player:', error);
        socket.emit('error', { code: 500, message: 'Internal server error' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      // Find and update player connection status
      for (const code of gameStore.getAllActiveCodes()) {
        const sessionData = gameStore.getSession(code);
        if (!sessionData) continue;

        for (const [playerId, sockets] of sessionData.sockets) {
          if (sockets.has(socket.id)) {
            gameStore.removeSocket(code, playerId, socket.id);

            const isStillConnected = gameStore.isPlayerConnected(code, playerId);
            if (!isStillConnected) {
              const player = sessionData.state.players.find(p => p.id === playerId);
              if (player) {
                // In lobby phase, remove the player entirely
                if (sessionData.state.phase === 'lobby') {
                  const playerIndex = sessionData.state.players.findIndex(p => p.id === playerId);
                  if (playerIndex !== -1) {
                    sessionData.state.players.splice(playerIndex, 1);
                    console.log(`Player ${player.name} removed from lobby ${code}`);

                    // If the removed player was the host, assign a new host
                    if (sessionData.state.hostPlayerId === playerId) {
                      if (sessionData.state.players.length > 0) {
                        sessionData.state.hostPlayerId = sessionData.state.players[0].id;
                        console.log(`New host assigned: ${sessionData.state.players[0].name}`);
                      } else {
                        // No players left, delete the session
                        console.log(`No players left in session ${code}, deleting`);
                        gameStore.deleteSession(code);
                        break;
                      }
                    }

                    // Remove the player's token
                    for (const [token, pId] of sessionData.tokens.entries()) {
                      if (pId === playerId) {
                        sessionData.tokens.delete(token);
                        break;
                      }
                    }

                    gameStore.updateState(code, sessionData.state);

                    // Broadcast updated player list and state
                    io.to(code).emit('session/players_update', sessionData.state.players);
                    io.to(code).emit('session/state', {
                      ...sessionData.state,
                      secretWord: null
                    });
                  }
                } else {
                  // During game, just mark as disconnected (don't remove)
                  player.isConnected = false;

                  // If host leaves during 'ended' phase, reassign host to another connected player
                  if (sessionData.state.phase === 'ended' && sessionData.state.hostPlayerId === playerId) {
                    const connectedPlayer = sessionData.state.players.find(p =>
                      p.id !== playerId && gameStore.isPlayerConnected(code, p.id)
                    );
                    if (connectedPlayer) {
                      sessionData.state.hostPlayerId = connectedPlayer.id;
                      console.log(`Host left in ended phase, new host: ${connectedPlayer.name}`);
                    }
                  }

                  gameStore.updateState(code, sessionData.state);

                  // Broadcast player disconnection and updated state (for host change)
                  io.to(code).emit('session/players_update', sessionData.state.players);
                  io.to(code).emit('session/state', {
                    ...sessionData.state,
                    secretWord: null,
                    secretPlace: null,
                    playerRoles: null
                  });

                  // Handle disconnection during active turn
                  if (sessionData.state.phase === 'round_play' &&
                      sessionData.state.round &&
                      sessionData.state.players[sessionData.state.round.currentTurnIndex].id === playerId) {

                    // Start 30s grace timer
                    const graceTimer = setTimeout(() => {
                      // Auto-skip if still disconnected
                      if (!gameStore.isPlayerConnected(code, playerId)) {
                        gameEngine.confirmSpoken(code, playerId);
                      }
                    }, 30000);

                    sessionData.timers.disconnectGrace?.set(playerId, graceTimer);
                  }
                }
              }
            }
            break;
          }
        }
      }
    });
  });
}