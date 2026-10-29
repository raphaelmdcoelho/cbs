import { useEffect, useRef, useState } from 'react'
import { parseBook } from '../import/parseBook'
import { deleteBook, listBooks, saveBook, type Livro } from '../library/storage'

// Cor estável derivada do título
const capaCor = (t: string) => `hsl(${[...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)} 45% 35%)`

export function Library({ onAbrir }: { onAbrir: (l: Livro) => void }) {
  const [livros, setLivros] = useState<Livro[]>([])
  const [erro, setErro] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => void listBooks().then(setLivros), [])

  async function importar(file: File) {
    setErro('')
    const recusa = !file.name.toLowerCase().endsWith('.md') ? 'Arquivo recusado: só são aceitos arquivos .md.'
      : file.size === 0 ? 'Arquivo recusado: o arquivo está vazio.'
      : file.size > 5 * 1024 * 1024 ? 'Arquivo recusado: o arquivo tem mais de 5 MB.' : ''
    if (recusa) return setErro(recusa)
    const livro: Livro = { id: crypto.randomUUID(), ...parseBook(await file.text()), progresso: 0 }
    const igual = livros.find((l) => l.titulo === livro.titulo && l.autor === livro.autor)
    if (igual) {
      if (!window.confirm(`"${livro.titulo}" de ${livro.autor} já está na Biblioteca. Substituir ou cancelar? (OK substitui e zera o progresso)`)) return
      livro.id = igual.id
    }
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
      {erro && <p role="alert">{erro}</p>}
      {livros.length === 0 && <p>Nenhum livro ainda. Clique em Importar para adicionar um arquivo .md.</p>}
      <ul>
        {livros.map((l) => (
          <li key={l.id} className="cartao" onClick={() => onAbrir(l)}>
            <div className="capa" style={{ background: capaCor(l.titulo) }}>{l.titulo}</div>
            <h2>{l.titulo}</h2>
            <p>{l.autor}</p>
            <p>{l.progresso}%</p>
            <button onClick={async (e) => {
              e.stopPropagation()
              if (!window.confirm(`Remover "${l.titulo}"? O progresso também será apagado.`)) return
              await deleteBook(l.id)
              setLivros(await listBooks())
            }}>Remover</button>
          </li>
        ))}
      </ul>
    </main>
  )
}
