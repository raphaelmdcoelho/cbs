import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Livro } from '../library/storage'
import { saveBook } from '../library/storage'
import { pares, paginate, parseBlocos, parDaPosicao, posicaoDoPar, type Bloco, type Pagina } from '../reader/paginate'

const LARGURA_MIN = 700

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

type Par = [Pagina | null, Pagina | null]

const Face = ({ p, cls }: { p: Pagina | null; cls: string }) => <div className={`pagina face ${cls}`}>{p && <Conteudo pagina={p} />}</div>

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
  const [todos, setTodos] = useState<Par[]>([])
  // mede de verdade: renderiza a Página candidata na .medida (mesmo CSS de .pagina) e confere se sobra altura
  useEffect(() => {
    const el = medida.current
    if (!area || !el) return
    const cabe = (p: Pagina) => {
      el.innerHTML = renderToStaticMarkup(<Conteudo pagina={p} />)
      return el.scrollHeight <= el.clientHeight
    }
    setTodos(pares(paginate(blocos, cabe)))
    el.innerHTML = ''
  }, [blocos, area])
  // Posição de leitura: deslocamento no texto-fonte, estável entre repaginações
  const [pos, setPos] = useState(livro.posicao ?? 0)
  const atual = parDaPosicao(todos, pos)
  const par = todos[atual] ?? null
  // Animação é só visual: pos já vale o novo Par; um clique durante o giro troca a folha (sem fila, sem ignorar)
  const [anim, setAnim] = useState<{ d: number; de: Par; id: number } | null>(null)
  const virar = (d: number) => {
    const novo = Math.max(0, Math.min(todos.length - 1, atual + d))
    if (novo === atual) return
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setAnim({ d, de: todos[atual], id: Date.now() + Math.random() })
    const p = posicaoDoPar(todos, novo)
    setPos(p)
    const progresso = novo === todos.length - 1 ? 100 : Math.floor((p / Math.max(1, livro.texto.length)) * 100)
    void saveBook({ ...livro, posicao: p, progresso })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') virar(1)
      else if (e.key === 'ArrowLeft') virar(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <main className="leitor">
      <header><button onClick={onVoltar}>← Biblioteca</button><span>{livro.titulo}</span></header>
      {estreita ? <p role="alert">Tela estreita demais</p> : (
        <div className="livro" data-testid="livro" onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          virar(e.clientX < r.left + r.width / 2 ? -1 : 1)
        }}>
          {/* durante a Virada, a página que a folha ainda cobre mostra o Par antigo */}
          <div className="pagina esq" data-testid="pagina-esq">{(anim?.d === 1 ? anim.de[0] : par?.[0]) && <Conteudo pagina={(anim?.d === 1 ? anim.de[0] : par?.[0])!} />}</div>
          <div className="pagina dir" data-testid="pagina-dir">{(anim?.d === -1 ? anim.de[1] : par?.[1]) && <Conteudo pagina={(anim?.d === -1 ? anim.de[1] : par?.[1])!} />}</div>
          {anim && par && (
            <div key={anim.id} className={`folha ${anim.d === 1 ? 'avanca' : 'volta'}`} data-testid="folha" onAnimationEnd={() => setAnim(null)}>
              <Face p={anim.d === 1 ? anim.de[1] : anim.de[0]} cls="frente" />
              <Face p={anim.d === 1 ? par[0] : par[1]} cls="verso" />
            </div>
          )}
          <div className="pagina medida" ref={medida} aria-hidden />
        </div>
      )}
    </main>
  )
}
