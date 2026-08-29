# Histórico de Features - Jone Polvora Portfolio
<!-- last-updated: 2026-08-29 -->

Este documento lista e descreve todas as funcionalidades, otimizações e integrações adicionadas ao portfólio profissional de Jone Pólvora.

---

## 🚀 Lista de Features Implementadas

### 1. Visual e Layout Premium (UI/UX)
- **Design System com Suporte Dark & Light Theme**: Paleta adaptativa com alternador dinâmico de tema (Dark padrão / Light) persistido em `localStorage` e integrado a `prefers-color-scheme`.
- **Malha e Glows Sutis de Fundo**: Efeitos de iluminação radial (`.bg-glow`) e malha quadriculada suave (`.bg-grid`) criando uma experiência imersiva sem comprometer a performance.
- **Tipografia Moderna**: Fontes `Outfit` (para títulos e destaque de autoridade) e `Plus Jakarta Sans` (para corpo e leitura fluida) via Google Fonts.
- **Cards com Glassmorphism**: Bordas semitransparentes, sombras suaves e efeito de desfoque de fundo (`backdrop-filter`) para uma estética moderna de alta qualidade.
- **Seção "Como eu ajudo" (`#services`)**: Grid de 4 pilares de consultoria e engenharia (Arquitetura de IA & Sistemas Agênticos, Software sob Medida .NET/React, Plataforma CI/CD/Cloud, Consultoria Técnica & Mentoria) com ícones lineares e bullet ticks.
- **Linha do Tempo da Trajetória na Home (`#experience`)**: Timeline interativa detalhando histórico profissional (7Focus, Jone Polvora Consultoria, Kyte SaaS, Acesso+, Freelancer) com badges de tecnologias diretamente na página principal.
- **Stack Técnica Categorizada (`#skills`)**: 8 blocos de especialidades arquiteturais (IA/Agentic, Backend, Frontend, Arquitetura, Bancos de Dados, DevOps/Cloud, Mensageria, Testes/Qualidade) mais módulo integrado de Formação e Certificações.
- **Efeitos de Hover Dinâmicos**: Micro-animações e glows aplicados nos links de navegação, cards de projetos, botões de ação e tags.

### 2. Navegação Inteligente e Arquitetura de CTA
- **Sticky Navbar (`site-head`)**: Cabeçalho fixo no topo com logo JP, navegação por âncoras (`#services`, `#focus`, `#work`, `#experience`, `#skills`, `#writing`), alternador de tema claro/escuro, seletor de idiomas e botão de ação rápido para o **Currículo**.
- **Hero com 3 Ações de Conversão**: Botões estratégicos para diferentes perfis de visitantes: `Falar sobre um projeto` (CTA primário), `Ver projetos` (Ghost button) e `Currículo` (Ghost button).
- **Indicador de Status Pulsante**: Badge dinâmico `● Disponível para consultoria e projetos` com animação radar glow.
- **Card Dedicado de Conversão (`#contact`)**: Seção de fechamento de alta visibilidade antes do rodapé com botões de contato direto para E-mail, LinkedIn, GitHub e endereço de e-mail clicável.
- **Scroll Suave (Anchor Jumps)**: Transições e rolagem suaves configuradas via `scroll-behavior: smooth` ao clicar nas âncoras da navbar.
- **Botão Flutuante Voltar ao Topo**: Botão dinâmico na extremidade inferior direita que surge após rolar 350px de página e retorna o usuário ao cabeçalho suavemente no clique.

### 3. Showcase Dinâmico de Projetos & Catálogo Colapsável
- **Vitrine Open Source Curada (`#focus`)**: Destaque para projetos estratégicos (`spec-memo`, `workflow-skills`, `agentic-code-reviewers`, `cursor-reviewer`, `cursor-server`, `ERP.Fiscal`, `dotenvy`, `FeatureManagement.Plus`) com chips temáticos de arquitetura (*Agent Memory / MCP*, *Spec-Driven Pipeline*, *Multi-Agent*, *Packagist 297+*).
- **Catálogo de Repositórios Colapsável (`#work`)**: Exibição inicial dos primeiros 12 repositórios públicos com botão expansor *"Ver todos os repositórios"* para manter a página scannable sem sobrecarregar a rolagem.
- **Busca em Tempo Real**: Filtro de pesquisa de texto instantâneo que varre títulos, descrições e tópicos dos repositórios.
- **Facetas de Filtro com Contadores**: Botões de tecnologia com contadores em tempo real gerados dinamicamente (`Todos 44`, `JavaScript 12`, `C# 10`, etc.).
- **Métricas de Engajamento**: Exibição da contagem de estrelas de repositórios relevantes com ícones estilizados.
- **Links Rápidos & Live Demo**: Ícones dinâmicos de redirecionamento para o código no GitHub e sites ao vivo / demonstrações.

