import { celebrate, Joi } from 'celebrate'
import { ParamsDictionary } from 'express-serve-static-core'

interface PlayerAndGameId {
  playerId: string,
  gameId: string
}

export interface CreateGameSchema {
  query: {
    playerId: string
  },
  body: {
    name: string,
    size: string,
    password?: string
  }
}

export interface CancelGameBody extends PlayerAndGameId {
}

export interface DoNextStepBody extends PlayerAndGameId {
  pos: [number, number]
}

export interface JoinToGameBody extends PlayerAndGameId {
  password?: string
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

function validateSize(value: string, helpers: Joi.CustomHelpers<string>) {
  const split = value.split('x')

  if (!(new Set(split).size === split.length)) {
    return helpers.error('Incorrect board size')
  }

  return value
}

const validateCreateGameSchema = celebrate<CreateGameSchema['query'], any, CreateGameSchema['body']>({
  query: Joi.object<CreateGameSchema['query'], true>({
    playerId: uuidSchema,
  }),
  body: Joi.object<CreateGameSchema['body'], true>({
    name: Joi.string().required(),
    size: Joi.string().required().custom(validateSize),
    password: Joi.string().optional(),
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
    password: Joi.string().optional(),
  }),
})

export {
  validateGetGamesSchema,
  validateCreateGameSchema,
  validateCancelGameSchema,
  validateDoNextStepSchema,
  validateJoinToGameSchema,
}