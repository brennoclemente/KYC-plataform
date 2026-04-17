# Documento de Requisitos

## Introdução

Esta especificação descreve uma plataforma completa de Onboarding para processos de KYC (Know Your Customer) e KYB (Know Your Business). A plataforma permite que empresas e seus sócios/representantes realizem o processo de cadastro e validação de identidade de forma guiada, com extração automática de dados via OCR, painel administrativo para gestão e aprovação, e suporte a personalização visual via sistema White-Label.

A solução é construída com Next.js (App Router) + TypeScript, Tailwind CSS, PostgreSQL via Prisma ORM, AWS S3 para armazenamento de documentos e AWS Textract para OCR, com infraestrutura Docker.

---

## Glossário

- **Platform**: A aplicação web completa de onboarding KYC/KYB.
- **User**: Pessoa que se cadastra na plataforma para iniciar um processo de onboarding.
- **Admin**: Usuário com privilégios administrativos que gerencia o processo de onboarding.
- **InviteCode**: Código alfanumérico único, gerado pelo Admin, que autoriza o primeiro acesso de um novo usuário à plataforma.
- **KYB_Module**: Módulo de cadastro e validação de dados empresariais (Know Your Business).
- **KYC_Module**: Módulo de cadastro e validação de dados pessoais de sócios e representantes (Know Your Customer).
- **OCR_Engine**: Componente responsável pela extração de texto e dados estruturados de documentos via AWS Textract.
- **Document**: Arquivo enviado pelo usuário (ex: Contrato Social, Cartão CNPJ, RG/CNH, Selfie, Comprovante de Residência) armazenado no AWS S3.
- **Company**: Entidade empresarial cadastrada no processo KYB, identificada por CNPJ.
- **Partner**: Sócio ou representante legal de uma Company, sujeito ao processo KYC.
- **Admin_Panel**: Interface administrativa para gerenciamento de usuários, documentos e fluxos de onboarding.
- **White_Label_Engine**: Sistema de configuração que permite personalização visual da plataforma (cores, logotipo) sem alteração de código.
- **Theme_Config**: Arquivo ou registro no banco de dados que armazena as configurações visuais do White_Label_Engine.
- **Onboarding_Status**: Estado do processo de onboarding de um usuário ou empresa (Pendente, Aprovado, Reprovado).
- **Storage_Service**: Componente de integração com AWS S3 para upload e recuperação de documentos.
- **CNPJ**: Cadastro Nacional da Pessoa Jurídica — identificador único de empresa no Brasil.
- **CPF**: Cadastro de Pessoa Física — identificador único de pessoa física no Brasil.

---

## Requisitos

### Requisito 1: Controle de Acesso por Código de Convite

**User Story:** Como Administrador, quero gerar Invite Codes únicos para que apenas usuários autorizados possam iniciar o processo de cadastro na plataforma.

#### Critérios de Aceite

1. THE Admin_Panel SHALL permitir que o Admin gere um InviteCode alfanumérico único associado a um endereço de e-mail ou a uma utilização genérica.
2. WHEN um novo usuário tenta se cadastrar, THE Platform SHALL exigir a inserção de um InviteCode válido antes de liberar o formulário de cadastro.
3. WHEN um InviteCode é submetido, THE Platform SHALL validar o código no banco de dados verificando existência, status ativo e não utilização prévia.
4. IF o InviteCode submetido não existir no banco de dados, THEN THE Platform SHALL retornar uma mensagem de erro informando que o código é inválido.
5. IF o InviteCode submetido já tiver sido utilizado, THEN THE Platform SHALL retornar uma mensagem de erro informando que o código já foi usado.
6. WHEN um InviteCode é validado com sucesso e o cadastro é concluído, THE Platform SHALL marcar o InviteCode como utilizado no banco de dados.
7. THE Admin_Panel SHALL exibir a listagem de todos os InviteCodes gerados, incluindo status (ativo, utilizado) e data de criação.

---

### Requisito 2: Módulo KYB — Cadastro de Dados Empresariais

**User Story:** Como usuário autorizado, quero cadastrar os dados da minha empresa para iniciar o processo de verificação empresarial (KYB).

#### Critérios de Aceite

