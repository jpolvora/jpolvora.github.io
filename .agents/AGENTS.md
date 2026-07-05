# Diretrizes para Agentes de IA (Workspace-scoped Rules)

Este documento contém as instruções que os assistentes de IA (Copilots, Agents, IDEs) devem seguir ao fazer modificações neste repositório.

---

## 📋 Regras de Manutenção Obrigatórias

### 1. Atualização do `FEATURES.md`
- **Regra**: Toda vez que uma nova feature, layout, seção ou otimização for adicionada, modificada ou removida do portfólio, o arquivo [FEATURES.md](file:///l:/source/jportifolio/FEATURES.md) **DEVE** ser atualizado.
- **Formato**: Registre a nova feature na seção correspondente (UI/UX, Navegação, Projetos, Métricas, Integrações, SEO, Automação) de forma curta e autoexplicativa.

### 2. Verificação do Script de Automação (`update.js`)
- **Regra**: A cada mudança na estrutura de dados do portfólio ou inclusão de novos campos dinâmicos, o script de varredura [update.js](file:///l:/source/jportifolio/update.js) **DEVE** ser revisado.
- **Ações**:
  - Verifique se a chamada ao GitHub CLI (`gh repo list`) e o parsing de JSON continuam mapeando corretamente as informações do portfólio.
  - Certifique-se de que o script não sobrescreva dados customizados caso novas estruturas dependam do JSON.
  - Teste a execução com `npm run update` após qualquer alteração no fluxo de dados.

### 3. Sincronização de Metadados e SEO
- **Regra**: Se houver qualquer modificação na biografia ou no título profissional do usuário, os seguintes locais de metadados devem ser sincronizados:
  - `<title>` e tags `<meta name="description">` e `<meta name="keywords">` no cabeçalho do `index.html`.
  - Tags de Open Graph (`og:title`, `og:description`) e Twitter Cards no `index.html`.
  - Objeto de dados estruturados JSON-LD (`@type: Person`) no cabeçalho.
  - Data de modificação em `sitemap.xml`.

### 4. Versionamento de Cache (Cache-Busting)
- **Regra**: Toda vez que houver alterações no visual (`style.css`) ou na lógica frontend (`app.js`), o parâmetro de versão nos links do `index.html` deve ser incrementado (exemplo: de `style.css?v=1.2` para `style.css?v=1.3`) para evitar visualizações quebradas por cache persistente em navegadores de visitantes e recrutadores.
