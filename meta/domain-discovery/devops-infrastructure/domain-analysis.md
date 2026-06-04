# DevOps & Infrastructure for Laravel — Domain Analysis

## Domain Overview

DevOps & Infrastructure for Laravel encompasses the full lifecycle of building, deploying, running, and monitoring Laravel applications in production environments. This domain bridges the gap between local development (using tools like Laravel Sail) and production-grade hosting on bare-metal servers, VMs, containers (Docker/Kubernetes), or serverless platforms (AWS Lambda via Vapor). It includes CI/CD pipeline design, server provisioning, configuration management, zero-downtime deployment strategies, database migration automation, rollback procedures, observability, and infrastructure-as-code (IaC) practices.

The Laravel ecosystem offers both first-party (Laravel Forge, Vapor, Envoyer, Nightwatch, Octane) and third-party (Deployer, Ploi, RunCloud, Moss) tooling. The broader PHP ecosystem contributes deployment frameworks (Deployer), monitoring solutions, and hosting platforms (DigitalOcean, Fly.io, Railway, Platform.sh) that have first-class Laravel support.

---

## Domain Scope

### In Scope
- **Server provisioning & management**: Forge, Ploi, manual VPS setup (DigitalOcean, Vultr, AWS EC2, Linode)
- **Deployment strategies**: Zero-downtime (Envoyer, Deployer, Octane), blue/green, rolling updates, canary
- **CI/CD pipelines**: GitHub Actions, GitLab CI, Jenkins, Bitbucket Pipelines, Buddy.works
- **Containerization**: Docker (Laravel Sail), Docker Compose, multi-stage builds, Dockerfiles for Laravel
- **Orchestration**: Kubernetes (EKS, GKE, AKS, K3s), Docker Swarm
- **Serverless**: Laravel Vapor (AWS Lambda), Bref (serverless PHP), Laravel Cloud
- **Infrastructure as Code**: Terraform, Pulumi, AWS CDK, Ansible
- **Environment management**: .env strategies, secret management (Vault, AWS Secrets Manager, Doppler), branching environments
- **Database deployment**: Migrations in CI, migration idempotency, rollback strategies, blue-green DB patterns
- **Observability**: Laravel Nightwatch, Laravel Pulse, Telescope, logging (Sentry, Flare, Datadog, New Relic)
- **Performance**: Laravel Octane (FrankenPHP, RoadRunner, Swoole), OPcache, Nginx tuning
- **Hosting platforms**: AWS (EC2, ECS, EKS, Lambda), DigitalOcean App Platform, Fly.io, Railway, Platform.sh, Cloudways, Kinsta
- **Monorepos & multi-tenant deployments**

### Out of Scope
- Application-level code architecture (covered by Application Architecture domain)
- Database schema design beyond migration patterns
- Frontend build toolchain optimization
- Specific third-party SaaS integrations
- Legacy PHP deployment patterns (pre-Laravel era)

---

## Major Subdomains

### 1. Server Provisioning & Management
- **Forge**: First-party server management; provisions DigitalOcean, Linode, AWS, Vultr, Hetzner; manages Nginx, PHP, MySQL, Redis, queue workers, cron, SSL, firewalls
- **Ploi**: Third-party alternative; similar capabilities, Docker server support, staging sites, load balancing, status pages
- **RunCloud, Moss, ServerPilot**: Alternative control panels
- **Manual VPS**: Ubuntu + Nginx + PHP-FPM + MySQL/PostgreSQL + Redis + Supervisor
- **Managed hosting**: Cloudways, Kinsta, WP Engine (for Laravel)

### 2. Deployment Strategies
- **Envoyer**: Zero-downtime PHP deployments; Git-integrated, health checks, rollbacks, multi-server, Forge integration; Octane note: not needed if using Octane (built-in)
- **Deployer**: Open-source PHP deployment tool; `deploy.php` recipes for Laravel; tasks: `artisan:cache`, `migrate`, `npm:build`; supports multi-server, rollback by symlink swap
- **Vapor**: Serverless deployments via `vapor deploy` CLI; auto-scales Lambda; zero-downtime; caches/optimizes automatically; rollbacks via `vapor deploy:rollback`
- **Envoyer + Forge**: Combined workflow; Forge manages server, Envoyer handles deployment flow
- **Octane**: Built-in zero-downtime via `octane:reload`; workers gracefully restart; FrankenPHP/RoadRunner/Swoole
- **Manual**: Git clone + composer + artisan optimize + supervisor restart + symlink swap

