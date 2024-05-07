import { celebrate, Joi } from 'celebrate'
import { ParamsDictionary } from 'express-serve-static-core'

interface PlayerAndGameId {
  playerId: string,
  gameId: string
}

export interface CreateGameSchema {
  query: {
    player: string
  },
  body: {
    name: string,
    size: string,
    password: string
  }
}

export interface CancelGameBody extends PlayerAndGameId {
}

export interface DoNextStepBody extends PlayerAndGameId {
  pos: [number, number]
}

export interface JoinToGameBody extends PlayerAndGameId {
  password: string
}

export interface GetGamesQuery {
  all?: string
}

// *****************************

const uuidSchema = Joi.string().uuid({ version: 'uuidv4' }).required()

const playerAndGameIdSchema = Joi.object<PlayerAndGameId, true>({
  playerId: uuidSchema, gameId: uuidSchema,
})

const validateGetGamesSchema = celebrate<ParamsDictionary, any, any, GetGamesQuery>({
  query: Joi.object({
    all: Joi.string().optional(),
  }),
})

const validateCreateGameSchema = celebrate<ParamsDictionary, any, CreateGameSchema['body'], CreateGameSchema['query']>({
  query: Joi.object<CreateGameSchema['query'], true>({
    player: uuidSchema,
  }),
  body: Joi.object<CreateGameSchema['body'], true>({
    name: Joi.string().required(),
    size: Joi.string().valid('3x3', '4x4', '5x5').required(),
    password: Joi.string().allow('').required(),
  }),
})

const validateCancelGameSchema = celebrate<ParamsDictionary, any, CancelGameBody>({
  body: playerAndGameIdSchema,
})

const validateDoNextStepSchema = celebrate<ParamsDictionary, any, DoNextStepBody>({
  body: playerAndGameIdSchema.append({
    pos: Joi.array().items(
      Joi.number().integer().min(0).required(),
      Joi.number().integer().min(0).required(),
    ),
  }),
})

const validateJoinToGameSchema = celebrate<ParamsDictionary, any, JoinToGameBody>({
  body: playerAndGameIdSchema.append({
    password: Joi.string().allow('').required(),
  }),
})

export {
  validateGetGamesSchema,
  validateCreateGameSchema,
  validateCancelGameSchema,
  validateDoNextStepSchema,
  validateJoinToGameSchema,
}
