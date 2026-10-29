import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Livro } from '../library/storage'
import { pares, paginate, parseBlocos, type Bloco, type Pagina } from '../reader/paginate'

const LARGURA_MIN = 700
const LINHA = 28 // px, igual ao line-height do CSS
const CHAR = 9.5 // px por caractere, estimativa para 18px serifado

const inline = (t: string): ReactNode[] =>
  t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((s, i) =>
    s.startsWith('**') ? <strong key={i}>{s.slice(2, -2)}</strong>
      : s.startsWith('*') && s.length > 2 ? <em key={i}>{s.slice(1, -1)}</em> : <Fragment key={i}>{s}</Fragment>)

function Conteudo({ pagina }: { pagina: Pagina }) {
  const out: ReactNode[] = []
  for (let i = 0; i < pagina.length; i++) {
    const b: Bloco = pagina[i]
    if (b.tipo === 'li') {
      const itens: string[] = []
      for (; i < pagina.length && pagina[i].tipo === 'li'; i++) itens.push(pagina[i].texto)
      i--
      out.push(<ul key={i}>{itens.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>)
    } else if (b.tipo === 'h') {
      const H = `h${b.nivel}` as 'h1'
      out.push(<H key={i}>{inline(b.texto)}</H>)
    } else out.push(b.tipo === 'q' ? <blockquote key={i}>{inline(b.texto)}</blockquote> : <p key={i}>{inline(b.texto)}</p>)
  }
  return <>{out}</>
}

export function Reader({ livro, onVoltar }: { livro: Livro; onVoltar: () => void }) {
  const [largura, setLargura] = useState(window.innerWidth)
  const [area, setArea] = useState<{ w: number; h: number } | null>(null)
  const medida = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onResize = () => setLargura(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const estreita = largura < LARGURA_MIN
  useEffect(() => {
    const el = medida.current
    if (!el) return
    const ro = new ResizeObserver(() => setArea({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [estreita])

  const blocos = useMemo(() => parseBlocos(livro.texto), [livro.texto])
  const par = useMemo(() => {
    if (!area) return null
    const paginas = paginate(blocos, Math.max(3, Math.floor(area.h / LINHA)), Math.max(10, Math.floor(area.w / CHAR)))
    return pares(paginas)[0]
  }, [blocos, area])

  return (
    <main className="leitor">
      <header><button onClick={onVoltar}>← Biblioteca</button><span>{livro.titulo}</span></header>
      {estreita ? <p role="alert">Tela estreita demais</p> : (
        <div className="livro" data-testid="livro">
          <div className="pagina esq" data-testid="pagina-esq">{par?.[0] && <Conteudo pagina={par[0]} />}</div>
          <div className="pagina dir" data-testid="pagina-dir">{par?.[1] && <Conteudo pagina={par[1]} />}</div>
          <div className="medida" ref={medida} aria-hidden />
        </div>
      )}
    </main>
  )
}