### 3. CI/CD Pipelines
- **GitHub Actions**: `laravel-test.yml` for testing; `deploy.yml` for deploy; shiva-action/laravel-deployer; Fly.io + GitHub Actions integration
- **GitLab CI**: `.gitlab-ci.yml` with stages (test, build, deploy); GitLab Runner; DIND for Docker builds; deployment to Forge via API
- **Jenkins**: Pipeline-as-code; PHP plugin; Docker pipeline; artifact archiving
- **Bitbucket Pipelines**: `bitbucket-pipelines.yml`; SSH deploy
- **Buddy.works**: Visual CI/CD; Docker/K8s support; one-click rollback

### 4. Containerization (Docker)
- **Laravel Sail**: Official Docker dev environment; `docker-compose.yml` with PHP (8.0-8.4), MySQL/PostgreSQL, Redis, Meilisearch, Mailpit, Selenium; customizable runtimes
- **Production Dockerfiles**: Multi-stage builds for size optimization (composer install in build stage, php-fpm in runtime); Nginx + FPM separate containers; supervisord for queue workers
- **FrankenPHP Docker**: Single binary with embedded PHP + Caddy; Octane-ready; `dunglas/frankenphp` image
- **Best practices**: Non-root user, `.dockerignore`, health checks, `php artisan optimize` in CMD, OPcache preload, workers as separate containers

### 5. Orchestration (Kubernetes)
- **K8s manifests**: Deployments, Services, Ingress, ConfigMaps, Secrets, HPA, PVCs
- **Helm charts**: Custom or Bitnami Nginx/PHP; Laravel-specific values
- **Laravel on K8s**: Stateless app pods + shared Redis/DB; PHP-FPM + Nginx sidecar or single FrankenPHP pod; queue worker Deployments; CronJob for scheduler; health checks via `/up` route; `LivenessProbe`/`ReadinessProbe`
- **Service mesh**: Istio for canary deployments, traffic splitting
- **Managed K8s**: EKS (AWS), GKE (Google), AKS (Azure), DOKS (DigitalOcean), K3s (edge)
- **Laravel Horizon + K8s**: Supervisor in K8s; Redis as queue backend; auto-scaling workers

### 6. Serverless Laravel
- **Laravel Vapor**: AWS Lambda + API Gateway + RDS + ElastiCache + CloudFront; managed via `vapor.yml`; `vapor deploy`, `vapor deploy:rollback`; supports queues (SQS), cron (EventBridge), assets (CDN); multi-environment; CI-friendly
- **Laravel Cloud**: Newer evolution of Vapor; simpler UX; auto-scaling; migration path from Vapor
- **Bref**: Open-source serverless PHP on Lambda; Bring Your Own Framework; `bref extra:serverless-laravel`; custom runtime; SQS + S3 integration
- **Comparison**: Vapor = managed, opinionated, deeper Laravel integration; Bref = DIY, flexible, lower cost at scale

### 7. Infrastructure as Code (IaC)
- **Terraform**: `hashicorp/aws` provider for VPC, RDS, ElastiCache, ECS/EKS, Lambda; Laravel-specific modules; state management in S3 + DynamoDB
- **Pulumi**: TypeScript/Python/Go for Laravel infra; AWS native provider; code-reuse via Pulumi Packages
- **AWS CDK**: TypeScript/Python for Laravel on AWS; L2 constructs for ECS, Lambda, RDS
- **Ansible**: Playbooks for server provisioning (PHP, Nginx, MySQL, Redis, Supervisor, Composer); idempotent; Forge alternative for custom workflows
- **CloudFormation / CDK**: AWS-native IaC for Vapor-managed infrastructure

### 8. Environment & Secrets Management
- **`.env` practices**: Never commit `.env`; use `.env.example` with placeholders; `php artisan key:generate`
- **Forge / Vault / Doppler**: Encrypted env management; team sharing; environment branching
- **GitHub Actions Secrets / GitLab CI Variables**: Per-environment secret injection at deploy time
- **AWS Secrets Manager / SSM Parameter Store**: Lambda/ECS native; rotation policies; IAM-based access
- **Vapor env management**: `vapor env:pull`, `vapor env:push`; per-project, per-environment; encrypted at rest

### 9. Database Deployment & Migration
- **Migrations in CI**: `php artisan migrate --force` in deploy step; idempotent by design; never `migrate:fresh` in production
- **Zero-downtime migrations**: Avoid long-running ALTER TABLE; use pt-online-schema-change or gh-ost; batch row updates; add columns as nullable first
- **Rollback strategy**: `php artisan migrate:rollback` (limited); prefer forward-only with compensating migrations
- **Vapor DB management**: RDS point-in-time restore, database scaling, DB tunneling (`vapor db:tunnel`), cache tunnels
- **Multi-DB deployments**: Read replicas for scaling; separate migration order per connection

