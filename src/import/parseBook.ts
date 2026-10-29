export type ParsedBook = { titulo: string; autor: string; texto: string }

const SEM_AUTOR = 'Autor desconhecido'

// shortcut: só lê pares `chave: valor` de uma linha; trocar por parser YAML se surgirem outros campos
export function parseBook(source: string): ParsedBook {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const meta: Record<string, string> = {}
  for (const line of (m?.[1] ?? '').split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^(["'])(.*)\1$/, '$2')
  }
  const texto = m ? source.slice(m[0].length) : source
  const h1 = texto.match(/^#\s+(.+)$/m)?.[1].trim()
  return { titulo: meta.titulo || h1 || 'Sem título', autor: meta.autor || SEM_AUTOR, texto }
}
