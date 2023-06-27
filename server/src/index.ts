import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import router from './router';

dotenv.config()

export const __public = path.resolve(__dirname, '../../../public')

const server = express()
const port = process.env.PORT

server.use(express.static(__public));
server.use("/api", router)

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})