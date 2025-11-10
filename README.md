# Rental Service Microservice

Microserviço para gerenciamento completo do ciclo de vida de aluguel de veículos, incluindo criação, renovação, encerramento e devolução. Implementado seguindo princípios de Clean Architecture e padrões de produção.

# Feito Por

Daniel Ganz Musse, João Vitor de Souza Hernandes, Flavio Augusto da Cruz Melo, Matheus 
Lowen, Enrico Malho Bozza 

## 🎯 Funcionalidades

- **Gerenciamento de Aluguéis**: Criar, renovar, encerrar e registrar devolução de aluguéis
- **Consulta de Disponibilidade**: Verificar disponibilidade de veículos
- **Integração com Gateway de Pagamento**: Processamento de pagamentos para aluguéis
- **Publicação de Eventos**: NATS para comunicação assíncrona
- **Autorização**: OPA (Open Policy Agent) para controle de acesso
- **Autenticação**: JWT com suporte a JWKS
- **Métricas**: Prometheus para monitoramento
- **Logs Estruturados**: JSON com correlationId/traceId
- **Documentação API**: Swagger/OpenAPI
- **Imagem oficial no Docker Hub**: [https://hub.docker.com/r/iyonuttxd/rental-service](https://hub.docker.com/r/iyonuttxd/rental-service)

## 🏗️ Arquitetura

O projeto segue **Clean Architecture** com separação clara de responsabilidades:

```
src/
├── domain/           # Entidades e regras de negócio
│   ├── entities/     # Vehicle, Rental, Payment
│   ├── services/     # Serviços de domínio
│   └── ports/        # Interfaces (contratos)
├── features/         # Casos de uso e handlers HTTP
│   └── rentals/      
│       ├── use-cases/
│       ├── handlers/
│       └── validators/
├── infra/            # Implementações de infraestrutura
│   ├── adapters/     # MongoDB, NATS, Payment, OPA, JWT
│   ├── db/           # Conexão e índices
│   ├── middleware/   # Express middleware
│   ├── logger/       # Logger estruturado
│   └── metrics/      # Prometheus metrics
└── main/             # Composição e servidor
    ├── container.js  # Dependency Injection
    └── server.js     # Express setup
```

### Padrões Implementados

- **Vertical Slice**: Features organizadas por funcionalidade
- **Dependency Inversion**: Uso de portas/interfaces
- **Repository Pattern**: Abstração de persistência
- **Domain Services**: Lógica de negócio desacoplada

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- MongoDB
- NATS (opcional)
- OPA (opcional)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/iYoNuttxD/rental-service-microservice.git
cd rental-service-microservice

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# Inicie o serviço
npm start
```

### Desenvolvimento

```bash
# Modo watch (reinicia automaticamente)
npm run dev

# Executar testes
npm test

# Executar com coverage
npm run test:coverage

# Lint
npm run lint
```

## 📡 Endpoints da API

### Rentals

- `POST /api/v1/rentals` - Criar novo aluguel
- `POST /api/v1/rentals/:id/renew` - Renovar aluguel
- `POST /api/v1/rentals/:id/end` - Encerrar aluguel
- `POST /api/v1/rentals/:id/return` - Registrar devolução
- `GET /api/v1/rentals` - Listar aluguéis (com filtros)
- `GET /api/v1/rentals/:id` - Obter aluguel específico

### Vehicles

- `GET /api/v1/vehicles/availability` - Consultar disponibilidade

### Sistema

- `GET /api/v1/health` - Health check
- `GET /api/v1/metrics` - Métricas Prometheus
- `GET /api/v1/api-docs` - Documentação Swagger UI
- `GET /api/v1/api-docs/openapi.yaml` - Especificação OpenAPI

## 🔧 Configuração

### Variáveis de Ambiente

Veja `.env.example` para todas as variáveis disponíveis:

#### Servidor
- `PORT` - Porta do servidor (padrão: 3015)
- `NODE_ENV` - Ambiente (development/production)

#### MongoDB
- `RENTALS_MONGO_URI` - URI de conexão MongoDB
- `RENTALS_MONGO_DB_NAME` - Nome do banco (padrão: rentals_db)
- `RETENTION_DAYS` - TTL para aluguéis arquivados (padrão: 90)
- `EVENT_INBOX_TTL_DAYS` - TTL para eventos processados (padrão: 30)

#### NATS
- `NATS_URL` - URL do servidor NATS
- `NATS_QUEUE_GROUP` - Grupo de fila
- `NATS_JETSTREAM_ENABLED` - Habilitar JetStream
- `NATS_SUBJECTS` - Subjects publicados (separados por vírgula)

#### Payment Gateway
- `PAYMENT_GATEWAY_BASE_URL` - URL base do gateway
- `PAYMENT_GATEWAY_API_KEY` - Chave API
- `PAYMENT_TIMEOUT_MS` - Timeout de requisição (padrão: 5000)
- `PAYMENT_RETRY_ATTEMPTS` - Tentativas de retry (padrão: 2)

#### OPA (Open Policy Agent)
- `OPA_URL` - URL do servidor OPA
- `OPA_POLICY_PATH` - Caminho da policy
- `OPA_FAIL_OPEN` - Permitir em caso de falha (padrão: true)
- `OPA_TIMEOUT_MS` - Timeout (padrão: 3000)

#### JWT
- `AUTH_JWT_REQUIRED` - Exigir autenticação (padrão: false)
- `AUTH_JWT_ISSUER` - Issuer esperado
- `AUTH_JWT_AUDIENCE` - Audience esperado
- `AUTH_JWKS_URI` - URI do JWKS
- `AUTH_JWT_SECRET` - Secret para dev (fallback)

## 📊 Métricas

O serviço expõe métricas Prometheus em `/api/v1/metrics`:

- `rentals_started_total` - Total de aluguéis iniciados
- `rentals_renewed_total` - Total de renovações
- `rentals_ended_total` - Total de encerramentos
- `rentals_returned_total` - Total de devoluções
- `rental_operation_duration_ms` - Duração das operações
- `payment_attempts_total` - Tentativas de pagamento
- `events_published_total` - Eventos publicados
- `http_requests_total` - Requisições HTTP
- `http_request_duration_ms` - Duração das requisições

## 🎭 Eventos NATS

O serviço publica eventos para os seguintes subjects:

- `rental.started` - Quando um aluguel é iniciado
- `rental.renewed` - Quando um aluguel é renovado
- `rental.ended` - Quando um aluguel é encerrado
- `rental.returned` - Quando um aluguel é devolvido

Cada evento inclui:
```json
{
  "rentalId": "uuid",
  "vehicleId": "string",
  "userId": "string",
  "status": "string",
  "timestamp": "ISO8601"
}
```

## 🗄️ MongoDB

### Coleções

- `rentals` - Dados de aluguéis
- `vehicles` - Inventário de veículos
- `events_inbox` - Idempotência de eventos

### Índices

Índices são criados automaticamente na inicialização:

**Rentals:**
- `{ vehicleId: 1, status: 1 }`
- `{ startAt: 1, endAt: 1 }`
- `{ userId: 1 }`
- `{ status: 1, createdAt: -1 }`
- TTL opcional em `endAt` para aluguéis retornados

**Vehicles:**
- `{ status: 1 }`
- `{ plate: 1 }` (único)

**Events Inbox:**
- `{ eventId: 1 }` (único)
- TTL em `processedAt`

## 🐳 Docker

### Build

```bash
docker build -t rental-service .
```

### Run

```bash
docker run -p 3015:3015 \
  -e RENTALS_MONGO_URI=mongodb://mongo:27017 \
  -e NATS_URL=nats://nats:4222 \
  rental-service
```

### Docker Compose

```yaml
version: '3.8'
services:
  rental-service:
    build: .
    ports:
      - "3015:3015"
    environment:
      - RENTALS_MONGO_URI=mongodb://mongo:27017
      - NATS_URL=nats://nats:4222
    depends_on:
      - mongo
      - nats

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"

  nats:
    image: nats:latest
    ports:
      - "4222:4222"
```

## 🧪 Testes

```bash
# Todos os testes
npm test

# Com coverage
npm test -- --coverage

# Modo watch
npm run test:watch

# Específico
npm test -- VehicleInventoryService
```

### Estrutura de Testes

- `src/domain/**/*.test.js` - Testes de entidades e serviços
- `src/features/**/*.test.js` - Testes de casos de uso
- Mocks são usados para adapters externos

## 🔒 Segurança

- **Helmet**: Proteção de headers HTTP
- **CORS**: Configurado para permitir origens específicas
- **JWT**: Autenticação baseada em tokens
- **OPA**: Autorização baseada em políticas
- **Non-root User**: Container executa como usuário não-root
- **Input Validation**: express-validator em todas as rotas

## 📝 Logs

Logs estruturados em JSON com campos padrão:

```json
{
  "level": "info",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Request completed",
  "correlationId": "uuid",
  "traceId": "uuid",
  "method": "POST",
  "path": "/api/v1/rentals",
  "status": 201,
  "duration": 150
}
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **Equipe Rental Service** - [GitHub](https://github.com/iYoNuttxD)

## 🙏 Agradecimentos

- Comunidade Node.js
- Contribuidores do projeto
- Padrões de Clean Architecture

## 📞 Suporte

Para suporte, envie um email para support@example.com ou abra uma issue no GitHub.

---

**Status do Projeto**: ✅ Production Ready

**Versão**: 1.0.0

**Última Atualização**: 2024
