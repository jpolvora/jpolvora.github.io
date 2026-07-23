# Histórico de Features - Jone Polvora Portfolio
<!-- last-updated: 2026-07-12 -->

Este documento lista e descreve todas as funcionalidades, otimizações e integrações adicionadas ao portfólio profissional de Jone Pólvora.

---

## 🚀 Lista de Features Implementadas

### 1. Visual e Layout Premium (UI/UX)
- **Tema Dark-Minimalist**: Paleta baseada em tons escuros de Slate/Gray com gradientes de Indigo/Purple.
- **Tipografia Moderna**: Fontes `Outfit` (para títulos e destaque) e `Plus Jakarta Sans` (para corpo e leitura fluida) via Google Fonts.
- **Cards com Glassmorphism**: Bordas semitransparentes, sombras suaves e efeito de desfoque de fundo (`backdrop-filter`) para uma estética moderna de alta qualidade.
- **Seção de Foco Ativo (Pinned Repos)**: Um grid destacado no topo exibindo os repositórios fixados do GitHub, com estilo premium glassmorphism, gradientes e indicador de status pulsante.
- **Badge de Ênfase "Novo Projeto"**: Badge com gradiente e glow pulsante para destacar o repositório `workflow-skills` como novo projeto em evidência, com variações de texto em pt/en/es via i18n.
- **Efeitos de Hover Dinâmicos**: Micro-animações e glows aplicados nos links de navegação, cards de projetos, botões de ação e tags.

### 2. Navegação Inteligente e Interativa
- **Menu de Navegação Rápida (Pills)**: Abas horizontais ("Projetos", "Cursos & Certificações", "Blog & Publicações") integradas abaixo da biografia.
- **Scroll Suave (Anchor Jumps)**: Transições e rolagem suaves configuradas via `scroll-behavior: smooth` ao clicar nas abas de navegação.
- **Botão Flutuante Voltar ao Topo**: Botão dinâmico na extremidade inferior direita que surge após rolar 300px de página e retorna o usuário ao cabeçalho suavemente no clique.
- **Internacionalização i18n (PT/EN/ES)**: Seletor de idioma no topo com detecção automática via `navigator.languages` e persistência em `localStorage`. Detalhes na Seção 8.

### 3. Showcase Dinâmico de Projetos
- **Integração Assíncrona via JSON**: Projetos carregados dinamicamente via JavaScript client-side a partir do arquivo `projects.json`.
- **Destaque de Foco Ativo**: Seção dedicada no topo que enfatiza os projetos prioritários atuais (repositórios fixados) e se oculta automaticamente durante buscas ou filtragens por tecnologia.
- **Busca em Tempo Real**: Filtro de pesquisa de texto instantâneo que varre títulos e descrições dos repositórios.
- **Badges de Tecnologias (Filtros)**: Geração dinâmica de tags de linguagem de programação. Clicar em uma tag isola instantaneamente os projetos daquela tecnologia.
- **Métricas de Engajamento**: Exibição da contagem de estrelas de repositórios relevantes com ícones estilizados.
- **Links Rápidos**: Ícones dinâmicos de redirecionamento para o código no GitHub e site ao vivo (quando há link de homepage cadastrado).

### 4. Dashboards de Métricas
- **Estatísticas Globais**: Contadores em destaque exibindo o total de projetos listados e estrelas agregadas.
- **Distribuição de Linguagens**: Gráfico em barra e legenda dinâmica colorida exibindo o percentual de tecnologias utilizadas em todo o ecossistema público do usuário.

### 5. Integração de Perfil Profissional
- **Resumo Refocado**: Bio e cabeçalho otimizados para destacar IA, Agentic Engineering & Orchestration, Harness e Product Engineering, além do retrospecto técnico de 20+ anos em TI e 15+ em desenvolvimento.
- **Cursos & Certificações**: Exibição em formato grid de cartões para certificados e conquistas do LinkedIn e Coodesh (Microservices, DotNet, React, Node, Agile).
- **Destaque do Blog WordPress**: Banner especial com gradiente exclusivo convidando recrutadores para o blog `jpolvora.wordpress.com`.
- **Artigos & Publicações**: Lista de links estruturada para publicações no LinkedIn focadas em AI Engineering e arquiteturas de agentes.

