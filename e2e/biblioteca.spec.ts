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

test('recusa arquivos inválidos sem alterar a Biblioteca', async ({ page }) => {
  await page.goto('/')
  for (const [nome, conteudo, motivo] of [
    ['a.txt', 'texto', 'só são aceitos arquivos .md'],
    ['v.md', '', 'está vazio'],
    ['g.md', 'x'.repeat(5 * 1024 * 1024 + 1), 'mais de 5 MB'],
  ] as const) {
    await importar(page, nome, conteudo)
    await expect(page.getByRole('alert')).toContainText(motivo)
    await expect(page.locator('.cartao')).toHaveCount(0)
  }
})

test('duplicado: cancelar mantém, substituir troca e zera progresso', async ({ page }) => {
  await page.goto('/')
  const resp = (aceitar: boolean) => page.once('dialog', (d) => void (aceitar ? d.accept() : d.dismiss()))
  await importar(page, 'a.md', '---\ntitulo: T\nautor: A\n---\nvelho')
  await page.evaluate(async () => {
    const r = indexedDB.open('leitor'); await new Promise((ok) => (r.onsuccess = ok))
    const s = r.result.transaction('livros', 'readwrite').objectStore('livros')
    s.getAll().onsuccess = (e) => { for (const l of (e.target as IDBRequest).result) s.put({ ...l, progresso: 40 }) }
    await new Promise((ok) => setTimeout(ok, 200))
  })
  await page.reload()
  await expect(page.locator('.cartao')).toContainText('40%')

  resp(false)
  await importar(page, 'b.md', '---\ntitulo: T\nautor: A\n---\nnovo')
  await expect(page.locator('.cartao')).toHaveCount(1)
  await expect(page.locator('.cartao')).toContainText('40%')

  resp(true)
  await importar(page, 'b.md', '---\ntitulo: T\nautor: A\n---\nnovo')
  await expect(page.locator('.cartao')).toHaveCount(1)
  await expect(page.locator('.cartao')).toContainText('0%')
})

test('remover pede confirmação e apaga o Livro', async ({ page }) => {
  await page.goto('/')
  await importar(page, 'a.md', '# R\n\ntexto')
  page.once('dialog', (d) => void d.dismiss())
  await page.getByRole('button', { name: 'Remover' }).click()
  await expect(page.locator('.cartao')).toHaveCount(1)
  page.once('dialog', (d) => void d.accept())
  await page.getByRole('button', { name: 'Remover' }).click()
  await expect(page.locator('.cartao')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('.cartao')).toHaveCount(0)
})
