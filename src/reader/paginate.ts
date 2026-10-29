// ini: deslocamento do bloco no texto-fonte (Posição de leitura)
export type Bloco =
  | { tipo: 'h'; nivel: number; texto: string; ini: number }
  | { tipo: 'p' | 'li' | 'q'; texto: string; ini: number }

export type Pagina = Bloco[]

export function parseBlocos(md: string): Bloco[] {
  const out: Bloco[] = []
  let par: string[] = []
  let parIni = 0
  const fecha = () => { if (par.length) out.push({ tipo: 'p', texto: par.join(' '), ini: parIni }); par = [] }
  let pos = 0
  for (const raw of md.split('\n')) {
    const ini = pos
    pos += raw.length + 1
    const l = raw.trim()
    let m
    if (!l) fecha()
    else if ((m = l.match(/^(#{1,6})\s+(.*)$/))) { fecha(); out.push({ tipo: 'h', nivel: m[1].length, texto: m[2], ini }) }
    else if ((m = l.match(/^(?:[-*+]|\d+\.)\s+(.*)$/))) { fecha(); out.push({ tipo: 'li', texto: m[1], ini }) }
    else if ((m = l.match(/^>\s?(.*)$/))) { fecha(); out.push({ tipo: 'q', texto: m[1], ini }) }
    else { if (!par.length) parIni = ini; par.push(l) }
  }
  fecha()
  return out
}

// shortcut: altura estimada por contagem de caracteres (fonte serifada ~média), não medida no DOM; medir se o layout divergir
const linhas = (b: Bloco, cpl: number) => Math.max(1, Math.ceil(b.texto.length / cpl)) * (b.tipo === 'h' ? 2 : 1)
const ESPACO = 1

export function paginate(blocos: Bloco[], linhasPorPagina: number, cpl: number): Pagina[] {
  const paginas: Pagina[] = []
  let atual: Pagina = []
  let usado = 0
  const nova = () => { if (atual.length) paginas.push(atual); atual = []; usado = 0 }

  for (let b of blocos) {
    if (b.tipo === 'h' && b.nivel === 1) nova()
    for (;;) {
      const custo = linhas(b, cpl) + ESPACO
      if (usado + custo <= linhasPorPagina || (atual.length === 0 && (b.tipo === 'h' || custo <= 2))) break
      // bloco não cabe: divide por palavras o que couber; títulos não se dividem, vão para a próxima Página
      const livre = linhasPorPagina - usado - ESPACO
      if (b.tipo === 'h' || livre < 1) { nova(); continue }
      const palavras = b.texto.split(' ')
      let n = palavras.length
      while (n > 1 && palavras.slice(0, n).join(' ').length > livre * cpl) n--
      if (n === palavras.length) { nova(); continue }
      atual.push({ ...b, texto: palavras.slice(0, n).join(' ') })
      nova()
      // shortcut: em parágrafo de várias linhas o deslocamento do resto deriva alguns caracteres (quebras/espaços); medir no texto-fonte se importar
      b = { ...b, texto: palavras.slice(n).join(' '), ini: b.ini + palavras.slice(0, n).join(' ').length + 1 }
    }
    atual.push(b)
    usado += linhas(b, cpl) + ESPACO
  }
  nova()
  return paginas
}

// Par de páginas: a primeira Página sozinha à direita; depois, de duas em duas
export function pares(paginas: Pagina[]): [Pagina | null, Pagina | null][] {
  const r: [Pagina | null, Pagina | null][] = [[null, paginas[0] ?? null]]
  for (let i = 1; i < paginas.length; i += 2) r.push([paginas[i], paginas[i + 1] ?? null])
  return r
}

const inicioDoPar = (p: [Pagina | null, Pagina | null]) => (p[0] ?? p[1])?.[0]?.ini ?? 0

// Par que contém a Posição de leitura: o último que começa nela ou antes
export function parDaPosicao(todos: [Pagina | null, Pagina | null][], pos: number): number {
  let r = 0
  todos.forEach((p, i) => { if (inicioDoPar(p) <= pos) r = i })
  return r
}

export const posicaoDoPar = (todos: [Pagina | null, Pagina | null][], i: number) => inicioDoPar(todos[i])
