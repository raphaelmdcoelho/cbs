import { describe, expect, it } from 'vitest'
import { pares, paginate, parseBlocos } from './paginate'

describe('parseBlocos', () => {
  it('reconhece títulos, parágrafos, listas e citações', () => {
    expect(parseBlocos('# A\nlinha 1\nlinha 2\n\n- x\n1. y\n> q')).toEqual([
      { tipo: 'h', nivel: 1, texto: 'A' },
      { tipo: 'p', texto: 'linha 1 linha 2' },
      { tipo: 'li', texto: 'x' },
      { tipo: 'li', texto: 'y' },
      { tipo: 'q', texto: 'q' },
    ])
  })
})

describe('paginate', () => {
  it('cada Capítulo começa em Página nova', () => {
    const p = paginate(parseBlocos('# A\ntexto\n\n# B\ntexto'), 20, 40)
    expect(p).toHaveLength(2)
    expect(p[1][0]).toMatchObject({ tipo: 'h', texto: 'B' })
  })
  it('divide parágrafo longo entre Páginas sem perder texto', () => {
    const texto = Array(200).fill('palavra').join(' ')
    const p = paginate(parseBlocos(texto), 10, 30)
    expect(p.length).toBeGreaterThan(1)
    expect(p.flat().map((b) => b.texto).join(' ')).toBe(texto)
  })
  it('Página menor gera mais Páginas', () => {
    const md = Array(30).fill('um parágrafo qualquer de texto').join('\n\n')
    expect(paginate(parseBlocos(md), 8, 30).length).toBeGreaterThan(paginate(parseBlocos(md), 30, 30).length)
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