### 4. Dashboards de Métricas
- **Estatísticas Agregadas no Hero**: Contadores em destaque exibindo anos em TI (20+), anos em software (15+), total de repositórios públicos (44) e idiomas de trabalho (3).
- **Distribuição de Linguagens**: Gráfico em barra e legenda dinâmica colorida exibindo o percentual de tecnologias utilizadas em todo o ecossistema público do usuário.

### 5. Integração de Perfil Profissional & Publicações
- **Destaque do Blog WordPress**: Banner especial com gradiente exclusivo convidando para o blog `jpolvora.wordpress.com`.
- **Artigos & Publicações**: Lista de links estruturada para publicações no LinkedIn focadas em AI Engineering, Spec-Driven Development e arquitetura contextual.

### 6. Otimização para Google SEO
- **Structured Data JSON-LD (Schema.org)**: Objeto de marcação estruturada `Person` embutido no HTML contendo cargos, URLs, mídias sociais, endereço postal, organização (`worksFor: 7Focus Consultoria`), idiomas (`knowsLanguage`) e catálogo completo de competências em `knowsAbout`.
- **Tags Hreflang e Alternates Multilíngues**: Configuração de links canônicos e tags `rel="alternate"` para indexação de páginas em PT, EN e ES.
- **Meta Tags Avançadas**: Inclusão de tags Open Graph e Twitter Cards para formatação de cards de pré-visualização ao compartilhar o link.
- **Sitemap & Robots.txt**: Arquivos `sitemap.xml` para indexação completa e `robots.txt` orientando mecanismos de busca.

### 7. Infraestrutura de Atualização Automatizada
- **Cache-Busting v3.0**: Parâmetros de versão (`?v=3.0`) indexados aos scripts e estilos para evitar carregamento de visual quebrado por cache de navegador antigo.
- **Deploy GitHub Pages**: Publicação automática a partir da branch `main` com arquivo `.nojekyll`.
- **Script de Automação (`update.js`)**: Script integrado no Node (`npm run update` / `npm run sync`) que scaneia a conta do usuário via GitHub CLI, enriquece metadados, atualiza `projects.json`, sincroniza `sitemap.xml` e regenera o PDF.
- **Gerador de PDF Automatizado (`scripts/generate-pdf.js`)**: Script que utiliza Chrome/Edge headless para gerar `curriculo-jone-polvora.pdf` em alta resolução diretamente do HTML (`npm run generate-pdf`).

### 8. Internacionalização (i18n)
- **Três idiomas completos**: Português (pt-BR, padrão), Inglês (en) e Espanhol (es).
- **Seletor de idioma integrado na navbar**: Botões PT / EN / ES no canto superior direito, com estado ativo destacado.
- **Detecção automática**: Prioriza preferência salva (`localStorage`), depois idiomas do navegador (`navigator.languages`), com fallback para pt.
- **Arquitetura Reativa**: `i18n.js` carrega `translations.json?v=3.0`, expõe `window.t()` e dispara eventos `i18n:ready` / `i18n:changed`.
- **HTML estático & Conteúdo dinâmico**: Atributos `data-i18n="chave"` em todas as seções (Serviços, Trajetória, Stack, Contato, etc.) e re-renderização client-side no `app.js`.

### 9. Página Dedicada de Currículo (`curriculo.html`)
- **Página Standalone em Markdown**: Apresentação profissional completa formatada esteticamente em estilo Markdown com tipografia moderna.
- **Cross-Linking Interativo**: Conexão bidirecional entre experiências profissionais, habilidades técnicas e os projetos open-source em destaque no repositório.
- **Suporte para Impressão e PDF**: Regras de CSS dedicadas (`@media print`) permitindo ao visitante ou recrutador imprimir ou exportar em PDF direto pelo navegador (`Ctrl+P`) com formatação limpa sobre fundo branco.
- **Privacidade Sanitizada**: Exclusão estrita de dados sensíveis (sem CPF, sem telefone, sem endereços privados), mantendo apenas canais públicos autorizados.
- **Multilíngue (i18n)**: Suporte completo para Português, Inglês e Espanhol na página dedicada.