1. WHEN o cadastro de usuário é concluído com InviteCode válido, THE KYB_Module SHALL apresentar ao usuário um formulário de cadastro empresarial.
2. THE KYB_Module SHALL coletar obrigatoriamente os seguintes campos: CNPJ, Razão Social, Nome Fantasia, Endereço completo (logradouro, número, complemento, bairro, cidade, estado, CEP) e faturamento mensal estimado.
3. WHEN o usuário submete o CNPJ, THE KYB_Module SHALL validar o formato do CNPJ conforme as regras de dígitos verificadores brasileiros.
4. IF o CNPJ submetido não passar na validação de formato, THEN THE KYB_Module SHALL exibir uma mensagem de erro descritiva ao usuário.
5. THE KYB_Module SHALL aceitar o upload do Contrato Social e do Cartão CNPJ no formato PDF ou imagem (JPEG, PNG).
6. WHEN um documento é enviado, THE Storage_Service SHALL armazenar o arquivo no AWS S3 e retornar a URL de armazenamento para persistência no banco de dados.
7. IF o upload de um documento falhar, THEN THE KYB_Module SHALL exibir uma mensagem de erro e permitir nova tentativa de envio sem perda dos dados já preenchidos.
8. WHEN todos os campos obrigatórios e documentos do KYB são submetidos com sucesso, THE Platform SHALL criar um registro de Company no banco de dados com Onboarding_Status igual a "Pendente".

---

### Requisito 3: Módulo KYC — Cadastro de Sócios e Representantes

**User Story:** Como usuário autorizado, quero cadastrar os dados dos sócios e representantes legais da empresa para completar o processo de verificação de identidade (KYC).

#### Critérios de Aceite

1. WHEN o cadastro KYB é concluído, THE KYC_Module SHALL apresentar ao usuário um formulário de cadastro para pelo menos um Partner da Company.
2. THE KYC_Module SHALL coletar obrigatoriamente os seguintes campos por Partner: nome completo, CPF, data de nascimento e cargo na empresa.
3. WHEN o usuário submete um CPF, THE KYC_Module SHALL validar o formato do CPF conforme as regras de dígitos verificadores brasileiros.
4. IF o CPF submetido não passar na validação de formato, THEN THE KYC_Module SHALL exibir uma mensagem de erro descritiva ao usuário.
5. THE KYC_Module SHALL aceitar o upload dos seguintes documentos por Partner: documento de identidade (RG ou CNH — frente e verso), selfie e comprovante de residência.
6. WHEN um documento de Partner é enviado, THE Storage_Service SHALL armazenar o arquivo no AWS S3 e retornar a URL para persistência no banco de dados vinculada ao Partner correspondente.
7. IF o upload de um documento de Partner falhar, THEN THE KYC_Module SHALL exibir uma mensagem de erro e permitir nova tentativa sem perda dos dados do formulário.
8. THE KYC_Module SHALL permitir o cadastro de múltiplos Partners por Company.
9. WHEN todos os Partners obrigatórios são cadastrados e os documentos enviados, THE Platform SHALL atualizar o Onboarding_Status da Company para "Pendente de Revisão".

---

### Requisito 4: Motor de OCR — Extração de Dados de Documentos

**User Story:** Como Administrador, quero que os dados dos documentos enviados sejam extraídos automaticamente via OCR para facilitar a conferência e reduzir trabalho manual.

#### Critérios de Aceite

1. WHEN um documento é armazenado com sucesso no AWS S3, THE OCR_Engine SHALL iniciar automaticamente o processo de extração de texto via AWS Textract.
2. THE OCR_Engine SHALL processar os seguintes tipos de documento: Contrato Social, Cartão CNPJ, RG (frente e verso), CNH (frente e verso) e Comprovante de Residência.
3. WHEN o AWS Textract conclui a análise de um documento, THE OCR_Engine SHALL persistir o texto extraído e os campos estruturados identificados no banco de dados, vinculados ao registro do Document correspondente.
4. IF o AWS Textract retornar um erro durante o processamento, THEN THE OCR_Engine SHALL registrar o erro no banco de dados com o status de processamento "Falha" e notificar o Admin_Panel.
5. IF a confiança da extração de um campo retornada pelo AWS Textract for inferior a 80%, THEN THE OCR_Engine SHALL marcar o campo extraído como "Baixa Confiança" para revisão manual no Admin_Panel.
6. THE Admin_Panel SHALL exibir os dados extraídos pelo OCR_Engine lado a lado com a imagem do documento para facilitar a conferência manual pelo Admin.

---

### Requisito 5: Painel Administrativo

**User Story:** Como Administrador, quero um painel centralizado para gerenciar todos os processos de onboarding, visualizar documentos e alterar status de aprovação.

#### Critérios de Aceite