### 10. Observability & Monitoring
- **Laravel Nightwatch**: First-party monitoring; real-time metrics, exceptions, deploys, queries
- **Laravel Pulse**: Dashboard for system health, slow queries, jobs, cache, usage; auto-refresh
- **Laravel Telescope**: Debug assistant for local/dev; optional production use with authorization guard
- **Sentry / Flare**: Exception tracking; breadcrumbs; performance tracing
- **Datadog / New Relic**: APM; distributed tracing; custom metrics via OpenTelemetry
- **Server monitoring**: Forge metrics, Netdata, Prometheus + Grafana, Uptime Robot, Oh Dear!
- **Log aggregation**: Laravel logging to stderr/stdout in Docker; Papertrail, Logtail, Mezmo, AWS CloudWatch

### 11. Hosting Platforms with Laravel Support
- **DigitalOcean App Platform**: Buildpack-based Laravel deployment; zero-config PHP/Node; GitHub deploy; managed DB/Redis
- **Fly.io**: Docker-based; `fly launch` auto-detects Laravel; Machines + Fly Volume for storage; global regions; GitHub Actions CI; Postgres/MySQL/Redis extensions; Laravel-specific Dockerfile generator
- **Railway**: Monolith architecture; App/Cron/Worker/DB services; Laravel detection via Railpack; pre-deploy hook for migrations; stderr logging
- **Platform.sh**: Git-push deploy; `routes.yaml`, `services.yaml`, `.platform.app.yaml` for Laravel; built-in cron/queue/Redis; multi-env via branches; Dockerfile optional
- **AWS (self-managed)**: EC2 + RDS + ElastiCache + ALB + CloudFront + S3; Terraform or CloudFormation; more control, higher ops cost

---

## Complete Knowledge Inventory

| # | Knowledge Area | Expertise Level (1-5) | Maturity | Sources |
|---|---|---|---|---|
| 1 | Laravel Forge provisioning & management | 4 | Mature | laravel.com/docs/forge, Forge API docs |
| 2 | Laravel Vapor (serverless) | 3 | Mature | vapor.laravel.com/docs |
| 3 | Envoyer zero-downtime deployments | 3 | Mature | envoyer.io/docs |
| 4 | Laravel Sail (Docker dev) | 5 | Mature | laravel.com/docs/sail |
| 5 | Laravel Octane (high-performance) | 4 | Mature | laravel.com/docs/octane |
| 6 | Production Dockerfiles (multi-stage) | 4 | Maturing | Docker docs, community best practices |
| 7 | Kubernetes for Laravel | 2 | Maturing | K8s docs, community blog posts |
| 8 | GitHub Actions CI/CD | 4 | Mature | GitHub docs, Fly.io integration docs |
| 9 | GitLab CI for Laravel | 3 | Mature | GitLab docs |
| 10 | Deployer PHP | 3 | Mature | deployer.org |
| 11 | Terraform for Laravel infra | 3 | Mature | Terraform registry, AWS provider docs |
| 12 | Pulumi for Laravel | 2 | Maturing | Pulumi docs |
| 13 | Ansible provisioning | 3 | Mature | Ansible docs |
| 14 | Ploi server management | 3 | Maturing | ploi.io/docs |
| 15 | Fly.io Laravel deployment | 3 | Maturing | fly.io/docs/laravel |
| 16 | Railway Laravel deployment | 2 | Maturing | railway.app/docs |
| 17 | Platform.sh Laravel | 3 | Mature | platform.sh/docs |
| 18 | DigitalOcean App Platform | 2 | Mature | DO docs |
| 19 | Database migration in CI | 4 | Mature | Laravel docs, community patterns |
| 20 | Zero-downtime migration strategies | 2 | Maturing | pt-osc, gh-ost docs |
| 21 | Environment & secret management | 3 | Mature | AWS Secrets Manager, Doppler, Vapor |
| 22 | Observability (Pulse, Nightwatch, Sentry) | 3 | Maturing | Laravel docs, Sentry docs |
| 23 | Laravel Cloud (next-gen Vapor) | 1 | Emerging | cloud.laravel.com |
| 24 | FrankenPHP standalone deployments | 2 | Maturing | frankenphp.dev |

---

## Knowledge Classification

### Core (Required for all phases)
- Laravel deployment optimization (`config:cache`, `route:cache`, `view:cache`, `event:cache`)
- Server requirements (PHP 8.2+, extensions, Nginx configuration)
- Directory permissions (`bootstrap/cache`, `storage`)
- Debug mode enforcement (`APP_DEBUG=false`)
- Health check route (`/up`)
- Basic `.env` management

