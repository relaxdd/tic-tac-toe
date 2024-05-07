import { Router } from 'express'
import Controller from '../class/Controller'
import {
  validateCancelGameSchema,
  validateCreateGameSchema,
  validateDoNextStepSchema, validateGetGamesSchema,
  validateJoinToGameSchema,
} from './schemes'

function apiRouter() {
  const router = Router()
  const controller = new Controller()

  router.get('/timers', controller.getTimerIds.bind(Controller))
  router.get('/players', controller.getConnected.bind(Controller))
  router.get('/connect', controller.connect)
  router.get('/games', validateGetGamesSchema, controller.getGames.bind(Controller))

  router.post('/cancel', validateCancelGameSchema, controller.cancelGame.bind(Controller))
  router.post('/create', validateCreateGameSchema, controller.createGame.bind(Controller))
  router.post('/join', validateJoinToGameSchema, controller.joinToGame.bind(Controller))
  router.post('/step', validateDoNextStepSchema, controller.doNextStep.bind(Controller))

  return router
}

export default apiRouter