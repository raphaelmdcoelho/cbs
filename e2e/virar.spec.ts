import { test, expect } from '@playwright/test'

const paragrafos = Array.from({ length: 200 }, (_, i) => `Parágrafo número ${i} com algum texto para ocupar espaço.`).join('\n\n')

test('vira páginas por clique e setas, parando nas pontas', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('arquivo').setInputFiles({ name: 'l.md', mimeType: 'text/markdown', buffer: Buffer.from(`# Longo\n\n${paragrafos}`) })
  await page.locator('.cartao').first().click()
  const livro = page.getByTestId('livro')
  const esq = page.getByTestId('pagina-dir') // 1º Par: capa na direita
  await expect(esq).toContainText('Longo')

  await livro.click({ position: { x: 5, y: 100 } }) // esquerda no 1º Par: nada
  await expect(esq).toContainText('Longo')

  const w = (await livro.boundingBox())!.width
  await livro.click({ position: { x: w - 5, y: 100 } })
  await expect(esq).not.toContainText('Longo')
  await livro.click({ position: { x: 5, y: 100 } })
  await expect(esq).toContainText('Longo')

  await page.keyboard.press('ArrowRight')
  await expect(esq).not.toContainText('Longo')
  await page.keyboard.press('ArrowLeft')
  await expect(esq).toContainText('Longo')

  for (let i = 0; i < 300; i++) await page.keyboard.press('ArrowRight')
  const fim = await esq.innerText()
  await page.keyboard.press('ArrowRight')
  expect(await esq.innerText()).toBe(fim)
  await expect(page.getByTestId('livro')).toContainText('número 199')
})

test('recarregar o navegador reabre o Livro no mesmo ponto e atualiza o progresso', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('arquivo').setInputFiles({ name: 'l.md', mimeType: 'text/markdown', buffer: Buffer.from(`# Longo\n\n${paragrafos}`) })
  await page.locator('.cartao').first().click()
  const dir = page.getByTestId('pagina-dir')
  await expect(dir).toContainText('Longo')
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight')
  const antes = await dir.innerText()
  expect(antes).not.toContain('Longo')

  await page.getByText('← Biblioteca').click() // garante as gravações pendentes antes de recarregar
  await expect(page.locator('.cartao p').nth(1)).not.toHaveText('0%')
  await page.reload()
  await expect(page.locator('.cartao p').nth(1)).not.toHaveText('0%')
  await page.locator('.cartao').first().click()
  await expect.poll(() => dir.innerText()).toBe(antes)
})

test('a Virada anima uma folha 3D e termina com o Par correto', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('arquivo').setInputFiles({ name: 'l.md', mimeType: 'text/markdown', buffer: Buffer.from(`# Longo\n\n${paragrafos}`) })
  await page.locator('.cartao').first().click()
  const dir = page.getByTestId('pagina-dir')
  await expect(dir).toContainText('Longo')
  const folha = page.getByTestId('folha')

  await page.keyboard.press('ArrowRight')
  await expect(folha).toHaveClass(/avanca/)
  await expect(folha.locator('.frente')).toContainText('Longo') // frente: Página direita antiga
  const t0 = Date.now()
  await expect(folha).toHaveCount(0)
  expect(Date.now() - t0).toBeGreaterThan(300)
  await expect(dir).not.toContainText('Longo')

  await page.keyboard.press('ArrowLeft')
  await expect(folha).toHaveClass(/volta/)
  await expect(folha.locator('.verso')).toContainText('Longo') // verso: Página direita do Par destino
  await expect(folha).toHaveCount(0)
  await expect(dir).toContainText('Longo')
})

test('com prefers-reduced-motion a troca é direta', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByTestId('arquivo').setInputFiles({ name: 'l.md', mimeType: 'text/markdown', buffer: Buffer.from(`# Longo\n\n${paragrafos}`) })
  await page.locator('.cartao').first().click()
  await expect(page.getByTestId('pagina-dir')).toContainText('Longo')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('pagina-dir')).not.toContainText('Longo')
  await expect(page.getByTestId('folha')).toHaveCount(0)
})

test('a paginação mede o DOM: nenhuma palavra fica cortada por overflow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const palavras: string[] = []
  const w = (p: string, i: number) => { const x = `${p}${i}`; palavras.push(x); return x }
  const partes = ['# Cap um']
  for (let c = 0; c < 4; c++) {
    if (c) partes.push(`# Cap ${c}x`)
    partes.push(`## ${w('sub', c)}`)
    for (let i = 0; i < 6; i++) {
      partes.push(Array.from({ length: 120 }, (_, j) => w(`p${c}_${i}_`, j)).join(' ') + ' ' + w('G', c * 10 + i) + 'x'.repeat(70))
      partes.push(Array.from({ length: 5 }, (_, j) => `- ${w(`li${c}_${i}_`, j)} item`).join('\n'))
    }
  }
  palavras.forEach((p, i) => { if (p.startsWith('G')) palavras[i] = p + 'x'.repeat(70) })
  await page.goto('/')
  await page.getByTestId('arquivo').setInputFiles({ name: 'l.md', mimeType: 'text/markdown', buffer: Buffer.from(partes.join('\n\n')) })
  await page.locator('.cartao').first().click()
  const livro = page.getByTestId('livro')
  await expect(page.getByTestId('pagina-dir')).toContainText('Cap um')
  const visto = new Set<string>()
  // innerText inclui texto cortado por overflow; por isso confere também que o último bloco de cada Página termina dentro dela
  const coleta = async () => {
    (await livro.innerText()).split(/\s+/).forEach((t) => visto.add(t))
    for (const id of ['pagina-esq', 'pagina-dir']) {
      const cortado = await page.getByTestId(id).evaluate((el) => {
        const u = el.lastElementChild
        return !!u && u.getBoundingClientRect().bottom > el.getBoundingClientRect().bottom + 0.5
      })
      expect(cortado, id).toBe(false)
    }
  }
  let antes = ''
  for (let i = 0; i < 200; i++) {
    await coleta()
    await page.keyboard.press('ArrowRight')
    const depois = await livro.innerText()
    if (depois === antes) break
    antes = depois
  }
  await coleta()
  expect(palavras.filter((p) => !visto.has(p))).toEqual([])
})
