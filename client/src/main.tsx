import { createRoot } from 'react-dom/client'
import App from './templates/App.tsx'
import './assets/css/index.css'

const root = document.getElementById('root')
if (root !== null) createRoot(root).render(<App/>)
