# AppStart

Template pedagógico **high-opinionated** full stack para ensino e construção de aplicações web modernas com **NestJS**, **React**, **PostgreSQL (Prisma ORM)** e autenticação federada **Keycloak (OIDC)** via **Backend for Frontend (BFF)**.

---

## Destaques do Template

- **Arquitetura BFF Segura:** O frontend nunca manipula credenciais ou tokens JWT; a comunicação é protegida por cookies `HttpOnly` com sessões opacas salvas no banco e proteção contra CSRF.
- **Tipagem Estrita Ponta a Ponta:** Contrato exportado em **OpenAPI 3.0** com geração automática de cliente TypeScript via **Orval** (`@/lib/api-client`).
- **Interface React Moderna:** React 19, Vite 8, Tailwind CSS, tema claro/escuro com prevenção de *flicker*, gerenciamento de dados remotos com **TanStack Query** e formulários com **React Hook Form + Zod**.
- **Governança de Dados:** Migrações versionadas, controle de propriedade (*ownership*) e remoção lógica (*soft delete*).
- **Módulo CRUD de Referência:** Módulo `tasks` demonstrando fluxo ponta a ponta, regras de negócio e testes automatizados.
- **Tutor de IA Integrado:** Skills pedagógicas em `.agent/skills/` que orientam o aluno passo a passo na criação de novos módulos.

---

## Início Rápido

### 1. Para criar o seu próprio projeto (Fluxo do Aluno)
Recomendamos o uso do **GitHub Codespaces** para não precisar configurar nada na sua máquina.

1. Clique no botão verde **"Use this template"** no topo desta página e crie o seu próprio repositório.
2. Abra o repositório recém-criado no **Codespaces** (ou clone localmente).
3. No terminal do VSCode, rode o comando mágico de configuração:

```bash
# O assistente vai renomear os arquivos, instalar dependências e subir o banco de dados
bash ./setup.sh --in-place --bootstrap
```
O script fará algumas perguntas (nome do projeto, portas) e vai transformar esse template no seu projeto final de forma automática!

> ⚠️ **Atenção no Codespaces (Erro de CORS/CSRF):**
> Se ao tentar fazer login o painel mostrar "Origem não permitida" ou "CORS error", é porque o backend foi feito para proteger contra acessos de URLs desconhecidas. Abra o seu arquivo `.env` e troque os `http://localhost` para as URLs públicas que o Codespaces gerou para você (mantendo as portas):
> ```env
> API_BASE_URL=https://NOME-DO-SEU-CODESPACE-3000.app.github.dev
> WEB_BASE_URL=https://NOME-DO-SEU-CODESPACE-5173.app.github.dev
> KEYCLOAK_BASE_URL=https://NOME-DO-SEU-CODESPACE-8080.app.github.dev
> ```
> Após alterar o `.env`, reinicie o servidor (`pnpm dev`) para ele ler as novas URLs!

---

### 2. Para rodar e contribuir com o Template (Ambiente Local)
Se você quer fazer alterações no template original em si, siga o fluxo de desenvolvimento local:

```bash
# 1. Habilitar o pnpm e instalar as dependências do template
corepack enable
pnpm install

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Executar setup completo (PostgreSQL + Keycloak + Migrations + Seed + Contratos)
pnpm run setup

# 4. Iniciar servidores de desenvolvimento (API + Web)
pnpm dev
```

