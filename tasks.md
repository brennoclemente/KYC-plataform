# Plano de Implementação: Plataforma de Onboarding KYC/KYB

## Visão Geral

Implementação incremental da plataforma seguindo a Clean Architecture (Domain → Application → Infrastructure → Presentation). Cada tarefa constrói sobre a anterior, garantindo que nenhum código fique órfão ou desconectado.

## Tarefas

- [x] 1. Configurar estrutura do projeto e infraestrutura base
  - Inicializar projeto Next.js com App Router e TypeScript
  - Configurar Tailwind CSS com suporte a variáveis CSS customizadas em `tailwind.config.ts`
  - Criar estrutura de pastas da Clean Architecture: `src/domain`, `src/application`, `src/infrastructure`, `src/presentation`
  - Configurar Prisma ORM com conexão PostgreSQL via variável de ambiente `DATABASE_URL`
  - Criar arquivo `.env.example` com todas as variáveis necessárias (DATABASE_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME, NEXTAUTH_SECRET, NEXTAUTH_URL)
  - Criar `Dockerfile` para build de produção da aplicação Next.js
  - Criar `docker-compose.yml` orquestrando os serviços `app` (Next.js) e `db` (PostgreSQL)
  - _Requisitos: 8.2, 8.3, 8.4, 8.5_

- [x] 2. Implementar schema do banco de dados e entidades de domínio
  - [x] 2.1 Criar schema Prisma com todas as tabelas e relacionamentos
    - Definir models: `User`, `Company`, `Partner`, `Document`, `InviteCode`, `ThemeConfig`
    - Configurar enums: `Role` (USER, ADMIN), `OnboardingStatus` (PENDING, PENDING_REVIEW, APPROVED, REJECTED), `DocumentType`, `OcrStatus`
    - Definir relacionamentos: User→InviteCode, User→Company, Company→Partner, Company→Document, Partner→Document
    - Executar `prisma migrate dev` para criar a migration inicial
    - _Requisitos: 8.1_

  - [x] 2.2 Criar interfaces de entidades de domínio em TypeScript
    - Criar `src/domain/entities/User.ts`, `Company.ts`, `Partner.ts`, `Document.ts`, `InviteCode.ts`, `ThemeConfig.ts`
    - Definir tipos auxiliares: `OnboardingStatus`, `DocumentType`, `OcrStatus`, `OcrField`
    - _Requisitos: 8.1, 8.4_

  - [x] 2.3 Criar interfaces de repositório de domínio
    - Criar `IUserRepository`, `ICompanyRepository`, `IPartnerRepository`, `IDocumentRepository`, `IInviteCodeRepository`, `IThemeConfigRepository` em `src/domain/repositories/`
    - Criar interfaces de serviço de domínio: `IStorageService`, `ICNPJValidator`, `ICPFValidator` em `src/domain/services/`
    - _Requisitos: 8.4_

  - [x] 2.4 Escrever testes unitários para as entidades de domínio
    - Testar tipos e estruturas das entidades
    - Verificar que os tipos `OcrField.lowConfidence` é `true` quando `confidence < 0.80`
    - _Requisitos: 4.5_

- [x] 3. Implementar serviços de validação e infraestrutura de repositórios
  - [x] 3.1 Implementar validadores de CNPJ e CPF
    - Criar `src/infrastructure/validators/CNPJValidator.ts` implementando `ICNPJValidator` com algoritmo de dígitos verificadores brasileiros
    - Criar `src/infrastructure/validators/CPFValidator.ts` implementando `ICPFValidator` com algoritmo de dígitos verificadores brasileiros
    - _Requisitos: 2.3, 2.4, 3.3, 3.4_

  - [x] 3.2 Escrever testes unitários para os validadores de CNPJ e CPF
    - Testar CNPJs válidos, inválidos, com formatação e sem formatação
    - Testar CPFs válidos, inválidos, com formatação e sem formatação
    - Testar casos extremos: sequências repetidas (ex: 111.111.111-11), strings vazias
    - _Requisitos: 2.3, 3.3_

  - [x] 3.3 Implementar repositórios Prisma
    - Criar `PrismaUserRepository`, `PrismaCompanyRepository`, `PrismaPartnerRepository`, `PrismaDocumentRepository`, `PrismaInviteCodeRepository`, `PrismaThemeConfigRepository` em `src/infrastructure/database/repositories/`
    - Cada repositório deve implementar a interface de domínio correspondente
    - _Requisitos: 8.1, 8.4_

  - [x] 3.4 Escrever testes de integração para os repositórios Prisma
    - Testar operações CRUD básicas de cada repositório contra banco de dados de teste
    - _Requisitos: 8.1_

