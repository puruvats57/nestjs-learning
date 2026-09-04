# nestjs-learnings

A NestJS learning project with **users**, **JWT auth**, and **PostgreSQL (TypeORM)**.

## How NestJS works

Nest is a Node.js framework built around **modules**, **dependency injection**, and clear layers (similar to Angular).

### Core building blocks

| Piece | Role |
| --- | --- |
| **Module** (`@Module`) | Groups related controllers + providers. Wires imports/exports. |
| **Controller** (`@Controller`) | Handles HTTP routes. Thin — calls services. |
| **Provider / Service** (`@Injectable`) | Business logic. Injected into controllers/other services. |
| **DTO** | Shape + validation of request body/query. |
| **Entity** | Database table mapping (TypeORM). |
| **Guard** (`@UseGuards`) | Runs **before** the handler (auth, roles). Can block with 401/403. |
| **Pipe** | Transforms/validates input (this app uses global `ValidationPipe`). |
| **Decorator** | Extra helpers like `@CurrentUser()` to read `request.user`. |

### Request lifecycle (simplified)

```
HTTP request
  → middleware
  → guards          (e.g. JwtAuthGuard)
  → interceptors (before)
  → pipes           (ValidationPipe)
  → controller method
  → service / DB
  → response
```

### Dependency injection (DI)

You don’t `new UsersService()` yourself. Nest creates instances and injects them:

```ts
constructor(private readonly usersService: UsersService) {}
```

- Providers must be listed in a module’s `providers` (or imported from another module’s `exports`).
- **TypeScript file imports** (decorators, guards as classes) ≠ Nest **`exports`**.
  - File import: any file can `import { CurrentUser } from '...'`.
  - Nest `exports`: only needed when another module must **inject** a provider (e.g. `UsersService`).

### Modules in this project

```
AppModule
 ├── TypeOrmModule (Postgres)
 ├── UsersModule   → UsersController, UsersService, User entity
 └── AuthModule   → AuthController, AuthService, JwtStrategy
                   (imports UsersModule to use UsersService)
```

### Auth flow (JWT)

1. `POST /auth/login` → `AuthService` checks password → returns `access_token`.
2. Client sends `Authorization: Bearer <token>`.
3. `@UseGuards(JwtAuthGuard)` → Passport strategy `'jwt'`.
4. `JwtStrategy` extracts Bearer token, verifies with secret, runs `validate()`.
5. Return value of `validate()` becomes `request.user`.
6. `@CurrentUser()` reads `request.user` in the controller.
7. Handler runs (e.g. `GET /users/me`).

```
Login → JWT
GET /users/me + Bearer token
  → JwtAuthGuard
  → JwtStrategy (extract + verify + validate)
  → request.user = { userId, email }
  → getMe(@CurrentUser() user)
  → UsersService.findById(...)
```

---

## Prerequisites

- Node.js 20+ (22 recommended for Nest 12 ESM)
- PostgreSQL running locally

Default DB config in `src/app.module.ts`:

| Setting | Value |
| --- | --- |
| host | `localhost` |
| port | `5432` |
| username | `postgres` |
| password | `12345` |
| database | `nest_auth` |

Create the database if needed:

```bash
createdb nest_auth
```

---

## Setup

```bash
npm install
```

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Dev server with watch (use this day to day) |
| `npm run start` | Start once (no watch) |
| `npm run start:debug` | Watch + Node debugger |
| `npm run start:prod` | Run compiled `dist/main` |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run lint` | Lint with oxlint |
| `npm run format` | Format with Prettier |
| `npm test` | Unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:cov` | Unit tests + coverage |
| `npm run test:e2e` | End-to-end tests |

App listens on **http://localhost:3000**.

---

## API

### Public

**Register**

```bash
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Prateek","email":"a@b.com","password":"secret1"}'
```

**Login**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"secret1"}'
```

### Protected (need `Authorization: Bearer <access_token>`)

**Current user**

```bash
curl http://localhost:3000/users/me \
  -H 'Authorization: Bearer <access_token>'
```

**List users**

```bash
curl http://localhost:3000/users \
  -H 'Authorization: Bearer <access_token>'
```

**Hello**

```bash
curl http://localhost:3000/
```

---

## Project structure

```
src/
  main.ts                 # Bootstrap app + global ValidationPipe
  app.module.ts           # Root module (DB + feature modules)
  app.controller.ts
  app.service.ts
  users/
    users.module.ts
    users.controller.ts   # Routes; some guarded with JwtAuthGuard
    users.service.ts
    dto/
    entities/
  auth/
    auth.module.ts
    auth.controller.ts    # POST /auth/login
    auth.service.ts       # Password check + sign JWT
    guards/               # JwtAuthGuard
    strategies/           # JwtStrategy
    decorators/           # @CurrentUser()
    dto/
```

---

## Important things to remember

1. **Controllers stay thin** — validation + HTTP; logic lives in services.
2. **Modules own DI wiring** — `imports` / `providers` / `controllers` / `exports`.
3. **Guards ≠ decorators** — guard authenticates; `@CurrentUser()` only reads `request.user`.
4. **Keep register/login public** — put `@UseGuards(JwtAuthGuard)` only on protected routes (or use a global guard + `@Public()` later).
5. **Never return password hashes** — strip or use TypeORM `select` without `password`.
6. **DTO + `ValidationPipe`** — `class-validator` decorators on DTOs; global pipe uses `whitelist: true`.
7. **ESM + Nest 12** — `"type": "module"` and `moduleResolution: "nodenext"` mean **relative imports need `.js` extensions** in TypeScript (e.g. `'./users.service.js'`).
8. **Secrets** — JWT secret is hardcoded as `SUPER_SECRET` for learning only; use env vars in real apps.
9. **`synchronize: true`** — TypeORM auto-updates schema; fine for learning, not for production.
10. **Circular modules** — `AuthModule` imports `UsersModule`. Don’t make `UsersModule` import `AuthModule`; import guard/decorator **files** instead.

---

## Useful Nest CLI generators

```bash
npx nest g module posts
npx nest g controller posts
npx nest g service posts
npx nest g resource posts   # module + controller + service + DTO scaffold
```

---

## Learn more

- [NestJS docs](https://docs.nestjs.com)
- [Authentication](https://docs.nestjs.com/security/authentication)
- [Techniques — Validation](https://docs.nestjs.com/techniques/validation)
- [TypeORM](https://docs.nestjs.com/techniques/database)