Acesse a aplicação em: **[http://localhost:5173](http://localhost:5173)**  
Documentação da API Swagger em: **[http://localhost:3100/api/v1/docs](http://localhost:3100/api/v1/docs)**

---

## Credenciais Padrão de Desenvolvimento

| Usuário | E-mail | Senha | Papel | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `admin@appstart.local` | `admin` (ou `ChangeMe123456!`) | `ADMIN` | Gestão de usuários e visão global |
| **Aluno / Usuário** | `user@appstart.local` | `aluno` (ou `ChangeMe123456!`) | `USER` | Autoatendimento e módulo de tarefas |

---

## Arquitetura do Sistema

```text
Browser (React SPA) <--- Cookies HttpOnly ---> NestJS API (BFF) <--- OIDC PKCE ---> Keycloak IdP
                                                     |
                                                     v
                                             PostgreSQL (Prisma)
                                   (Perfis, Sessões, Categories, Tasks)
```

## Módulo de Categorias e Integração com Tarefas

O módulo `categories` permite que cada usuário organize suas tarefas com categorias próprias. Ele oferece operações para listar, criar, editar e remover categorias, respeitando a propriedade dos dados e usando remoção lógica.

Na página **Tarefas**, os formulários de criação e edição incluem um seletor opcional de categoria. Uma tarefa pode permanecer sem categoria ou ser vinculada a uma categoria existente. Essa associação é armazenada pelo campo `categoryId`, que referencia `Category` no Prisma; a API também retorna os dados resumidos da categoria junto da tarefa.

Na página **Categorias**, cada categoria mostra a quantidade de tarefas vinculadas e uma prévia de até três títulos. Quando há mais tarefas, o botão **“+N mais”** abre uma modal com a lista completa. Assim, a relação funciona nos dois sentidos: a tarefa pode ser categorizada no formulário, e a categoria permite consultar as tarefas associadas.

Para testar com dados de demonstração em um banco local, faça login ao menos uma vez como administrador e execute:

```bash
pnpm db:seed
```

O primeiro login cria o perfil local associado à conta do Keycloak. Depois disso, o seed acrescenta categorias e tarefas de exemplo sem apagar ou duplicar os dados existentes; a categoria **Projetos** fica com cinco tarefas para testar a modal.

---

## Documentação Técnica e Decisões (ADRs)

| Documento | Descrição |
| :--- | :--- |
| [docs/architecture-overview.md](docs/architecture-overview.md) | Visão geral da arquitetura, topologia, diagramas Mermaid e catálogo de rotas |
| [docs/feature-development-guide.md](docs/feature-development-guide.md) | Guia prático passo a passo para criar novas funcionalidades |
| [docs/testing-strategy-guide.md](docs/testing-strategy-guide.md) | Pirâmide de testes, comandos, escopos e exemplos |
| [docs/educator-guide.md](docs/educator-guide.md) | Manual para professores, preparação de turmas e exercícios práticos |
| [docs/reference-module-guidance.md](docs/reference-module-guidance.md) | Guia do módulo de referência `tasks`, como renomear ou remover |
| [docs/observability-and-troubleshooting.md](docs/observability-and-troubleshooting.md) | Logs estruturados, correlação `requestId` e health checks |
| [docs/glossary-and-concepts.md](docs/glossary-and-concepts.md) | Glossário com explicações didáticas sobre BFF, OIDC, PKCE, CSRF e Soft Delete |
| [docs/decisions/](docs/decisions/) | Registros de Decisão de Arquitetura (ADR-001 a ADR-006) |

---

## Skills de Apoio ao Desenvolvedor (AI Agents)

O repositório inclui skills pedagógicas prontas em `.agent/skills/`:
- **`appstart-feature-tutor`:** Tutor interativo que conduz o aluno passo a passo na criação de novas funcionalidades com checkpoints de validação.
- **`appstart-sync-docs`:** Sincronizador que audita e atualiza diagramas e documentações após alterações no código.
- **`appstart-architecture-review`:** Auditor de conformidade arquitetural e segurança.

---

## Mapa de Comandos do Repositório

```bash
# Desenvolvimento & Setup
pnpm run setup          # Executa o provisionamento inicial completo
pnpm dev            # Inicia API (3100) e Web (5173) em paralelo
pnpm scaffold       # Scaffolding interativo para criar novos projetos derivados

# Banco de Dados & Migrations
pnpm db:up          # Sobe o PostgreSQL via Docker
pnpm db:down        # Para o PostgreSQL mantendo os volumes
pnpm db:migrate     # Aplica migrations do Prisma
pnpm db:seed        # Executa o seed de dados
pnpm db:studio      # Abre a interface visual do Prisma Studio

# Autenticação (Keycloak)
pnpm auth:up        # Sobe o Keycloak e PostgreSQL
pnpm auth:down      # Para o Keycloak

# Contrato & Type-Safety
pnpm api:generate   # Gera openapi.json e o cliente TypeScript via Orval
pnpm api:check      # Valida se o cliente gerado está sincronizado com a API

# Qualidade & Testes
pnpm test           # Executa os testes do backend e frontend
pnpm docs:check     # Valida a integridade dos guias, ADRs, rotas e modelos
pnpm check:all      # Validação completa (testes + build + api:check + docs:check)
```