- [x] 4. Checkpoint — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 5. Implementar serviço de armazenamento S3
  - [x] 5.1 Criar `S3StorageService` implementando `IStorageService`
    - Criar `src/infrastructure/storage/S3StorageService.ts`
    - Implementar método `upload(file, key, mimeType)` que envia arquivo ao S3 e retorna a `s3Key`
    - Implementar método `generatePresignedUrl(s3Key, expiresInSeconds)` com validade máxima de 3600 segundos (60 min)
    - Garantir que o bucket S3 seja configurado com acesso público desabilitado
    - Garantir que apenas a `s3Key` seja persistida no banco, nunca a URL pré-assinada
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 5.2 Escrever testes unitários para `S3StorageService`
    - Mockar o cliente AWS S3 e testar upload e geração de presigned URL
    - Testar que a URL gerada expira em no máximo 3600 segundos
    - _Requisitos: 7.2, 7.3_

- [x] 6. Implementar autenticação com NextAuth.js
  - Criar `src/infrastructure/auth/nextauth.config.ts` com provider de credenciais (email/senha)
  - Configurar sessão JWT com campo `role` (USER | ADMIN)
  - Criar API route `src/presentation/app/api/auth/[...nextauth]/route.ts`
  - Criar API route `POST /api/auth/register` que valida InviteCode antes de criar o usuário
  - Implementar middleware Next.js para proteger rotas `/admin/*` (somente ADMIN) e `/onboarding/*` (somente USER autenticado)
  - _Requisitos: 1.2, 5.1_

- [x] 7. Implementar casos de uso e API routes de Invite Code
  - [x] 7.1 Implementar `GenerateInviteCodeUseCase` e `ValidateInviteCodeUseCase`
    - Criar `src/application/use-cases/invite/GenerateInviteCodeUseCase.ts`: gera código alfanumérico único e persiste via `IInviteCodeRepository`
    - Criar `src/application/use-cases/invite/ValidateInviteCodeUseCase.ts`: verifica existência, status ativo e não utilização prévia; retorna erro descritivo para cada caso
    - _Requisitos: 1.1, 1.3, 1.4, 1.5_

  - [x] 7.2 Criar API routes de Invite Code
    - Criar `POST /api/invite/validate` (público): chama `ValidateInviteCodeUseCase`, retorna 200 ou erro descritivo
    - Criar `POST /api/invite/generate` (Admin): chama `GenerateInviteCodeUseCase`, retorna o código gerado
    - Criar `GET /api/invite/list` (Admin): lista todos InviteCodes com status e data de criação via `IInviteCodeRepository.listAll()`
    - _Requisitos: 1.1, 1.3, 1.4, 1.5, 1.7_

  - [x] 7.3 Escrever testes unitários para os casos de uso de Invite Code
    - Testar geração de código único
    - Testar validação: código inexistente, código já utilizado, código válido
    - _Requisitos: 1.3, 1.4, 1.5_

