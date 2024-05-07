import { Router } from 'express'
import Controller from '../class/Controller'
import {
  validateCancelGameSchema,
  validateCreateGameSchema,
  validateDoNextStepSchema, validateGetGamesSchema,
  validateJoinToGameSchema,
} from './schemes'

function apiRouter() {
  const apiRouter = Router()
  const controller = new Controller()

  apiRouter.get('/timers', controller.getTimerIds.bind(controller))
  apiRouter.get('/players', controller.getConnected.bind(controller))
  apiRouter.get('/connect', controller.connect.bind(controller))

  apiRouter.get('/games', validateGetGamesSchema, controller.getGames.bind(controller))

  apiRouter.post('/cancel', validateCancelGameSchema, controller.cancelGame.bind(controller))
  apiRouter.post('/create', validateCreateGameSchema, controller.createGame.bind(controller))
  apiRouter.post('/join', validateJoinToGameSchema, controller.joinToGame.bind(controller))
  apiRouter.post('/step', validateDoNextStepSchema, controller.doNextStep.bind(controller))

  return apiRouter
}

export default apiRouter
