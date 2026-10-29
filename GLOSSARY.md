# Leitor de livros

Aplicação web para ler, em formato de livro aberto, livros escritos pelo próprio usuário e importados como arquivo.

## Language

**Livro**:
Obra importada de um arquivo, com título, autor, texto organizado em Capítulos e, opcionalmente, imagens.
_Avoid_: Documento, e-book

**Arquivo do livro**:
O arquivo montado que o usuário importa: um `.md` para um Livro só de texto, ou um `.livro` (pacote com o `livro.md` e as imagens) para um Livro com imagens.
_Avoid_: Pacote, upload

**Biblioteca**:
Conjunto dos Livros importados, mostrado na tela inicial como cartões.
_Avoid_: Lista, coleção, estante

**Capítulo**:
Divisão de um Livro marcada por um título de primeiro nível (`#`) no Markdown.
_Avoid_: Seção, parte

**Página**:
Cada metade do livro aberto: um recorte do texto do Livro que cabe na área de leitura, ou uma Imagem de página, ou uma Página especial (capa, verso da capa em branco, Página de informações).
_Avoid_: Folha, tela

**Imagem de página**:
Imagem do Livro exibida inteira, sem corte: em retrato ocupa uma Página, em paisagem ocupa o Par de páginas inteiro.
_Avoid_: Ilustração, figura

**Texto sobre a imagem**:
Bloco de texto posicionado sobre uma Imagem de página, por âncora (topo, meio ou base, com esquerda, centro ou direita), cujo tamanho acompanha o da imagem.
_Avoid_: Legenda, overlay

**Capa**:
A primeira imagem do Livro, mostrada sozinha à direita no primeiro Par de páginas e no cartão da Biblioteca. Sem imagem, o app gera uma capa com cor e título.
_Avoid_: Frente

**Página de informações**:
Página gerada pelo app com título, autor e ano (se houver), mostrada à direita do Par que segue a capa, com o verso da capa em branco à esquerda.
_Avoid_: Folha de rosto, créditos, ficha técnica

**Par de páginas**:
As duas Páginas visíveis ao mesmo tempo, esquerda e direita, como um livro aberto.
_Avoid_: Spread, dupla

**Virada**:
Passagem de um Par de páginas para o seguinte ou o anterior, acompanhada da animação da folha girando em torno da lombada.
_Avoid_: Transição, troca de página

**Posição de leitura**:
Ponto do texto do Livro em que o usuário parou, guardado pelo trecho e não pelo número da Página.
_Avoid_: Marcador, bookmark, progresso