- [x] 8. Implementar casos de uso e API routes do módulo KYB
  - [x] 8.1 Criar DTOs e `SubmitKYBUseCase`
    - Criar `src/application/dtos/KYBSubmitDTO.ts` com todos os campos obrigatórios do formulário KYB
    - Criar `src/application/use-cases/kyb/SubmitKYBUseCase.ts`:
      - Validar CNPJ via `ICNPJValidator`
      - Fazer upload dos documentos (Contrato Social, Cartão CNPJ) via `IStorageService`
      - Criar registro `Company` com `onboardingStatus: PENDING` via `ICompanyRepository`
      - Criar registros `Document` com `s3Key` retornada pelo upload via `IDocumentRepository`
    - _Requisitos: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8_

  - [x] 8.2 Criar API route `POST /api/kyb/submit`
    - Receber `multipart/form-data` com campos do formulário e arquivos de documento
    - Chamar `SubmitKYBUseCase` e retornar 201 com ID da Company criada
    - Retornar erro descritivo em caso de CNPJ inválido ou falha de upload
    - _Requisitos: 2.3, 2.4, 2.6, 2.7, 2.8_

  - [x] 8.3 Escrever testes unitários para `SubmitKYBUseCase`
    - Testar fluxo feliz: Company criada com status PENDING
    - Testar erro de CNPJ inválido
    - Testar falha de upload: dados do formulário preservados, erro retornado
    - _Requisitos: 2.3, 2.7, 2.8_

- [x] 9. Implementar casos de uso e API routes do módulo KYC
  - [x] 9.1 Criar DTOs e `SubmitKYCPartnerUseCase`
    - Criar `src/application/dtos/KYCPartnerDTO.ts` com campos obrigatórios por Partner
    - Criar `src/application/use-cases/kyc/SubmitKYCPartnerUseCase.ts`:
      - Validar CPF via `ICPFValidator`
      - Fazer upload dos documentos do Partner (RG/CNH frente e verso, selfie, comprovante de residência) via `IStorageService`
      - Criar registro `Partner` vinculado à `Company` via `IPartnerRepository`
      - Criar registros `Document` vinculados ao `Partner` via `IDocumentRepository`
      - Quando todos os Partners obrigatórios forem cadastrados, atualizar `onboardingStatus` da Company para `PENDING_REVIEW`
    - _Requisitos: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 9.2 Criar API route `POST /api/kyc/partner`
    - Receber `multipart/form-data` com dados do Partner e documentos
    - Chamar `SubmitKYCPartnerUseCase` e retornar 201 com ID do Partner criado
    - Retornar erro descritivo em caso de CPF inválido ou falha de upload
    - _Requisitos: 3.3, 3.4, 3.6, 3.7_

  - [x] 9.3 Escrever testes unitários para `SubmitKYCPartnerUseCase`
    - Testar fluxo feliz: Partner criado, documentos salvos
    - Testar erro de CPF inválido
    - Testar atualização de status da Company para PENDING_REVIEW após cadastro de Partners
    - _Requisitos: 3.3, 3.7, 3.9_

- [x] 10. Checkpoint — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 11. Implementar motor de OCR com AWS Textract
  - [x] 11.1 Criar `TextractOCRService` e `ProcessOCRResultUseCase`
    - Criar `src/infrastructure/ocr/TextractOCRService.ts`:
      - Implementar método `startDocumentAnalysis(s3Key)` que inicia job assíncrono no Textract e retorna `jobId`
      - Implementar método `getJobResult(jobId)` que recupera resultado do job
    - Criar `src/application/use-cases/ocr/ProcessOCRResultUseCase.ts`:
      - Processar resultado do Textract: extrair texto bruto e campos estruturados
      - Marcar campos com `confidence < 0.80` como `lowConfidence: true`
      - Persistir `ocrRawText` e `ocrStructuredData` no registro `Document` via `IDocumentRepository.updateOcrResult()`
      - Em caso de erro do Textract, atualizar `ocrStatus` para `FAILED` no banco de dados
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 11.2 Integrar OCR ao fluxo de upload de documentos
    - Após salvar o `Document` no banco (em `SubmitKYBUseCase` e `SubmitKYCPartnerUseCase`), chamar `TextractOCRService.startDocumentAnalysis()` de forma assíncrona
    - Atualizar `ocrStatus` do `Document` para `PROCESSING` ao iniciar o job
    - _Requisitos: 4.1_

  - [x] 11.3 Criar API route `POST /api/ocr/webhook`
    - Receber notificação de conclusão do Textract (webhook ou resultado de polling)
    - Chamar `ProcessOCRResultUseCase` com o resultado recebido
    - _Requisitos: 4.3, 4.4_

  - [x] 11.4 Escrever testes unitários para `ProcessOCRResultUseCase`
    - Testar marcação de campos com baixa confiança (< 80%)
    - Testar persistência de status FAILED em caso de erro do Textract
    - _Requisitos: 4.4, 4.5_

