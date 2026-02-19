# QA Runtime Tests

Projeto de testes **independente** (isolado do backend) para rodar:

- Testes de API (Postman/Newman)
- Testes de performance/carga (k6)
- Pipeline local em Docker Compose (infra -> seed -> backend -> testes)

## Objetivo

- Testes de API com Newman
- Testes de performance/carga com k6
- Pipeline local em Docker
- Estrutura desacoplada do projeto principal

## Onde estão os testes

### Testes de API (Newman)

- **Coleção Postman (casos de teste):** `newman/collections/anka-api.postman_collection.json`
- **Environment base (local):** `newman/environments/local.postman_environment.json`
- **Runner (orquestra login + OTP via DB + geração de evidências):** `scripts/run-newman.mjs`

O fluxo de API é dividido em duas fases:

- **Bootstrap:** health + login (gera `challengeId`)
- **AuthFlow:** valida OTP (lida do Postgres) + `GET /api/v1/auth/me`

### Testes de performance/carga (k6)

- **Cenários:** `k6/scenarios/*.js`
  - `smoke.js`: sanity (poucas iterações)
  - `load.js`: carga (VUs por estágios)
  - `stress.js`: stress (configurável por variáveis de ambiente)

Os cenários exportam `summary.json` para `k6/reports/` e depois são consolidados em HTML/JUnit por:

- `scripts/generate-k6-evidence.mjs`

## Estrutura de pastas

Visão geral:

```text
qa-runtime-tests/
	docker/
		compose.qa.yml                # Stack de execução (postgres/redis/localstack/backend + runners)
		Dockerfile.runner             # Imagem do runner (newman/k6)
		.env.example                  # Variáveis do compose QA
	newman/
		collections/                  # Coleções Postman (testes de API)
		environments/                 # Environments Postman
		reports/                      # Evidências geradas pelo Newman (JSON/JUnit/HTML)
	k6/
		scenarios/                    # Scripts de teste de performance/carga
		reports/                      # Summaries JSON + consolidado (HTML/JUnit)
	scripts/
		run-newman.mjs                # Runner dos testes de API + geração de reports
		run-pipeline-local.mjs        # Orquestra pipeline local (infra -> seed -> backend -> newman -> k6)
		generate-k6-evidence.mjs      # Consolida summaries do k6 em HTML + JUnit
	pipeline/
		buildspec.qa-tests.yml        # Exemplo de buildspec (CI)
		github-actions.qa-tests.yml   # Exemplo de workflow (CI)
	package.json                    # Scripts de execução (api:test, perf:*, pipeline:local)
	README.md
```

Resumo por diretório:

- `newman/collections`: coleções Postman (testes de API)
- `newman/environments`: ambientes Postman
- `newman/reports`: relatórios Newman
- `k6/scenarios`: cenários de smoke/load/stress
- `k6/reports`: relatórios k6
- `docker/compose.qa.yml`: stack Docker de execução
- `scripts`: orquestração local (pipeline + newman)
- `pipeline`: exemplos de pipeline isolado

## Relatórios gerados

- Newman (JSON, JUnit XML e HTML):
  - `newman/reports/bootstrap-report.json`
  - `newman/reports/bootstrap-report.junit.xml`
  - `newman/reports/bootstrap-report.html`
  - `newman/reports/auth-flow-report.json`
  - `newman/reports/auth-flow-report.junit.xml`
  - `newman/reports/auth-flow-report.html`
- k6 (summary JSON):
  - `k6/reports/smoke-summary.json`
  - `k6/reports/load-summary.json`
  - `k6/reports/stress-summary.json`
  - `k6/reports/k6-consolidated-report.html`
  - `k6/reports/k6-consolidated-report.junit.xml`

## Execução rápida

No diretório `qa-runtime-tests`:

> Dica: se você estiver na **raiz do repositório**, pode executar assim:
>
> ```bash
> npm --prefix qa-runtime-tests run pipeline:local
> ```

1. Subir stack de infraestrutura + API:

```bash
npm run up
```

2. Aplicar migrações e seed:

```bash
npm run seed
```

3. Criar bucket no LocalStack:

```bash
npm run init:s3
```

4. Rodar testes de API (Newman):

```bash
npm run api:test
```

> `api:test` agora prepara o ambiente automaticamente (up + seed + init:s3) antes de executar o Newman.
> Para rodar somente o Newman em um ambiente já preparado, use `npm run api:test:only`.

5. Rodar performance/carga (k6):

```bash
npm run perf:smoke
npm run perf:load
npm run perf:stress
```

### Ajustes do stress test

O cenário `stress.js` aceita variáveis de ambiente para calibrar carga e thresholds no ambiente local:

- `STRESS_STAGE_1_VUS`, `STRESS_STAGE_2_VUS`, `STRESS_STAGE_3_VUS`, `STRESS_STAGE_4_VUS`
- `STRESS_P95_MS`, `STRESS_P99_MS`, `STRESS_FAIL_RATE`

Exemplo:

```bash
docker compose -f docker/compose.qa.yml --env-file docker/.env.example run --rm -e STRESS_STAGE_4_VUS=120 -e STRESS_P95_MS=4500 -e STRESS_P99_MS=7000 k6-runner run /work/k6/scenarios/stress.js
```

6. Rodar pipeline local completo:

```bash
npm run pipeline:local
```

7. Derrubar stack:

```bash
npm run down
```
