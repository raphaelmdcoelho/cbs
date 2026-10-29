import { describe, expect, it } from 'vitest'
import { pares, paginate, type Cabe, parseBlocos, parDaPosicao, posicaoDoPar } from './paginate'

describe('parseBlocos', () => {
  it('reconhece títulos, parágrafos, listas e citações', () => {
    expect(parseBlocos('# A\nlinha 1\nlinha 2\n\n- x\n1. y\n> q')).toEqual([
      { tipo: 'h', nivel: 1, texto: 'A', ini: 0 },
      { tipo: 'p', texto: 'linha 1 linha 2', ini: 4 },
      { tipo: 'li', texto: 'x', ini: 21 },
      { tipo: 'li', texto: 'y', ini: 25 },
      { tipo: 'q', texto: 'q', ini: 30 },
    ])
  })
})

// medida falsa: cada bloco ocupa ceil(chars / cpl) linhas (título dobra) + 1 de espaço; cabe se o total ≤ linhas
const medida = (linhas: number, cpl: number): Cabe => (pagina) =>
  pagina.reduce((s, b) => s + Math.max(1, Math.ceil(b.texto.length / cpl)) * (b.tipo === 'h' ? 2 : 1) + 1, 0) <= linhas

describe('paginate', () => {
  it('cada Capítulo começa em Página nova', () => {
    const p = paginate(parseBlocos('# A\ntexto\n\n# B\ntexto'), medida(20, 40))
    expect(p).toHaveLength(2)
    expect(p[1][0]).toMatchObject({ tipo: 'h', texto: 'B' })
  })
  it('não trava com uma palavra maior que uma Página', () => {
    const p = paginate(parseBlocos('x'.repeat(100)), medida(3, 10))
    expect(p.flat().map((b) => b.texto).join('')).toBe('x'.repeat(100))
  })
  it('palavra gigante no começo do parágrafo não perde as outras palavras', () => {
    const texto = 'x'.repeat(100) + ' ' + Array(20).fill('ok').join(' ')
    const p = paginate(parseBlocos(texto), medida(4, 10))
    expect(p.flat().map((b) => b.texto).join(' ')).toBe(texto)
  })
  it('divide parágrafo longo entre Páginas sem perder texto', () => {
    const texto = Array(200).fill('palavra').join(' ')
    const p = paginate(parseBlocos(texto), medida(10, 30))
    expect(p.length).toBeGreaterThan(1)
    expect(p.flat().map((b) => b.texto).join(' ')).toBe(texto)
  })
  it('Página menor gera mais Páginas', () => {
    const md = Array(30).fill('um parágrafo qualquer de texto').join('\n\n')
    expect(paginate(parseBlocos(md), medida(8, 30)).length).toBeGreaterThan(paginate(parseBlocos(md), medida(30, 30)).length)
  })
})

describe('pares', () => {
  it('primeira Página sozinha à direita', () => {
    expect(pares([[], [], []] as any)).toEqual([[null, []], [[], []]])
  })
  it('total ímpar deixa a direita em branco', () => {
    const r = pares(['a', 'b', 'c', 'd'] as any)
    expect(r).toEqual([[null, 'a'], ['b', 'c'], ['d', null]])
  })
})

describe('Posição de leitura', () => {
  const md = '# T\n\n' + Array.from({ length: 80 }, (_, i) => `Parágrafo ${i} com algum texto de enchimento.`).join('\n\n')
  const monta = (linhas: number, cpl: number) => pares(paginate(parseBlocos(md), medida(linhas, cpl)))

  it('cada bloco aponta para o seu trecho no texto-fonte', () => {
    for (const b of parseBlocos(md)) expect(md.slice(b.ini, b.ini + b.texto.length + 8)).toContain(b.texto.slice(0, 10))
  })
  it('a posição mantém o trecho ao repaginar com Página de outro tamanho', () => {
    const grande = monta(30, 60)
    const pos = posicaoDoPar(grande, 3)
    const pequeno = monta(10, 30)
    const i = parDaPosicao(pequeno, pos)
    const ini = posicaoDoPar(pequeno, i)
    expect(ini).toBeLessThanOrEqual(pos)
    if (i + 1 < pequeno.length) expect(posicaoDoPar(pequeno, i + 1)).toBeGreaterThan(pos)
  })
  it('posição 0 ou fora do texto cai nas pontas', () => {
    const t = monta(10, 30)
    expect(parDaPosicao(t, 0)).toBe(0)
    expect(parDaPosicao(t, 1e9)).toBe(t.length - 1)
  })
})
