# Plataforma de Onboarding KYC/KYB

Plataforma web completa para processos de **Know Your Customer (KYC)** e **Know Your Business (KYB)**. Permite que empresas e seus sócios realizem o cadastro e validação de identidade de forma guiada, com extração automática de dados via OCR, painel administrativo e personalização visual White-Label.

## Stack

| Tecnologia | Função |
|---|---|
| Next.js 16 (App Router) + TypeScript | Framework web |
| PostgreSQL + Prisma ORM | Banco de dados |
| AWS S3 | Armazenamento seguro de documentos |
| AWS Textract | OCR assíncrono de documentos |
| NextAuth.js | Autenticação com JWT |
| Tailwind CSS | Design system com suporte a White-Label |
| Nginx + Let's Encrypt | Reverse proxy com HTTPS automático |
| Docker + Docker Compose | Infraestrutura containerizada |

---

## Índice

1. [Variáveis de ambiente](#1-variáveis-de-ambiente)
2. [Desenvolvimento local](#2-desenvolvimento-local)
3. [Deploy automatizado na AWS](#3-deploy-automatizado-na-aws-recomendado)
4. [Deploy manual em qualquer servidor](#4-deploy-manual-em-qualquer-servidor)
5. [Primeiro acesso — criando o Admin](#5-primeiro-acesso--criando-o-admin)
6. [Como usar a plataforma](#6-como-usar-a-plataforma)
7. [Personalização visual White-Label](#7-personalização-visual-white-label)
8. [Configuração AWS](#8-configuração-aws)
9. [Testes](#9-testes)
10. [Estrutura do projeto](#10-estrutura-do-projeto)
11. [Referência de variáveis de ambiente](#11-referência-de-variáveis-de-ambiente)

---

## 1. Variáveis de ambiente

O projeto usa dois arquivos:

| Arquivo | Finalidade |
|---|---|
| `.env.example` | Template **commitado no git** — exemplos e comentários, nunca valores reais |
| `.env` | Arquivo local com os **valores reais** — nunca commitado (está no `.gitignore`) |

Crie o `.env` a partir do template:

```bash
cp .env.example .env
```

> Gere o `NEXTAUTH_SECRET` com: `openssl rand -base64 32`

---

## 2. Desenvolvimento local

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Bucket S3 criado na AWS com credenciais IAM

### Passo a passo

**1. Clone e instale as dependências**

```bash
git clone <url-do-repositorio>
cd kyc-kyb-onboarding-platform
npm install
```

**2. Configure o `.env`**

```bash
cp .env.example .env
```

Edite o `.env`. Para desenvolvimento local, o host do banco deve ser `localhost`:

```env
DATABASE_URL="postgresql://kyc_user:sua_senha@localhost:5432/kyc_kyb_db"
POSTGRES_USER="kyc_user"
POSTGRES_PASSWORD="sua_senha"
POSTGRES_DB="kyc_kyb_db"

AWS_ACCESS_KEY_ID="sua-chave"
AWS_SECRET_ACCESS_KEY="sua-chave-secreta"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="nome-do-seu-bucket"

NEXTAUTH_SECRET="gere-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

> `DOMAIN` e `CERTBOT_EMAIL` não são necessários em desenvolvimento local.

**3. Suba o banco de dados**

```bash
docker compose up db -d
```

**4. Execute as migrations**

Cria todas as tabelas no banco. Obrigatório na primeira vez:

```bash
npx prisma migrate dev
```

**5. Inicie o servidor**

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Na primeira vez você será redirecionado para `/setup`.

---

## 3. Deploy automatizado na AWS (recomendado)

Um único script provisiona toda a infraestrutura e sobe a aplicação.

### O que é provisionado

| Recurso | Configuração |
|---|---|
| EC2 (Amazon Linux 2023) | Docker instalado, app rodando via Docker Compose |
| S3 Bucket | Privado, versionamento e criptografia AES-256 |
| IAM Role | Permissões mínimas: S3 + Textract — sem chaves no servidor |
| Security Group | Portas 22, 80 e 443 |
| Nginx + Certbot | HTTPS automático via Let's Encrypt |

### Pré-requisitos

- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) instalado e configurado com `aws configure`
- Um **EC2 Key Pair** criado na sua conta: Console AWS → EC2 → Key Pairs → Create key pair
- Código em um repositório Git acessível via HTTPS (GitHub, GitLab, etc.)
- Um domínio cujo registro A você possa editar

### Executar

> Execute os comandos abaixo de dentro da pasta `kyc-kyb-onboarding-platform`:

```bash
chmod +x infra/deploy.sh
./infra/deploy.sh
```

O script pergunta interativamente:

```
? Stack name (e.g. kyc-kyb-prod):        kyc-kyb-prod
? AWS Region (e.g. us-east-1):           us-east-1
? Public domain (e.g. app.empresa.com):  app.suaempresa.com
? E-mail for Let's Encrypt:              admin@suaempresa.com
? Git repository URL:                    https://github.com/seu-usuario/repo.git
? Branch (default: main):                main
? EC2 Key Pair name:                     meu-keypair
? EC2 instance type (default: t3.small): t3.small
```

Senhas e secrets são **gerados automaticamente** e salvos em `infra/deploy-output-<stack>.txt`.

### Após o deploy

**1. Aponte o DNS antes de qualquer coisa**

O Certbot só consegue emitir o certificado se o domínio já estiver apontando para o servidor. Faça isso imediatamente após o script terminar:

```
app.suaempresa.com  →  <IP exibido pelo script>  (registro A)
```

**2. Acompanhe o bootstrap via SSH**

O EC2 leva ~10 minutos para instalar Docker, clonar o repositório e buildar a aplicação:

```bash
ssh -i meu-keypair.pem ec2-user@<IP>
sudo tail -f /var/log/kyc-kyb-bootstrap.log
```

Quando aparecer `Bootstrap complete`, a aplicação está rodando.

**3. Aguarde o certificado SSL**

O Certbot tenta emitir o certificado automaticamente. Se o DNS ainda não propagou quando o bootstrap terminar, o Certbot tentará novamente a cada 12 horas. Você pode forçar uma nova tentativa com:

```bash
docker compose restart certbot
```

**4. Acesse a plataforma**

Abra `https://app.suaempresa.com` — você será redirecionado para `/setup`.

### Guardar as credenciais

O arquivo `infra/deploy-output-<stack>.txt` contém a senha do banco e o secret JWT. **Guarde em local seguro** — sem ele você perde acesso ao banco.

### Destruir tudo

```bash
chmod +x infra/destroy.sh
./infra/destroy.sh
```

> O S3 bucket é preservado por segurança. Para deletá-lo, esvazie-o no Console AWS e delete manualmente.

---

## 4. Deploy manual em qualquer servidor

Use este caminho se você já tem um servidor Linux com IP público.

### Pré-requisitos

- Servidor Linux com Docker e Docker Compose instalados
- IP público com portas 80 e 443 abertas no firewall
- **DNS já apontando para o servidor** antes de subir os containers (obrigatório para o Certbot)
- Credenciais AWS (ou IAM Role se for EC2)

### Passo a passo

**1. Clone o repositório no servidor**

```bash
git clone <url-do-repositorio>
cd kyc-kyb-onboarding-platform
```

**2. Configure o `.env`**

```bash
cp .env.example .env
nano .env
```

Preencha todas as variáveis. Para produção, o host do banco é `db` (nome do serviço Docker):

```env
DOMAIN=app.suaempresa.com
CERTBOT_EMAIL=admin@suaempresa.com

POSTGRES_USER=kyc_user
POSTGRES_PASSWORD=senha-forte-aqui
POSTGRES_DB=kyc_kyb_db
DATABASE_URL=postgresql://kyc_user:senha-forte-aqui@db:5432/kyc_kyb_db

AWS_ACCESS_KEY_ID=sua-chave
AWS_SECRET_ACCESS_KEY=sua-chave-secreta
AWS_REGION=us-east-1
S3_BUCKET_NAME=nome-do-bucket

NEXTAUTH_SECRET=gere-com-openssl-rand-base64-32
NEXTAUTH_URL=https://app.suaempresa.com
```

> **Atenção:** `DATABASE_URL` usa `@db:` (nome do container), não `@localhost:`.

**3. Confirme que o DNS já está apontando para este servidor**

```bash
# Deve retornar o IP deste servidor
dig +short app.suaempresa.com
```

Se o DNS ainda não propagou, **não suba os containers ainda** — o Certbot vai falhar. Aguarde a propagação (pode levar até 24h, mas geralmente é minutos).

**4. Suba todos os serviços**

```bash
docker compose up --build -d
```

O que acontece automaticamente:
1. PostgreSQL sobe e fica saudável
2. Next.js builda, roda as migrations e sobe na porta interna 3000
3. Nginx sobe nas portas 80 e 443 com config HTTP-only
4. Certbot emite o certificado SSL
5. Nginx recarrega com HTTPS ativo (em até 6 horas)

**5. Acompanhe os logs**

```bash
docker compose logs -f certbot   # emissão do certificado
docker compose logs -f app       # migrations e startup da aplicação
docker compose logs -f nginx     # status do proxy
```

**6. Acesse a plataforma**

Abra `https://app.suaempresa.com` — você será redirecionado para `/setup`.

---

## 5. Primeiro acesso — criando o Admin

Na primeira vez que a aplicação é acessada sem usuários cadastrados, ela redireciona automaticamente para `/setup`.

1. Acesse a URL da aplicação
2. Preencha o e-mail e a senha do administrador
3. Clique em **Criar administrador**
4. Faça login com as credenciais criadas

> A rota `/setup` é bloqueada automaticamente após o primeiro usuário ser criado.

---

## 6. Como usar a plataforma

### Como Administrador

| Ação | Onde |
|---|---|
| Ver todas as empresas em onboarding | `/admin` |
| Gerar Invite Code para um novo cliente | `/admin/invite-codes` |
| Revisar dados, documentos e OCR de uma empresa | `/admin/companies/[id]` |
| Aprovar ou reprovar uma empresa | `/admin/companies/[id]` |
| Personalizar a aparência da plataforma | `/admin/settings` |

### Como Usuário (empresa)

1. Receba o **Invite Code** do administrador
2. Acesse `/register`, insira o código e crie sua conta
3. Preencha os dados da empresa em `/onboarding/kyb` e envie os documentos
4. Cadastre os sócios em `/onboarding/kyc` com seus documentos
5. Aguarde a análise e aprovação pelo administrador

---

## 7. Personalização visual White-Label

Toda a personalização é feita em **`/admin/settings`**, sem editar código:

| Campo | Descrição |
|---|---|
| Nome da plataforma | Exibido no header e na aba do navegador |
| Logotipo | URL de imagem PNG/SVG — preview ao vivo |
| Favicon | URL do ícone da aba — preview ao vivo |
| Cor primária | Botões, links e destaques |
| Cor secundária | Textos auxiliares e ícones |
| Cor de fundo | Fundo geral das páginas |
| Cor do texto | Texto principal |
| Título da página inicial | Headline do hero |
| Subtítulo da página inicial | Descrição abaixo do título |
| Texto do botão de ação | CTA do hero |

---

## 8. Configuração AWS

### S3 (deploy manual)

Se não usar o deploy automatizado, crie o bucket manualmente:

1. Crie um bucket S3 com **acesso público bloqueado**
2. Crie uma IAM policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject"],
         "Resource": "arn:aws:s3:::nome-do-bucket/*"
       },
       {
         "Effect": "Allow",
         "Action": ["textract:StartDocumentAnalysis", "textract:GetDocumentAnalysis"],
         "Resource": "*"
       }
     ]
   }
   ```
3. Crie um IAM user, associe a policy e gere as credenciais para o `.env`

### Textract e OCR

O OCR é iniciado automaticamente após o upload de cada documento. Em produção, configure o Textract para enviar notificações SNS para `POST /api/ocr/webhook` da sua aplicação.

---

## 9. Testes

```bash
npm test
```

---

## 10. Estrutura do projeto

```
kyc-kyb-onboarding-platform/
├── infra/
│   ├── cloudformation.yml   # Template AWS CloudFormation
│   ├── deploy.sh            # Script de deploy automatizado
│   └── destroy.sh           # Script de teardown
├── nginx/
│   ├── nginx.conf           # Config HTTP-only (ativa no startup)
│   ├── nginx-ssl.conf       # Config HTTPS (ativada após emissão do cert)
│   └── init-certbot.sh      # Emissão do certificado Let's Encrypt
├── prisma/
│   ├── schema.prisma        # Schema do banco de dados
│   └── migrations/          # Migrations SQL versionadas
├── src/
│   ├── domain/              # Entidades e interfaces
│   ├── application/         # Casos de uso e DTOs
│   ├── infrastructure/      # Prisma, S3, Textract, NextAuth
│   └── app/                 # Next.js App Router
│       ├── (auth)/          # Login e registro
│       ├── onboarding/      # Fluxo KYB e KYC
│       ├── admin/           # Painel administrativo
│       ├── setup/           # Configuração inicial do admin
│       └── api/             # API routes
├── docker-compose.yml
├── Dockerfile
├── docker-entrypoint.sh     # Roda migrations antes de iniciar o app
└── .env.example             # Template de variáveis de ambiente
```

---

## 11. Referência de variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DOMAIN` | ✅ produção | Domínio público (ex: `app.empresa.com`) |
| `CERTBOT_EMAIL` | ✅ produção | E-mail para notificações do Let's Encrypt |
| `POSTGRES_USER` | ✅ | Usuário do banco |
| `POSTGRES_PASSWORD` | ✅ | Senha do banco — use uma senha forte |
| `POSTGRES_DB` | ✅ | Nome do banco de dados |
| `DATABASE_URL` | ✅ | Connection string do Prisma. Host = `db` em Docker, `localhost` em dev local |
| `AWS_ACCESS_KEY_ID` | ✅ dev/manual | Chave AWS. Deixe vazio no deploy automatizado (usa IAM Role) |
| `AWS_SECRET_ACCESS_KEY` | ✅ dev/manual | Chave secreta AWS. Deixe vazio no deploy automatizado |
| `AWS_REGION` | ✅ | Região AWS (ex: `us-east-1`) |
| `S3_BUCKET_NAME` | ✅ | Nome do bucket S3 |
| `NEXTAUTH_SECRET` | ✅ | Secret JWT. Gere com: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | URL base. `http://localhost:3000` em dev, `https://dominio` em produção |
| `OCR_WEBHOOK_SECRET` | ❌ | Se preenchido, o webhook de OCR exige este valor no header `x-webhook-secret` |
