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
