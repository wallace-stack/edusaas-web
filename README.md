<div align="center">

# 🎓 EduSaaS Web

**Plataforma SaaS Educacional — Frontend**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.7-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F97316?style=for-the-badge)](LICENSE)

Interface moderna e responsiva para gestão educacional completa, com painéis específicos por perfil de usuário.

</div>

---

## 📋 Sobre o Projeto

O **EduSaaS Web** é o frontend de uma plataforma SaaS voltada para instituições de ensino. Permite que diretores, coordenadores, professores e alunos acessem informações e realizem ações de acordo com seu perfil — tudo em uma interface limpa, intuitiva e responsiva.

> Este repositório contém apenas o frontend. O backend (API REST) está disponível em 👉 [edusaas-api](https://github.com/wallace-stack/edusaas-api)

---

## ✨ Funcionalidades por Perfil

### 🏫 Diretor
| Módulo | Descrição |
|---|---|
| 📊 Dashboard | Métricas gerais da instituição |
| 👥 Usuários | Cadastro e gestão de todos os usuários |
| 🏛️ Turmas | Criação e acompanhamento de turmas |
| 💰 Financeiro | Mensalidades, inadimplência e fluxo de caixa |
| 🔔 Notificações | Central de avisos |

### 🗂️ Coordenador
| Módulo | Descrição |
|---|---|
| 📊 Dashboard | Visão geral pedagógica |
| 🎒 Alunos | Listagem e busca de alunos |
| 🏛️ Turmas | Visualização das turmas cadastradas |
| 🔔 Notificações | Central de avisos |

### 📚 Professor
| Módulo | Descrição |
|---|---|
| 📊 Dashboard | Resumo das turmas e atividades |
| 🏛️ Turmas | Minhas turmas com acesso rápido |
| 📝 Notas | Lançamento de notas por turma e disciplina |
| ✅ Chamada | Registro de frequência com status presente/ausente/justificado |

### 🎒 Aluno
| Módulo | Descrição |
|---|---|
| 📊 Dashboard | Resumo acadêmico pessoal |
| 📝 Notas | Consulta de notas por bimestre e disciplina |
| 📅 Frequência | Histórico de presença |
| 💳 Financeiro | Status de mensalidades |
| 🔔 Avisos | Comunicados da escola |

---

## 🛠️ Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16.1.7 | Framework React com App Router |
| [React](https://react.dev/) | 19 | Biblioteca de UI |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Tipagem estática |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Estilização utilitária |
| [React Hook Form](https://react-hook-form.com/) | 7.x | Gerenciamento de formulários |
| [Zod](https://zod.dev/) | 4.x | Validação de schemas |
| [Axios](https://axios-http.com/) | 1.x | Cliente HTTP |
| [Lucide React](https://lucide.dev/) | 0.57x | Ícones |
| [js-cookie](https://github.com/js-cookie/js-cookie) | 3.x | Gerenciamento de cookies |

---

## 📁 Estrutura de Pastas

```
edusaas-web/
├── app/
│   ├── cadastro/           # Página de cadastro de instituição
│   ├── login/              # Autenticação
│   ├── recuperar-senha/    # Solicitação de reset de senha
│   ├── nova-senha/         # Redefinição de senha
│   ├── dashboard/
│   │   ├── aluno/
│   │   │   ├── page.tsx         # Dashboard do aluno
│   │   │   ├── notas/           # Consulta de notas
│   │   │   ├── frequencia/      # Histórico de frequência
│   │   │   ├── financeiro/      # Mensalidades
│   │   │   └── avisos/          # Avisos
│   │   ├── coordenador/
│   │   │   ├── page.tsx         # Dashboard do coordenador
│   │   │   ├── alunos/          # Listagem de alunos
│   │   │   ├── turmas/          # Turmas cadastradas
│   │   │   └── notificacoes/    # Notificações
│   │   ├── diretor/
│   │   │   ├── page.tsx         # Dashboard do diretor
│   │   │   ├── usuarios/        # Gestão de usuários
│   │   │   ├── turmas/          # Gestão de turmas
│   │   │   ├── financeiro/      # Painel financeiro
│   │   │   └── notificacoes/    # Notificações
│   │   └── professor/
│   │       ├── page.tsx         # Dashboard do professor
│   │       ├── turmas/          # Minhas turmas
│   │       ├── notas/           # Lançamento de notas
│   │       └── chamada/         # Registro de chamada
│   └── lib/
│       ├── api.ts          # Instância Axios com interceptors JWT
│       └── auth.ts         # Helpers de autenticação
├── public/                 # Assets estáticos
├── .env.local              # Variáveis de ambiente (não versionado)
└── next.config.ts
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend [edusaas-api](https://github.com/wallace-stack/edusaas-api) rodando localmente

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/wallace-stack/edusaas-web.git
cd edusaas-web

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3001](http://localhost:3001) no navegador.

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# URL base da API backend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

> ⚠️ Nunca versione o `.env.local`. Ele já está no `.gitignore`.

---

## 🖼️ Screenshots

> 📌 Screenshots serão adicionados após o deploy em produção.

| Tela | Descrição |
|---|---|
| 🔐 Login | Autenticação com email e senha |
| 🏠 Dashboard Diretor | Métricas gerais e atalhos |
| 📝 Lançar Notas | Seleção de turma, disciplina e aluno |
| ✅ Chamada | Lista de alunos com toggle de presença |
| 💰 Financeiro | Tabs de mensalidades e fluxo de caixa |

---

## 🔒 Segurança

- **Validação com Zod** — todos os formulários de entrada validados no cliente
- **Proteção de rotas** — cada página verifica o `user.role` antes de renderizar; redireciona para `/login` se não autenticado
- **JWT via cookie** — token armazenado em cookie; interceptor Axios injeta o header `Authorization: Bearer` automaticamente
- **Redirect em 401/402** — interceptor de resposta redireciona para `/login` ou página de pagamento conforme o status HTTP
- **Sem dados sensíveis no frontend** — nenhuma chave de API, secret ou credencial de banco exposta no código

---

## ☁️ Deploy

O projeto está configurado para deploy automático na **Vercel**:

1. Conecte o repositório GitHub à Vercel
2. Configure a variável de ambiente `NEXT_PUBLIC_API_URL` no painel da Vercel
3. Cada push para `main` dispara um novo deploy automaticamente

```bash
# Build de produção local (verificação)
npm run build
npm run start
```

---

## 🔗 Repositório do Backend

Este frontend consome a API REST do **EduSaaS API**:

👉 [github.com/wallace-stack/edusaas-api](https://github.com/wallace-stack/edusaas-api)

---

## 🗺️ Roadmap

### ✅ Implementado

- [x] Autenticação JWT com refresh via cookie
- [x] Cadastro de instituição com validação CNPJ
- [x] Recuperação e redefinição de senha
- [x] Dashboard completo para os 4 perfis
- [x] Gestão de usuários (diretor)
- [x] Gestão de turmas com criação modal (diretor)
- [x] Painel financeiro — mensalidades e fluxo de caixa
- [x] Lançamento de notas por turma/disciplina/aluno
- [x] Registro de chamada com status presente/ausente/justificado
- [x] Consulta de notas e frequência (aluno)
- [x] Listagem de alunos e turmas (coordenador)
- [x] Deploy automatizado na Vercel

### 🔜 Próximas funcionalidades

- [ ] Módulo de notificações em tempo real
- [ ] Relatórios PDF exportáveis
- [ ] Boletim escolar do aluno
- [ ] Calendário acadêmico
- [ ] Chat interno entre perfis
- [ ] Modo escuro
- [ ] PWA (Progressive Web App)

---

## 👨‍💻 Autor

**Wallace Araujo**

[![GitHub](https://img.shields.io/badge/GitHub-wallace--stack-181717?style=for-the-badge&logo=github)](https://github.com/wallace-stack)

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  Feito com ❤️ para modernizar a gestão educacional
</div>
