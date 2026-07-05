# Diretrizes para Agentes de IA — jpolvora.github.io

> **Harness compatibility note:**
> This file lives at the **repository root** so it is automatically discovered
> by Codex, Jules, GitHub Copilot, Cursor, Aider, Devin, Windsurf, and other
> AI coding harnesses that follow the `AGENTS.md` open standard.
> An identical copy is kept at `.agents/AGENTS.md` for tools (e.g. Antigravity)
> that discover workspace rules from the `.agents/` directory.

---

## 📋 Regras de Manutenção Obrigatórias

### 1. Revisão de Segurança Pré-Commit ⚠️ OBRIGATÓRIO
- **Regra**: **SEMPRE** execute o scanner de segurança antes de qualquer `git commit` ou `git push`.
- **Comando**:
  ```bash
  npm run security-check
  ```
- **Bloqueio**: Findings com severidade `CRITICAL` ou `HIGH` **bloqueiam o commit** até serem corrigidos.
- **O que é escaneado**: Tokens/API keys, senhas hardcoded, blocos PEM, connection strings, CPF, telefones brasileiros, endereços físicos, CEP, e-mails privados.
- **Skill detalhada**: `.agents/skills/security-review/SKILL.md`

### 2. Atualização do `FEATURES.md`
- **Regra**: Toda vez que uma nova feature, layout, seção ou otimização for adicionada, modificada ou removida do portfólio, o arquivo [FEATURES.md](./FEATURES.md) **DEVE** ser atualizado.
- **Formato**: Registre a nova feature na seção correspondente (UI/UX, Navegação, Projetos, Métricas, Integrações, SEO, Automação, Segurança) de forma curta e autoexplicativa.

### 3. Verificação do Script de Automação (`update.js`)
- **Regra**: A cada mudança na estrutura de dados do portfólio ou inclusão de novos campos dinâmicos, o script [update.js](./update.js) **DEVE** ser revisado.
- **Ações**:
  - Verifique se a chamada ao GitHub CLI (`gh repo list`) e o parsing de JSON continuam mapeando corretamente as informações do portfólio.
  - Certifique-se de que o script não sobrescreva dados customizados caso novas estruturas dependam do JSON.
  - Teste com `npm run update` (cria PR) ou `npm run sync` (commit direto) após qualquer alteração no fluxo de dados.

### 4. Sincronização de Metadados e SEO
- **Regra**: Se houver qualquer modificação na biografia ou no título profissional do usuário, os seguintes locais de metadados devem ser sincronizados:
  - `<title>` e `<meta name="description">` / `<meta name="keywords">` no `index.html`.
  - Tags Open Graph (`og:title`, `og:description`) e Twitter Cards no `index.html`.
  - Objeto JSON-LD (`@type: Person`) no `<head>` do `index.html`.
  - `<lastmod>` no `sitemap.xml` (atualizado automaticamente por `npm run sync`).

### 5. Versionamento de Cache (Cache-Busting)
- **Regra**: Toda vez que houver alterações no visual (`style.css`) ou na lógica frontend (`app.js`), o parâmetro de versão nos links do `index.html` deve ser incrementado (exemplo: `style.css?v=1.2` → `style.css?v=1.3`) para evitar visualizações quebradas por cache persistente em navegadores de visitantes e recrutadores.

---

## 🔄 Fluxo de Trabalho Padrão

```
Fazer mudanças no código
       │
       ▼
npm run security-check   ← OBRIGATÓRIO (bloqueia se CRITICAL/HIGH)
       │
       ▼
Atualizar FEATURES.md   ← OBRIGATÓRIO para toda nova feature
       │
       ├─ Mudança de dados?  →  npm run update  (cria PR para revisão)
       │                     ou  npm run sync   (commit direto + deploy)
       │
       ▼
git add / git commit / git push
       │
       ▼
GitHub Actions faz o deploy automático no GitHub Pages
```

---

## 📂 Estrutura de Arquivos Relevantes

| Arquivo | Propósito |
|---|---|
| `index.html` | Página principal do portfólio |
| `style.css` | Design system e todos os estilos |
| `app.js` | Lógica frontend (carrega projetos, filtros, scroll) |
| `update.js` | Script de automação de atualização do portfólio |
| `projects.json` | Cache de dados dos repositórios públicos |
| `sitemap.xml` | Mapa do site para indexação de buscadores |
| `robots.txt` | Diretivas para crawlers de busca |
| `FEATURES.md` | Histórico de features do portfólio |
| `scripts/scan-secrets.js` | Scanner de segurança pré-commit |
| `.agents/skills/security-review/SKILL.md` | Skill detalhada de segurança |