- [x] 12. Implementar Painel Administrativo — casos de uso e API routes
  - [x] 12.1 Implementar `ListCompaniesUseCase` e `UpdateOnboardingStatusUseCase`
    - Criar `src/application/use-cases/admin/ListCompaniesUseCase.ts`: lista Companies com filtro opcional por `OnboardingStatus`
    - Criar `src/application/use-cases/admin/UpdateOnboardingStatusUseCase.ts`:
      - Atualiza `onboardingStatus` da Company para APPROVED ou REJECTED
      - Registra `reviewedByAdminId` e `reviewedAt` no banco de dados
    - _Requisitos: 5.2, 5.3, 5.5, 5.6_

  - [x] 12.2 Criar API routes do painel administrativo
    - Criar `GET /api/admin/companies` (Admin): chama `ListCompaniesUseCase` com filtro de status opcional
    - Criar `GET /api/admin/companies/[id]` (Admin): retorna ficha completa da Company com Partners, Documents e dados OCR
    - Criar `PATCH /api/admin/companies/[id]/status` (Admin): chama `UpdateOnboardingStatusUseCase`
    - Para cada `Document` retornado, gerar presigned URL via `IStorageService.generatePresignedUrl()` (não persistir a URL)
    - _Requisitos: 5.2, 5.3, 5.4, 5.5, 5.6, 7.2, 7.3, 7.4_

  - [x] 12.3 Escrever testes unitários para os casos de uso administrativos
    - Testar filtro de listagem por status
    - Testar que `reviewedByAdminId` e `reviewedAt` são registrados na atualização de status
    - _Requisitos: 5.3, 5.6_

- [x] 13. Implementar motor White-Label
  - [x] 13.1 Criar `GetThemeConfigUseCase` e `PrismaThemeConfigRepository`
    - Criar `src/application/use-cases/theme/GetThemeConfigUseCase.ts`: busca ThemeConfig ativo; retorna valores padrão da marca base se nenhum estiver definido
    - Criar `src/application/dtos/ThemeConfigDTO.ts`
    - Implementar `PrismaThemeConfigRepository` em `src/infrastructure/database/repositories/`
    - _Requisitos: 6.1, 6.4_

  - [x] 13.2 Criar API route `GET /api/theme` e integrar ao layout raiz
    - Criar `GET /api/theme` (público): retorna ThemeConfig ativo via `GetThemeConfigUseCase`
    - Em `src/presentation/app/layout.tsx`, buscar ThemeConfig e injetar variáveis CSS nativas (`--color-primary`, `--color-secondary`, `--color-background`, `--color-text`) no elemento `<html>` via `style` prop
    - Configurar `tailwind.config.ts` para consumir as variáveis CSS via `theme.extend.colors`
    - _Requisitos: 6.2, 6.3, 6.5, 6.6_

  - [x] 13.3 Escrever testes unitários para `GetThemeConfigUseCase`
    - Testar retorno de valores padrão quando nenhum ThemeConfig estiver definido
    - Testar retorno do ThemeConfig ativo quando existir
    - _Requisitos: 6.4_

