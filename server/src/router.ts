import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import Controller from './class/Controller'
import cors from './middlewares/cors'

const router = express.Router()
const controller = new Controller()

router.use(bodyParser.json())
router.use(cookieParser())
router.use(cors({ origin: 'http://localhost:5173' }))

router.get('/timers', (req, res) => controller.getTimers(req, res))
router.get('/players', (req, res) => controller.getConnected(req, res))
router.get('/games', (req, res) => controller.getGames(req, res))

router.get('/connect', (req, res) => controller.connect(req, res))
router.post('/cancel', (req, res) => controller.cancelGame(req, res))
router.post('/create', (req, res) => controller.createGame(req, res))
router.post('/join', (req, res) => controller.joinToGame(req, res))
router.post('/step', (req, res) => controller.doStep(req, res))

export default router