### Essential (Majority of projects)
- CI/CD pipeline design (GitHub Actions or GitLab CI)
- Dockerization via Sail or custom Dockerfile
- Forge or Ploi for server management
- Deployment via Envoyer, Deployer, or Vapor
- Database migration automation
- Queue worker supervision
- Secret management
- Error monitoring (Sentry/Flare)

### Advanced (Complex/scaled projects)
- Kubernetes orchestration
- Multi-stage Docker builds with Octane
- Terraform/Pulumi IaC
- Blue/green or canary deployments
- Read replica databases
- Auto-scaling (horizontal pod/instance scaling)
- Service mesh (Istio)
- Custom AMI/packer images
- Multi-region deployments
- Laravel Vapor + CloudFront CDN optimizations

### Emerging
- Laravel Cloud
- FrankenPHP standalone binary deployments
- Fly.io global Machines
- Edge computing + Laravel
- AI-ops for Laravel (LLM-assisted debugging)

---

## Dependency Map

```
Laravel Application
├── PHP Runtime (8.2+)
│   ├── Extensions (PDO, cURL, MBString, XML, etc.)
│   └── FPM / FrankenPHP / Swoole / RoadRunner
├── Web Server
│   ├── Nginx (most common)
│   ├── Caddy (via FrankenPHP)
│   └── Apache (legacy)
├── Database
│   ├── MySQL / MariaDB / PostgreSQL
│   ├── Migration toolchain (Artisan)
│   └── Backup/restore (point-in-time)
├── Cache
│   ├── Redis / Valkey
│   ├── Memcached
│   └── OPcache
├── Queue
│   ├── Redis / Database / SQS
│   ├── Laravel Horizon (dashboard)
│   └── Supervisor / K8s worker pods
├── Storage
│   ├── Local (ephemeral in container)
│   ├── S3 / MinIO / GCS
│   └── CDN (CloudFront, Cloudflare)
├── Deployment Pipeline
│   ├── Git repository (GitHub/GitLab/Bitbucket)
│   ├── CI (test, lint, build)
│   ├── CD (Envoyer/Deployer/Vapor/Forge)
│   ├── Docker registry (ECR/GHCR/Docker Hub)
│   └── Artifact caching
└── Observability
    ├── Nightwatch / Pulse / Telescope
    ├── Sentry / Flare (exceptions)
    ├── Datadog / New Relic (APM)
    └── Log aggregation (CloudWatch/Logtail)
```

**Key dependencies in deployment flow:**
- Git push → CI trigger → Tests pass → Build artifact → Deploy → Migrate → Cache clear → Health check
- Docker: Build image → Push registry → Pull on server → Restart containers → Health check
- Vapor: `vapor deploy` → Lambda update → Warm Lambda → Alias swap → Health check

---

## Missing Knowledge Risk Analysis

| Gap | Risk Level | Impact | Mitigation |
|---|---|---|---|
| Zero-downtime migration tooling (pt-osc, gh-ost) | High | Production downtime on large table migrations | Research and document patterns for Laravel apps |
| K8s HPA + Laravel queue worker autoscaling | High | Over/under-provisioned workers in K8s | Reference KEDA integration for Laravel |
| Multi-region Vapor deployments | Medium | Regional failure risk for serverless apps | Request AWS documentation, multi-region Vapor patterns |
| Laravel Cloud vs Vapor migration path | Medium | Premature migration without understanding trade-offs | Wait for Cloud maturity, document migration playbook |
| Edge caching strategies (Vapor + CloudFront) | Medium | Suboptimal CDN performance | Research Vapor CDN docs further |
| FrankenPHP production edge cases | Low-Medium | Unexpected behavior at scale | Monitor FrankenPHP changelog, community reports |
| ARM64 (Graviton) container optimization | Low | Missed cost savings (up to 20%) | Document multi-arch build guides |
| Cost optimization for Vapor (Lambda + RDS) | Medium | Unexpected AWS bills | Budget alerts, provisioned concurrency tuning docs |

---

## Research Findings

### Key Insight 1: Laravel's first-party tooling is the moat
Laravel Forge, Vapor, Envoyer, Nightwatch, Pulse, and Octane form a vertically integrated stack that competes with generalized DevOps tooling. The `php artisan optimize` approach centralizes production tuning. Forge integrates with 6+ cloud providers and manages the full LAMP/LEMP stack with one click. Vapor abstracts AWS Lambda complexity behind `vapor.yml` and a single CLI command. This vertical integration means Laravel DevOps knowledge is partially framework-specific — general K8s expertise does not directly map to Vapor workflows.