- [x] 14. Implementar interface de usuário — fluxo de Onboarding
  - [x] 14.1 Criar páginas de autenticação
    - Criar `src/presentation/app/(auth)/login/page.tsx` com formulário de login integrado ao NextAuth.js
    - Criar `src/presentation/app/(auth)/register/page.tsx` com formulário de cadastro que exige InviteCode válido antes de exibir os campos de senha
    - _Requisitos: 1.2_

  - [x] 14.2 Criar componente e página de validação de Invite Code
    - Criar `src/presentation/components/forms/InviteCodeForm.tsx`: campo de input + botão de validação, exibe mensagem de erro descritiva para código inválido ou já utilizado
    - Criar `src/presentation/app/onboarding/invite/page.tsx` usando o componente acima
    - _Requisitos: 1.2, 1.3, 1.4, 1.5_

  - [x] 14.3 Criar componente e página do formulário KYB
    - Criar `src/presentation/components/forms/KYBForm.tsx`:
      - Campos: CNPJ (com validação de formato em tempo real), Razão Social, Nome Fantasia, Endereço completo, Faturamento Mensal Estimado
      - Upload de Contrato Social e Cartão CNPJ (PDF, JPEG, PNG)
      - Exibir mensagem de erro sem perder dados preenchidos em caso de falha de upload
    - Criar `src/presentation/app/onboarding/kyb/page.tsx` usando o componente acima
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

  - [x] 14.4 Criar componente e página do formulário KYC
    - Criar `src/presentation/components/forms/KYCPartnerForm.tsx`:
      - Campos por Partner: Nome Completo, CPF (com validação em tempo real), Data de Nascimento, Cargo
      - Upload de RG/CNH (frente e verso), Selfie e Comprovante de Residência
      - Suporte a múltiplos Partners (adicionar/remover Partners dinamicamente)
      - Exibir mensagem de erro sem perder dados do formulário em caso de falha de upload
    - Criar `src/presentation/app/onboarding/kyc/page.tsx` usando o componente acima
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8_

- [x] 15. Implementar interface do Painel Administrativo
  - [x] 15.1 Criar layout e página principal do Admin
    - Criar `src/presentation/app/admin/layout.tsx` com verificação de role ADMIN (redirecionar se não autorizado)
    - Criar `src/presentation/app/admin/page.tsx` com listagem de Companies
    - Criar `src/presentation/components/admin/CompanyList.tsx`: tabela com Companies, Onboarding_Status e filtro por status
    - _Requisitos: 5.1, 5.2, 5.3_

  - [x] 15.2 Criar página de detalhe da Company e visualizador de documentos
    - Criar `src/presentation/app/admin/companies/[id]/page.tsx` com ficha completa: dados KYB, lista de Partners, documentos e dados OCR
    - Criar `src/presentation/components/admin/CompanyDetail.tsx`: exibe dados KYB e lista de Partners com seus documentos
    - Criar `src/presentation/components/admin/DocumentViewer.tsx`: exibe imagem do documento (via presigned URL) lado a lado com texto extraído pelo OCR, destacando campos com baixa confiança
    - Implementar botões "Aprovar" e "Reprovar" que chamam `PATCH /api/admin/companies/[id]/status`
    - _Requisitos: 4.6, 5.4, 5.5, 5.8_

  - [x] 15.3 Criar página de gerenciamento de Invite Codes no Admin
    - Criar `src/presentation/app/admin/invite-codes/page.tsx`
    - Exibir listagem de todos os InviteCodes com status (ativo/utilizado) e data de criação
    - Implementar botão "Gerar Novo Código" que chama `POST /api/invite/generate` e exibe o código gerado para cópia imediata
    - _Requisitos: 1.1, 1.7, 5.7_

- [x] 16. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia os requisitos específicos para rastreabilidade
- Os checkpoints garantem validação incremental a cada fase
- Nenhuma URL pré-assinada deve ser persistida no banco de dados — apenas a `s3Key`
- Todas as configurações sensíveis devem ser lidas de variáveis de ambiente, sem hardcode
