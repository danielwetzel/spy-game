import { z } from 'zod';

export const createSessionSchema = z.object({
  name: z.string().min(1).max(50),
  settings: z.object({
    voteSeconds: z.number().min(30).max(300).optional(),
    whiteGuessSeconds: z.number().min(15).max(120).optional(),
    maxRounds: z.number().min(1).max(20).nullable().optional(),
    allowLateJoin: z.boolean().optional(),
    recordClues: z.boolean().optional()
  }).optional(),
  category: z.string().min(1).max(50),
  gameMode: z.enum(['word', 'places_roles']).optional()
});

export const joinSessionSchema = z.object({
  name: z.string().min(1).max(50)
});

export const updateSeatingSchema = z.object({
  playerIds: z.array(z.string())
});

export const kickPlayerSchema = z.object({
  playerId: z.string()
});

export const updateEmojiSchema = z.object({
  emoji: z.string().min(1).max(10)
});

export const updateGameModeSchema = z.object({
  gameMode: z.enum(['word', 'places_roles'])
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type JoinSessionInput = z.infer<typeof joinSessionSchema>;
export type UpdateSeatingInput = z.infer<typeof updateSeatingSchema>;
export type KickPlayerInput = z.infer<typeof kickPlayerSchema>;
export type UpdateEmojiInput = z.infer<typeof updateEmojiSchema>;