### 6. Otimização para Google SEO
- **Structured Data JSON-LD (Schema.org)**: Objeto de marcação estruturada `Person` embutido no HTML contendo cargos, URLs, mídias sociais e competências para enriquecer o snippet de busca do Google.
- **Metadados de Tecnologias (LinkedIn)**: Lista SEO de ~45 competências em `meta keywords` (pt/en/es via i18n) e `knowsAbout` no JSON-LD — IA/Agentic, .NET/C#, Node/TS, React/Angular, Azure/DevOps, microservices, DDD/SOLID/Clean Architecture e bancos de dados — alinhada ao perfil LinkedIn.
- **Meta Tags Avançadas**: Inclusão de tags Open Graph e Twitter Cards para formatação de cards de pré-visualização ao compartilhar o link.
- **Sitemap & Robots.txt**: Arquivos `sitemap.xml` para indexação completa e `robots.txt` orientando mecanismos de busca.
- **URL Canônica e Favicon**: Tags configuradas apontando para o link principal e usando o avatar de perfil como favicon padrão.

### 7. Infraestrutura de Atualização Automatizada
- **Cache-Busting**: Parâmetros de versão (`?v=1.2`) indexados aos scripts e estilos para evitar carregamento de visual quebrado por cache de navegador antigo.
- **Deploy GitHub Pages (legacy)**: Publicação automática a partir da branch `main` (`.nojekyll` garante servir HTML/CSS/JS estático sem Jekyll). Evita conflito com workflow Actions duplicado.
- **Script de Automação (`update.js`)**: Script integrado no Node (`npm run update`) que:
  - Scaneia a conta do usuário usando a CLI do GitHub (agora incluindo consulta GraphQL `gh api graphql` para os repositórios fixados).
  - Filtra forks inativos e repositórios sem descrição, além de remover o próprio repositório do portfólio de ambas as listas.
  - Atualiza o cache do `projects.json` com `projects` e `pinnedProjects`.
  - Abre uma Pull Request na branch de atualização para validação dos dados antes de ir ao ar (ou comita diretamente se `--skip-pr` for usado).

### 8. Internacionalização (i18n)
- **Três idiomas**: Português (pt-BR, padrão), Inglês (en) e Espanhol (es).
- **Seletor fixo no topo**: Botões PT / EN / ES no canto superior direito, com estado ativo destacado.
- **Detecção automática**: Prioriza preferência salva (`localStorage`), depois idiomas do navegador (`navigator.languages`), com fallback para pt.
- **Arquitetura**: `i18n.js` carrega `translations.json`, expõe `window.t()` e dispara eventos `i18n:ready` / `i18n:changed`.
- **HTML estático**: Atributo `data-i18n="chave"` em labels, títulos, botões e placeholders.
- **Conteúdo dinâmico**: `app.js` usa `window.t()` para filtros, estados vazios, erros e tooltips; re-renderiza ao trocar idioma.
- **SEO dinâmico**: `<title>`, meta description, Open Graph e Twitter Cards atualizados conforme o idioma selecionado.

### 9. Página Dedicada de Currículo (`curriculo.html`)
- **Página Standalone em Markdown**: Apresentação profissional completa formatada esteticamente em estilo Markdown escuro com tipografia moderna.
- **Cross-Linking Interativo**: Conexão bidirecional entre experiências profissionais, habilidades técnicas e os projetos open-source em destaque no repositório (`cursor-server`, `cursor-reviewer`, `agentic-code-reviewers`, `cursor-profile-manager`, `workflow-skills`, `dotenvy`), além de artigos no LinkedIn e certificações.
- **Suporte para Impressão e PDF**: Regras de CSS dedicadas (`@media print`) permitindo ao visitante ou recrutador imprimir ou exportar em PDF direto pelo navegador (`Ctrl+P`) com formatação limpa sobre fundo branco.
- **Multilíngue (i18n)**: Suporte completo para Português, Inglês e Espanhol na página dedicada.

