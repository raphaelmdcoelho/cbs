import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Library } from './screens/Library'
import { Reader } from './screens/Reader'
import type { Livro } from './library/storage'
import './style.css'

function App() {
  const [aberto, setAberto] = useState<Livro | null>(null)
  return aberto ? <Reader livro={aberto} onVoltar={() => setAberto(null)} /> : <Library onAbrir={setAberto} />
}

createRoot(document.getElementById('root')!).render(<App />)
