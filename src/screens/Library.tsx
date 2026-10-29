import { useEffect, useRef, useState } from 'react'
import { parseBook } from '../import/parseBook'
import { listBooks, saveBook, type Livro } from '../library/storage'

// Cor estável derivada do título
const capaCor = (t: string) => `hsl(${[...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)} 45% 35%)`

export function Library() {
  const [livros, setLivros] = useState<Livro[]>([])
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => void listBooks().then(setLivros), [])

  async function importar(file: File) {
    const livro: Livro = { id: crypto.randomUUID(), ...parseBook(await file.text()), progresso: 0 }
    await saveBook(livro)
    setLivros(await listBooks())
  }

  return (
    <main>
      <header>
        <h1>Biblioteca</h1>
        <button onClick={() => input.current?.click()}>Importar</button>
        <input
          ref={input} type="file" accept=".md" hidden data-testid="arquivo"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void importar(f); e.target.value = '' }}
        />
      </header>
      {livros.length === 0 && <p>Nenhum livro ainda. Clique em Importar para adicionar um arquivo .md.</p>}
      <ul>
        {livros.map((l) => (
          <li key={l.id} className="cartao">
            <div className="capa" style={{ background: capaCor(l.titulo) }}>{l.titulo}</div>
            <h2>{l.titulo}</h2>
            <p>{l.autor}</p>
            <p>{l.progresso}%</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
