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

// cabe: mede se a Página (blocos em sequência) cabe na área de leitura; no app vem do DOM (Reader), nos testes é falsa
export type Cabe = (pagina: Pagina) => boolean

export function paginate(blocos: Bloco[], cabe: Cabe): Pagina[] {
  const paginas: Pagina[] = []
  let atual: Pagina = []
  const nova = () => { if (atual.length) paginas.push(atual); atual = [] }

  for (let b of blocos) {
    if (b.tipo === 'h' && b.nivel === 1) nova()
    while (!cabe([...atual, b])) {
      const palavras = b.texto.split(' ')
      // títulos não se dividem; parágrafo longo é dividido na maior quantidade de palavras que cabe
      let n = 0
      if (b.tipo !== 'h' && palavras.length > 1) {
        let lo = 1, hi = palavras.length - 1
        while (lo <= hi) {
          const m = (lo + hi) >> 1
          if (cabe([...atual, { ...b, texto: palavras.slice(0, m).join(' ') }])) { n = m; lo = m + 1 } else hi = m - 1
        }
        // nem uma palavra cabe: com a Página vazia, tira só a primeira (overflow inevitável), senão vai para a próxima Página
        if (!n && !atual.length) n = 1
      }
      if (n) {
        const ini = b.ini + palavras.slice(0, n).join(' ').length + 1
        atual.push({ ...b, texto: palavras.slice(0, n).join(' ') })
        nova()
        b = { ...b, texto: palavras.slice(n).join(' '), ini }
      } else if (atual.length) nova()
      else break // um único bloco que não cabe nem sozinho: aceita o overflow
    }
    atual.push(b)
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