### Key Insight 2: The shift from VPS to serverless and container platforms
Three deployment trajectories are emerging:
1. **Forge/Envoyer (traditional VPS)**: Best for teams wanting full server control, moderate traffic, fixed monthly cost
2. **Vapor/Cloud (serverless)**: Best for variable traffic, auto-scaling requirements, teams wanting zero ops
3. **Docker/K8s (container orchestration)**: Best for organizations already using K8s, microservices, multi-app infrastructure

Fly.io and Railway represent a middle path — Docker-based but with platform-managed infrastructure (auto-deploy, managed DB/Redis, global regions).

### Key Insight 3: Octane changes deployment dynamics
Laravel Octane (with FrankenPHP, RoadRunner, or Swoole) fundamentally changes deployment:
- Application stays in memory between requests (no cold boot)
- Workers need graceful restart for code updates (`octane:reload`)
- Zero-downtime is built-in, making Envoyer unnecessary for Octane apps
- Nginx reverse proxy is optional (FrankenPHP includes Caddy; RoadRunner/Swoole are HTTP servers)
- Memory leak management becomes a production concern

### Key Insight 4: CI/CD patterns are converging
The standard Laravel CI/CD pipeline across platforms follows:
```
commit → lint (Pint) → test (Pest/PHPUnit) → static analysis (PHPStan) →
build assets (npm/vite) → deploy (via Forge API / Envoyer / Vapor CLI / Deployer)
```
GitHub Actions dominates as the CI orchestration layer, with platform-specific deploy actions (superfly/flyctl-actions, shiva-action/laravel-deployer, setup-php for testing).

### Key Insight 5: IaC adoption is lower than expected
Most Laravel teams use Forge/Ploi UI rather than Terraform/Pulumi. IaC is primarily adopted by:
- Teams deploying to vanilla AWS/GCP without Forge
- Multi-environment (staging/production parity via code)
- Compliance-heavy environments (SOC2, HIPAA)
- K8s deployments (Helm + Terraform)

---

## Future Expansion Opportunities

1. **Laravel Cloud deep-dive**: As Cloud evolves from Vapor, document migration, pricing comparison, and feature gaps
2. **AI-augmented Laravel Ops**: LLMs for log analysis, auto-remediation, deploy failure diagnosis
3. **Edge Laravel**: FrankenPHP + Fly.io global Machines for low-latency multi-region Laravel
4. **OpenTelemetry for Laravel**: Custom OTEL SDK integration, tracing spans for queues/Octane
5. **GitOps for Laravel**: ArgoCD/Flux workflows for Laravel K8s deployments
6. **Fine-grained Vapor cost modeling**: Lambda provisioned concurrency vs on-demand analysis
7. **Laravel + WebAssembly**: Server-side WASM for compute-intensive Laravel tasks
8. **Carbon-aware deployments**: Scheduling CI/deploy during low-carbon energy periods

---

## Sources Consulted

### Tier 1 (Official Documentation)
- Laravel 11.x Deployment Guide — laravel.com/docs/11.x/deployment
- Laravel Sail Documentation — laravel.com/docs/11.x/sail
- Laravel Octane Documentation — laravel.com/docs/11.x/octane
- Laravel Forge Documentation — forge.laravel.com/docs
- Laravel Vapor Documentation — vapor.laravel.com/docs
- Laravel Envoyer Documentation — envoyer.io/docs

### Tier 2 (Official Platform Docs)
- Fly.io Laravel Guide — fly.io/docs/laravel
- Railway Laravel Guide — docs.railway.app/guides/laravel
- Ploi Documentation — ploi.io/documentation
- Platform.sh Laravel Guide — platform.sh/docs

### Tier 3 (Community & Ecosystem)
- Laravel News — laravel-news.com
- Laracasts Forge/Envoyer Series — laracasts.com
- Deployer Documentation — deployer.org
- FrankenPHP Laravel Docs — frankenphp.dev/docs/laravel
- Bref Serverless PHP — bref.sh

### Tier 4 (Supplementary)
- GitHub Actions Documentation — docs.github.com/en/actions
- GitLab CI/CD Documentation — docs.gitlab.com/ee/ci
- Terraform AWS Provider — registry.terraform.io/providers/hashicorp/aws
- Docker Documentation — docs.docker.com
- Kubernetes Documentation — kubernetes.io/docs
- AWS Lambda Developer Guide — docs.aws.amazon.com/lambda
