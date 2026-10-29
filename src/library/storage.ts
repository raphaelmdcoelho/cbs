import { openDB } from 'idb'

export type Livro = { id: string; titulo: string; autor: string; texto: string; progresso: number }

const db = openDB('leitor', 1, {
  upgrade: (d) => void d.createObjectStore('livros', { keyPath: 'id' }),
})

export const listBooks = async (): Promise<Livro[]> => (await db).getAll('livros')
export const saveBook = async (livro: Livro) => void (await (await db).put('livros', livro))
