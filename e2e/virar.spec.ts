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
