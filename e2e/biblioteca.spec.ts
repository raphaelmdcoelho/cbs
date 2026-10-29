import { test, expect, type Page } from '@playwright/test'

const importar = (page: Page, name: string, content: string) =>
  page.getByTestId('arquivo').setInputFiles({ name, mimeType: 'text/markdown', buffer: Buffer.from(content) })

test('importa livros com e sem YAML e mantém após recarregar', async ({ page }) => {
  await page.goto('/')
  await importar(page, 'a.md', '---\ntitulo: Dom Casmurro\nautor: Machado de Assis\n---\n# Capítulo 1\ntexto')
  await importar(page, 'b.md', '# Livro Simples\n\ntexto')

  for (const _ of [0, 1]) {
    const a = page.locator('.cartao', { hasText: 'Dom Casmurro' })
    await expect(a.getByRole('heading', { name: 'Dom Casmurro' })).toBeVisible()
    await expect(a).toContainText('Machado de Assis')
    await expect(a).toContainText('0%')
    const b = page.locator('.cartao', { hasText: 'Livro Simples' })
    await expect(b).toContainText('Autor desconhecido')
    await page.reload()
  }
})
