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
  category: z.string().min(1).max(50)
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

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type JoinSessionInput = z.infer<typeof joinSessionSchema>;
export type UpdateSeatingInput = z.infer<typeof updateSeatingSchema>;
export type KickPlayerInput = z.infer<typeof kickPlayerSchema>;