1. THE Admin_Panel SHALL ser acessível exclusivamente por usuários com papel "Admin" autenticados na plataforma.
2. THE Admin_Panel SHALL exibir uma listagem de todas as Companies cadastradas com seus respectivos Onboarding_Status (Pendente, Aprovado, Reprovado).
3. THE Admin_Panel SHALL permitir que o Admin filtre a listagem de Companies por Onboarding_Status.
4. WHEN o Admin seleciona uma Company na listagem, THE Admin_Panel SHALL exibir a ficha completa com dados KYB, lista de Partners, documentos enviados e dados extraídos pelo OCR_Engine.
5. THE Admin_Panel SHALL permitir que o Admin altere o Onboarding_Status de uma Company para "Aprovado" ou "Reprovado".
6. WHEN o Admin altera o Onboarding_Status de uma Company, THE Platform SHALL registrar o Admin responsável pela decisão, a data e hora da alteração no banco de dados.
7. THE Admin_Panel SHALL permitir que o Admin gere novos InviteCodes com um único clique, exibindo o código gerado para cópia imediata.
8. THE Admin_Panel SHALL exibir a imagem original do Document e o texto extraído pelo OCR_Engine no mesmo painel de visualização.

---

### Requisito 6: Motor White-Label

**User Story:** Como operador da plataforma, quero personalizar as cores e o logotipo da aplicação para diferentes clientes sem modificar o código-fonte.

#### Critérios de Aceite

1. THE White_Label_Engine SHALL carregar as configurações visuais a partir de um Theme_Config que pode ser definido via arquivo de configuração ou via registro no banco de dados.
2. THE White_Label_Engine SHALL suportar a configuração das seguintes propriedades visuais: cor primária, cor secundária, cor de fundo, cor de texto, URL do logotipo e nome da aplicação.
3. WHEN a aplicação é carregada, THE White_Label_Engine SHALL aplicar as variáveis CSS do Theme_Config ao documento HTML raiz, propagando os valores para todos os componentes Tailwind CSS.
4. WHERE um Theme_Config não estiver definido, THE Platform SHALL aplicar os valores padrão da marca base sem erro ou comportamento inesperado.
5. WHEN o Theme_Config é atualizado no banco de dados pelo Admin, THE White_Label_Engine SHALL refletir as novas configurações na próxima carga da aplicação sem necessidade de redeploy.
6. THE White_Label_Engine SHALL expor as variáveis de tema como variáveis CSS nativas (ex: `--color-primary`, `--color-secondary`) consumíveis pelo Tailwind CSS via `theme.extend`.

---

### Requisito 7: Armazenamento e Segurança de Documentos

**User Story:** Como operador da plataforma, quero garantir que todos os documentos sensíveis sejam armazenados e acessados de forma segura.

#### Critérios de Aceite

1. THE Storage_Service SHALL armazenar todos os documentos no AWS S3 em buckets com acesso público desabilitado.
2. THE Storage_Service SHALL gerar URLs pré-assinadas (presigned URLs) com validade máxima de 60 minutos para acesso temporário a documentos pelo Admin_Panel.
3. IF uma URL pré-assinada expirar, THEN THE Storage_Service SHALL gerar uma nova URL pré-assinada sob demanda quando o Admin solicitar acesso ao documento.
4. THE Platform SHALL armazenar no banco de dados apenas a referência (chave S3) do documento, nunca a URL pré-assinada persistida.
5. THE Platform SHALL transmitir todos os documentos via HTTPS durante o processo de upload e recuperação.

---

### Requisito 8: Schema de Banco de Dados e Infraestrutura

**User Story:** Como desenvolvedor, quero um schema de banco de dados bem definido e infraestrutura containerizada para facilitar o desenvolvimento e o deploy.

#### Critérios de Aceite

1. THE Platform SHALL implementar o schema Prisma com as seguintes tabelas: `Users`, `Companies`, `Partners`, `Documents` e `InviteCodes`, com os relacionamentos corretos entre elas.
2. THE Platform SHALL disponibilizar um `Dockerfile` que construa a aplicação Next.js para produção.
3. THE Platform SHALL disponibilizar um `docker-compose.yml` que orquestre os serviços da aplicação Next.js e o banco de dados PostgreSQL para ambiente de desenvolvimento.
4. THE Platform SHALL seguir a estrutura de pastas da Clean Architecture, separando claramente as camadas de domínio, aplicação, infraestrutura e apresentação.
5. THE Platform SHALL utilizar variáveis de ambiente para todas as configurações sensíveis (credenciais AWS, string de conexão do banco de dados, secrets de autenticação), sem hardcode no código-fonte.
