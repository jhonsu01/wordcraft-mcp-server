<p align="center"><img src="icon.png" width="120" alt="Ícone do WordCraft Bridge"></p>

<h1 align="center">WordCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <b>Português</b> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Deixe o Claude escrever e editar documentos com o <b>WordCraft</b> instalado no seu computador — <b>Windows, macOS e Linux</b>:<br>
  relatórios, cartas e currículos, localizar e substituir, comentários e controle de alterações, mala direta, e DOCX, PDF, ODT, RTF, HTML, Markdown e LaTeX.
</p>

---

## Por quê

[WordCraft](https://github.com/storytold/wordcraft) é um processador de texto de código aberto no estilo do Word, escrito em Rust, com uma CLI sem interface (`wordcraft-cli`), 615 comandos, suporte a DOCX / ODT / RTF / PDF e um modo MCP. Este servidor [Model Context Protocol](https://modelcontextprotocol.io) transforma esse motor em **ferramentas de arquivo de entrada / arquivo de saída** para o Claude, para você pedir coisas como:

> *"Escreva um relatório trimestral de 3 páginas com sumário, uma tabela de vendas, este gráfico e números de página, em DOCX e PDF."*
> *"Em `contrato.docx`, troque 'ACME Ltda.' por 'ACME S.A.' com controle de alterações e adicione um comentário na cláusula de pagamento."*
> *"Crie uma carta para cada cliente de `clientes.xlsx`, com nome e cidade."*
> *"Aceite todas as alterações de cada documento em `D:\Contratos` e exporte-os como PDF."*
> *"Converta estas notas em Markdown para Word, e este Word para LaTeX."*

Irmão de [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server) e [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Plataformas

| SO | Pacote do WordCraft a instalar | Onde o servidor o encontra (sem configuração) | Status |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI ou zip portátil | `C:\Program Files\WordCraft`, `%LOCALAPPDATA%\Programs\WordCraft`, `PATH` | ✅ Verificado (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` ou `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/wordcraft/bin`, `~/.local/bin`, `PATH` | ✅ Verificado (Debian 12, sem interface) |
| **macOS** 11+ (Apple silicon e Intel) | `.dmg` (o app) **mais** `wordcraft-cli-<versão>-macos-universal.zip` | `/Applications/WordCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Suportado, ainda não testado em um Mac |

Todos os downloads: [versões do WordCraft](https://github.com/storytold/wordcraft/releases) (também há um tar.gz para FreeBSD; aponte `WORDCRAFT_DIR` para ele). Em qualquer outro lugar: defina `WORDCRAFT_DIR` (pasta, raiz do `.tar.gz` ou `WordCraft.app`) ou `WORDCRAFT_CLI`.

- **macOS:** o DMG contém só o app. Descompacte o zip separado do `wordcraft-cli` e mova `wordcraft-cli` para `/usr/local/bin` (ou aponte `WORDCRAFT_CLI` para ele). A primeira execução verifica online a notarização da Apple.
- **Linux:** o AppImage e o Flatpak contêm só o app, não o `wordcraft-cli`; use o deb, o rpm ou o tar.gz. Para um app AppImage, defina `WORDCRAFT_APP` para que `open_in_wordcraft` possa abri-lo. Em um servidor sem GPU, a configuração verificada usou `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## Como funciona

| Parte | O que é |
| --- | --- |
| **Motor do WordCraft** (`wordcraft-cli mcp`) | O próprio motor do WordCraft: layout, estilos, listas, tabelas, campos, referências, revisão, correspondências e os gravadores DOCX / PDF / ODT / RTF / HTML / Markdown / LaTeX. Iniciado do zero e **sem interface** a cada tarefa, então nunca mexe no app do WordCraft nem em um documento aberto. |
| **Servidor MCP** (Node.js) | 11 ferramentas de alto nível. Monta documentos a partir de uma lista simples de blocos (títulos, parágrafos, listas, tabelas, imagens, sumário, notas de rodapé), mantém o cursor no lugar certo entre blocos e verifica cada saída antes: o WordCraft sozinho substituiria arquivos existentes sem avisar. |
| **App ao vivo** (opcional) | `open_in_wordcraft control=true` abre o app com seu canal de controle apenas local (porta 7985) e `run_wordcraft_commands live=true` o controla. Feche o app ao terminar. |

## Ferramentas

| Ferramenta | O que faz |
| --- | --- |
| `create_document` | Um documento novo, em branco ou a partir dos modelos carta / currículo / relatório / exemplo, feito de blocos: títulos 1–9, parágrafos (estilo, alinhamento, negrito, itálico, sublinhado, fonte, tamanho, cor, realce), listas com marcadores e numeradas, tabelas (linha de cabeçalho, estilo, legenda), imagens (largura, texto alternativo, legenda), quebras de página, sumário e notas de rodapé; tamanho de página, orientação, margens, cabeçalho, rodapé, números de página e propriedades. Retorna uma prévia da página 1 |
| `edit_document` | Um documento, uma lista ou uma pasta: localizar / substituir (maiúsculas, palavra inteira, curingas), comentários em qualquer texto, controle de alterações (cada edição revisável), aceitar ou rejeitar todas as revisões, acrescentar blocos, remover informações pessoais; salvo como nova cópia |
| `mail_merge` | Cartas a partir de CSV, TSV, XLSX ou ODS: um modelo com campos de mesclagem ou um corpo escrito com marcadores `{{Campo}}`; um documento mesclado (DOCX, PDF...) |
| `convert_document` | Um documento, uma lista ou uma pasta → DOCX, PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, JSON do WordCraft ou páginas PNG, opcionalmente com marcações (comentários e alterações) |
| `get_document_info` | Páginas, palavras, caracteres, parágrafos, propriedades, estilos, títulos, tabelas, imagens, comentários e revisões |
| `extract_text` | Texto puro de um documento, opcionalmente salvo como `.txt` |
| `render_pages` | Páginas mostradas ao Claude e opcionalmente salvas como PNG |
| `list_wordcraft_catalog` | 615 comandos com parâmetros, estilos, modelos, formatos |
| `run_wordcraft_commands` | Quaisquer comandos do motor mais `type_text`, `select_text`, `get_text`, `inspect_document`... em uma sessão (referências `$steps[N].campo`), sem interface ou ao vivo, e depois salvar |
| `open_in_wordcraft` | Abre documentos no app WordCraft (opcionalmente com o canal de controle) |
| `get_wordcraft_status` | Plataforma, instalação, versão, comandos, app / porta de controle |

| | |
| --- | --- |
| **Abre** | DOCX, DOC, DOTX, DOCM, ODT, RTF, Markdown, LaTeX, HTML, TXT, JSON do WordCraft; insere PNG, JPEG, GIF, BMP, WebP, TIFF e SVG; mescla CSV / TSV / XLSX / ODS |
| **Salva** | DOCX (opcionalmente com senha), PDF, ODT, RTF, HTML, Markdown, LaTeX, TXT, JSON do WordCraft, páginas PNG |

## Exemplo

```json
{
  "name": "Quarterly report",
  "template": "blank",
  "page_size": "A4",
  "margins": "normal",
  "header": "ACME S.A.S.",
  "page_numbers": "bottom",
  "title": "Quarterly report 2026",
  "author": "Finance",
  "blocks": [
    { "type": "paragraph", "text": "Quarterly report 2026", "style": "Title" },
    { "type": "toc", "levels": 2 },
    { "type": "heading", "text": "Summary", "level": 1 },
    { "type": "paragraph", "text": "Sales grew 12 % over the last quarter." },
    { "type": "paragraph", "text": "Highlight in bold red.", "bold": true, "color": "#c00000", "align": "center" },
    { "type": "bullets", "items": ["Grow in Colombia", "Open Peru", "Cut costs"] },
    { "type": "heading", "text": "Results", "level": 1 },
    { "type": "table", "caption": "Sales by region", "rows": [["Region", "Sales", "Change"], ["North", "1,200", "+8 %"], ["South", "950", "+15 %"]] },
    { "type": "image", "path": "C:\\Reports\\chart.png", "width": 360, "caption": "Sales by month" },
    { "type": "footnote", "text": "Source: internal data." }
  ],
  "formats": ["docx", "pdf"],
  "output_dir": "C:\\Reports"
}
```

## Requisitos

- **WordCraft** com `wordcraft-cli` (testado com **0.6.1**); veja [Plataformas](#plataformas)
- Node.js ≥ 20 (incluído no Claude Desktop para instalações `.mcpb`)

## Instalação

### Claude Desktop (recomendado, todas as plataformas)

1. Baixe `wordcraft-mcp-server.mcpb` da [versão mais recente](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest).
2. Dê um clique duplo (ou arraste para o Claude Desktop → *Configurações → Extensões*) e clique em **Instalar**.
3. Opcional: se o WordCraft não estiver em um local padrão, informe a pasta dele ou o caminho do `wordcraft-cli` nas configurações da extensão.

### Sunsam Code

Instale o **WordCraft Bridge** pelo marketplace do [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode), ou solte o `.mcpb` em *MCP → Instalar extensão*.

### Codex (OpenAI)

**Recomendado — o marketplace (recebe atualizações):** *Plugins → Adicionar → Adicionar marketplace*, origem `jhonsu01/craft-marketplace`, referência `main`, e instale o **WordCraft Bridge** em **Craft Bridges** ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). As novas versões chegam ao atualizar o marketplace. Ou envie o zip (o Codex o guarda na sua conta e recusa um zip mais novo com o mesmo nome):

1. Baixe `wordcraft-mcp-server-<versão>-codex.zip` da [versão mais recente](https://github.com/jhonsu01/wordcraft-mcp-server/releases/latest).
2. No Codex: *Plugins → Adicionar → Novo plugin*, escolha o zip e clique em **Adicionar plugin**.
3. O Codex inicia o servidor com `node`, então o Node.js ≥ 20 precisa estar no `PATH`. Se o WordCraft não estiver em um local padrão, defina `WORDCRAFT_DIR` ou `WORDCRAFT_CLI` como variáveis de ambiente do sistema (o Codex não tem formulário de configuração para plugins locais).

### DeepSeek Harness

1. *Plugins → Add plugin*, digite `github:jhonsu01/craft-marketplace#path:/plugins/wordcraft-mcp-server` e clique em **Install** e depois em **Enable now**.
2. O Harness inicia o servidor com seu próprio cliente MCP e `node` (Node.js ≥ 20 no `PATH`); as ferramentas aparecem como `mcp__wordcraft__<ferramenta>` e os arquivos de saída como cartões que abrem no Harness.
3. O Harness ainda não atualiza plugins sozinho: para atualizar, desinstale o plugin e instale-o de novo com o mesmo endereço.

### Claude Code / outros clientes MCP

```bash
git clone https://github.com/jhonsu01/wordcraft-mcp-server.git
cd wordcraft-mcp-server
npm install
npm run build
```

Windows:

```bash
claude mcp add wordcraft -- node "%CD%\dist\bundle.cjs"
```

macOS / Linux:

```bash
claude mcp add wordcraft -- node "$PWD/dist/bundle.cjs"
```

## Configuração

| Variável | Significado |
| --- | --- |
| `WORDCRAFT_DIR` | Pasta do WordCraft, um de seus executáveis, a raiz de um `.tar.gz` (com `bin/`) ou `WordCraft.app`. Padrão: detecção automática |
| `WORDCRAFT_CLI` | Caminho do `wordcraft-cli` / `wordcraft-cli.exe` (tem prioridade sobre `WORDCRAFT_DIR`) |
| `WORDCRAFT_APP` | Caminho do app de desktop quando ele está em outro lugar (ex.: um AppImage no Linux) |
| `WORDCRAFT_CONTROL_PORT` | Porta de controle do app de desktop (padrão 7985) |
| `WORDCRAFT_MCP_TIMEOUT` | Máximo de segundos por chamada ao motor (padrão 3600) |

## Segurança

- Os arquivos **nunca são sobrescritos**, a menos que `overwrite: true`: em pastas é usado um nome livre (`_2`) e um `output_path` existente é um erro. Documentos, imagens e dados só são lidos; um documento editado só é salvo como cópia nova.
- Todos os caminhos devem ser absolutos. O motor roda sem interface com documentos em memória e nunca mexe no app do WordCraft, a menos que `live: true`.
- Tudo roda localmente, sem acesso à rede. Cada tarefa usa um motor privado em uma pasta temporária que é apagada no final.

## Desenvolvimento

```bash
npm run build       # TypeScript + bundle de arquivo único (dist/bundle.cjs)
npm test            # testes unitários (lógica de caminhos de Windows, macOS e Linux)
npm run test:e2e    # 29 verificações de ponta a ponta (31 com `E2E_LIVE=1`) via MCP stdio real (imagem e CSV sintéticos)
npm run pack:mcpb   # wordcraft-mcp-server.mcpb
npm run pack:codex  # zip do plugin para Codex / DeepSeek Harness
```

Teste de Linux no Docker (descompacte antes `wordcraft-<versão>-linux-x86_64.tar.gz`):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/caminho/para/wordcraft-0.6.1-linux-x86_64:/opt/wordcraft:ro" -e WORDCRAFT_DIR=/opt/wordcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## Licença

Apache-2.0. O WordCraft é © de seus autores (Storytold), MIT ou Apache-2.0.
Este projeto não é afiliado nem endossado pelo WordCraft ou pela Storytold. Word é uma marca da Microsoft.
