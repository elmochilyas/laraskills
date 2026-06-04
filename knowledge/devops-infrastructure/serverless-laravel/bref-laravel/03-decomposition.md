# Decomposition: Bref Laravel

## Topic Overview
Bref enables running Laravel on AWS Lambda in a serverless architecture. Covers Lambda runtime configuration, API Gateway integration, event-driven queue/cron processing, cold start mitigation, and comparison with managed serverless platforms (Vapor, Cloud).

## Decomposition Strategy
1. **Lambda runtime architecture** — Bref PHP runtime, FPM wrapper, invocation lifecycle
2. **HTTP serving** — API Gateway (REST/HTTP API), Lambda function URL, custom domains
3. **Event-driven workloads** — SQS queue processing, EventBridge scheduled tasks
4. **File handling** — S3 uploads, presigned URLs, Lambda request limits
5. **Database connectivity** — RDS Proxy, connection pooling, VPC networking
6. **Cold start optimization** — configuration cache, provisioned concurrency, runtime warmup

## Proposed Folder Structure
```
serverless-laravel/
├── bref-laravel/
│   ├── 01-knowledge-unit.md  (KU definition)
│   ├── 02-knowledge-unit.md  (detailed knowledge)
│   ├── 03-decomposition.md   (this file)
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── bref-laravel-config.yml
│       ├── serverless-laravel.yml
│       └── rds-proxy-setup.md
```

## Knowledge Unit Inventory
- KU-014: Laravel Vapor — managed Lambda-based serverless platform
- KU-015: Laravel Cloud — K8s-based managed hosting (serverless successor)
- KU-016: Bref Laravel — open-source serverless PHP framework

## Dependency Graph
- **Prerequisites:** AWS Lambda basics, API Gateway concepts, PHP-FPM understanding
- **Related:** Laravel Vapor (managed alternative), Laravel Cloud (next-gen managed), K8s Laravel (container orchestration alternative)
- **Extends:** Traditional server → Lambda serverless → event-driven serverless architecture

## Boundary Analysis
- **In scope:** Bref framework, Lambda configuration, API Gateway, SQS, EventBridge, cold start optimization, connection pooling
- **Out of scope:** Managed serverless platforms (Vapor, Cloud), non-PHP Lambda runtimes, AWS Lambda internals (Firecracker, SnapStart)

## Future Expansion Opportunities
- Bref v2 migration guide
- Lambda SnapStart evaluation for PHP (current limitation — Java only)
- Multi-region serverless Laravel architectures
- Cost optimization strategies for Bref at scale
- Bref + Laravel Octane integration possibilities
