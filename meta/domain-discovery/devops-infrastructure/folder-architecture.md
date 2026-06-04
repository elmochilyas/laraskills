# DevOps & Infrastructure — Folder Architecture

```
research/phase-1-domain-discovery/devops-infrastructure/
│
├── domain-analysis.md                                    # Phase 1 domain analysis (this directory's overview)
├── folder-architecture.md                                # This file — folder structure documentation
│
├── 01-server-provisioning/
│   ├── README.md                                         # Overview: Forge, Ploi, manual VPS
│   ├── forge/
│   │   ├── index.md                                      # Forge overview, pricing, providers
│   │   ├── provisioning.md                               # Server creation, provider setup (DO, AWS, Linode, Vultr)
│   │   ├── nginx-configuration.md                        # Nginx templates, PHP-FPM pools, SSL
│   │   ├── php-management.md                             # Multiple PHP versions, OPcache, extensions
│   │   ├── database-management.md                        # MySQL, PostgreSQL, MariaDB setup
│   │   ├── redis-cache.md                                # Redis/Memcached provisioning
│   │   ├── queue-workers.md                              # Horizon, supervisor config
│   │   ├── cron-scheduler.md                             # Scheduled job management
│   │   ├── firewall-security.md                          # UFW, SSH key management, IP whitelisting
│   │   ├── load-balancing.md                             # Multi-server setup, load balancer provisioning
│   │   ├── forge-api-reference.md                        # API usage for CI/CD integration
│   │   └── recipes/                                      # Reusable recipe files
│   │       ├── deploy-script.sh
│   │       └── provisioning-hooks.sh
│   ├── ploi/
│   │   ├── index.md                                      # Ploi overview vs Forge
│   │   ├── provisioning.md                               # Server setup (Hetzner, DO, Vultr, AWS)
│   │   ├── site-management.md                            # Nginx, PHP, SSL, domains
│   │   ├── deployment-setup.md                           # Git integration, deploy scripts
│   │   ├── docker-support.md                             # Docker server management
│   │   ├── staging-sites.md                              # Staging environments
│   │   ├── load-balancing.md                             # Ploi load balancer setup
│   │   ├── status-pages.md                               # Custom status page configuration
│   │   └── api-integration.md                            # Ploi API for automation
│   ├── runcloud/
│   │   └── index.md                                      # RunCloud overview, comparison
│   ├── moss/
│   │   └── index.md                                      # Moss.sh overview
│   └── manual-vps/
│       ├── index.md                                      # Ubuntu server hardening
│       ├── nginx-config.md                               # LEMP stack from scratch
│       ├── php-fpm-tuning.md                             # Pool tuning, OPcache settings
│       ├── database-setup.md                             # MySQL/PostgreSQL install + tuning
│       ├── redis-setup.md                                # Redis install, persistence, security
│       ├── supervisor-setup.md                           # Queue workers, horizon
│       ├── firewall-hardening.md                         # UFW, fail2ban, sshd config
│       ├── monitoring-stack.md                           # Netdata, Prometheus, Grafana
│       └── backup-strategies.md                          # Database + file backup automation
│
├── 02-deployment-strategies/
│   ├── README.md                                         # Deployment patterns overview
│   ├── envoyer/
│   │   ├── index.md                                      # Envoyer overview, pricing
│   │   ├── getting-started.md                            # Project setup, Git integration
│   │   ├── deployment-flow.md                            # Zero-downtime mechanics (symlink swap)
│   │   ├── deploy-scripts.md                             # Custom deployment hooks (activate, deactivate)
│   │   ├── health-checks.md                              # Health check URLs and IPs
│   │   ├── rollbacks.md                                  # One-click rollback workflow
│   │   ├── multi-server.md                               # Deploying to multiple servers
│   │   ├── notifications.md                              # Slack, Discord, email integration
│   │   ├── forge-integration.md                          # Import Forge servers
│   │   ├── api-reference.md                              # API tokens and endpoints
│   │   └── octane-note.md                                # When Octane makes Envoyer unnecessary
│   ├── deployer/
│   │   ├── index.md                                      # Deployer overview, installation
│   │   ├── deploy-php-reference.md                       # deploy.php/yml configuration reference
│   │   ├── laravel-recipe.md                             # Built-in Laravel recipe tasks
│   │   ├── zero-downtime-setup.md                        # Symlink-based atomic deployments
│   │   ├── rollback-strategies.md                        # Rollback mechanics and gotchas
│   │   ├── hooks-callbacks.md                            # Before/after deployment hooks
│   │   ├── multi-server-deploy.md                        # Parallel deployment to multiple hosts
│   │   ├── ci-integration.md                             # GitHub Actions, GitLab CI + Deployer
│   │   └── troubleshooting.md                            # Common issues and solutions
│   ├── zero-downtime-basics.md                           # Core concepts: blue/green, rolling, symlink swap
│   ├── blue-green-deploy.md                              # Blue-green pattern for Laravel
│   ├── canary-deploy.md                                  # Canary releases, traffic splitting
│   ├── rollback-strategies.md                            # Database + code rollback patterns
│   └── deploy-scripts/                                   # Reusable shell scripts
│       ├── zero-downtime.sh
│       ├── rollback.sh
│       └── health-check.sh
│
├── 03-ci-cd-pipelines/
│   ├── README.md                                         # CI/CD concepts for Laravel
│   ├── github-actions/
│   │   ├── index.md                                      # GitHub Actions overview for Laravel
│   │   ├── ci-testing.md                                 # Lint (Pint) + test (Pest/PHPUnit) + static analysis
│   │   ├── docker-build-push.md                          # Build and push images to GHCR/ECR
│   │   ├── deploy.yml                                    # Deploy to Forge, Envoyer, Vapor, Fly.io
│   │   ├── matrix-testing.md                             # PHP version + dependency matrix
│   │   ├── cache-strategies.md                           # Composer + npm cache optimization
│   │   ├── secrets-management.md                         # Encrypted secrets per environment
│   │   ├── reusable-workflows.md                         # DRY workflow composition
│   │   ├── fly-io-integration.md                         # superfly/flyctl-actions usage
│   │   └── templates/                                    # Ready-to-use YAML
│   │       ├── laravel-ci.yml
│   │       ├── laravel-deploy-forge.yml
│   │       ├── laravel-deploy-vapor.yml
│   │       └── laravel-deploy-flyio.yml
│   ├── gitlab-ci/
│   │   ├── index.md                                      # GitLab CI overview for Laravel
│   │   ├── gitlab-ci-yml.md                              # Multi-stage pipeline definition
│   │   ├── docker-executor.md                            # DIND for Docker builds
│   │   ├── deploy-to-forge.md                            # Forge API deploy via GitLab
│   │   ├── deploy-to-ecs.md                              # ECS deploy via GitLab
│   │   └── templates/
│   │       └── .gitlab-ci.yml
│   ├── jenkins/
│   │   ├── index.md                                      # Jenkins setup for Laravel
│   │   ├── pipeline-as-code.md                           # Jenkinsfile for Laravel
│   │   ├── php-plugin.md                                 # PHP plugin, Composer integration
│   │   └── templates/
│   │       └── Jenkinsfile
│   ├── bitbucket-pipelines/
│   │   ├── index.md                                      # Bitbucket Pipelines for Laravel
│   │   └── bitbucket-pipelines.yml.md                    # Pipeline reference
│   └── buddy-works/
│       └── index.md                                      # Buddy.works visual CI/CD
│
├── 04-docker-containerization/
│   ├── README.md                                         # Docker for Laravel overview
│   ├── laravel-sail/
│   │   ├── index.md                                      # Sail overview, installation
│   │   ├── installation-setup.md                         # New + existing project setup
│   │   ├── docker-compose-yml.md                         # Service definitions reference
│   │   ├── services.md                                   # MySQL, PostgreSQL, Redis, Meilisearch, etc.
│   │   ├── php-versions.md                               # 8.0 through 8.4 runtime switching
│   │   ├── customization.md                              # Publishing Dockerfiles, custom images
│   │   ├── devcontainer.md                               # VS Code Devcontainer support
│   │   ├── xdebug.md                                     # Debug configuration
│   │   ├── share-tunnel.md                               # Expose local site publicly
│   │   └── production-considerations.md                  # Sail vs production Docker
│   ├── production-docker/
│   │   ├── index.md                                      # Production Dockerfile patterns
│   │   ├── multi-stage-builds.md                         # Build stage (composer) + runtime (FPM)
│   │   ├── nginx-container.md                            # Nginx + FPM separate containers
│   │   ├── frankenphp-container.md                       # Single-binary FrankenPHP Dockerfile
│   │   ├── octane-docker.md                              # Octane + FrankenPHP/RoadRunner in Docker
│   │   ├── docker-compose-prod.md                        # Production compose (app + db + redis + queue)
│   │   ├── image-optimization.md                         # .dockerignore, layer caching, base images
│   │   ├── health-checks.md                              # Docker HEALTHCHECK for Laravel
│   │   ├── supervisor-docker.md                          # Running queue workers in containers
│   │   ├── cron-docker.md                                # Scheduler container pattern
│   │   ├── logging-docker.md                             # stdout/stderr logging, log drivers
│   │   └── dockerfiles/                                  # Reference Dockerfiles
│   │       ├── php84-fpm.Dockerfile
│   │       ├── frankenphp.Dockerfile
│   │       ├── nginx.Dockerfile
│   │       └── worker.Dockerfile
│   └── registry-deployment.md                            # Pushing to ECR, GHCR, Docker Hub
│
├── 05-kubernetes-orchestration/
│   ├── README.md                                         # K8s for Laravel overview
│   ├── architecture.md                                   # Pod design: sidecar vs single container
│   ├── manifests/
│   │   ├── deployment-php-fpm.yaml                       # PHP-FPM + Nginx sidecar pattern
│   │   ├── deployment-frankenphp.yaml                    # FrankenPHP single-binary pattern
│   │   ├── deployment-queue.yaml                         # Queue worker deployment
│   │   ├── cronjob-scheduler.yaml                        # Laravel scheduler CronJob
│   │   ├── service.yaml                                  # ClusterIP + LoadBalancer services
│   │   ├── ingress.yaml                                  # Nginx Ingress + TLS configuration
│   │   ├── configmap.yaml                                # Laravel config (non-secret)
│   │   ├── secrets.yaml                                  # Env secrets (Base64, External Secrets operator)
│   │   ├── hpa.yaml                                      # Horizontal Pod Autoscaler
│   │   ├── pvc.yaml                                      # Persistent storage for logs/uploads
│   │   ├── network-policy.yaml                           # Pod-level network security
│   │   └── service-monitor.yaml                          # Prometheus operator ServiceMonitor
│   ├── helm/
│   │   ├── index.md                                      # Helm chart structure for Laravel
│   │   ├── chart/
│   │   │   ├── Chart.yaml
│   │   │   ├── values.yaml
│   │   │   └── templates/
│   │   │       ├── _helpers.tpl
│   │   │       ├── deployment.yaml
│   │   │       ├── service.yaml
│   │   │       ├── ingress.yaml
│   │   │       ├── hpa.yaml
│   │   │       └── configmap.yaml
│   │   └── deployment-scenarios.md                       # Staging/prod values overrides
│   ├── keda-autoscaling.md                               # KEDA + Laravel queue scaling
│   ├── service-mesh.md                                   # Istio canary, traffic split
│   ├── logging-monitoring.md                             # Promtail, Loki, Grafana stack
│   └── managed-kubernetes/
│       ├── eks.md
│       ├── gke.md
│       ├── aks.md
│       ├── doks.md
│       └── k3s.md
│
├── 06-serverless-laravel/
│   ├── README.md                                         # Serverless Laravel overview
│   ├── laravel-vapor/
│   │   ├── index.md                                      # Vapor overview, architecture
│   │   ├── getting-started.md                            # Account, CLI install, vapor-core package
│   │   ├── vapor-yml-reference.md                        # Full configuration file spec
│   │   ├── deploy-command.md                             # vapor deploy flags, behaviors
│   │   ├── environments.md                               # Staging/production separation
│   │   ├── databases.md                                  # RDS provisioning, scaling, tunneling
│   │   ├── caches.md                                     # ElastiCache Redis cluster management
│   │   ├── queues.md                                     # SQS queue integration
│   │   ├── cron.md                                       # EventBridge scheduler
│   │   ├── assets-cdn.md                                 # CloudFront CDN for static assets
│   │   ├── custom-domains.md                             # DNS, SSL certificates
│   │   ├── networks.md                                   # VPC configuration, subnets
│   │   ├── security.md                                   # Firewalls, WAF, security groups
│   │   ├── secrets.md                                    # Environment variable + secret management
│   │   ├── rollbacks.md                                  # Deploy rollback workflows
│   │   ├── ci-integration.md                             # Vapor in CI/CD pipelines
│   │   ├── monitoring-metrics.md                         # Vapor dashboard, CloudWatch
│   │   ├── cost-management.md                            # Budget alerts, provisioned concurrency
│   │   ├── team-collaboration.md                         # Teams, permissions, collaborators
│   │   ├── troubleshooting.md                            # Common Vapor errors and solutions
│   │   └── migration-to-cloud.md                         # Moving from Vapor to Laravel Cloud
│   ├── laravel-cloud/
│   │   ├── index.md                                      # Cloud overview vs Vapor
│   │   ├── migration-from-vapor.md                       # Step-by-step migration guide
│   │   ├── new-projects.md                               # Starting fresh on Cloud
│   │   └── comparison.md                                 # Feature comparison table
│   ├── bref/
│   │   ├── index.md                                      # Bref overview for Laravel
│   │   ├── installation.md                               # Bref + serverless-laravel package
│   │   ├── serverless-yml.md                             # Configuration reference
│   │   ├── lambda-runtime.md                             # Custom runtime layers
│   │   ├── sqs-integration.md                            # Queue workers with SQS
│   │   ├── api-gateway.md                                # HTTP API vs REST API
│   │   ├── ci-cd.md                                      # Deploying Bref via GitHub Actions
│   │   └── vapor-vs-bref.md                              # Managed vs DIY comparison
│   └── serverless-patterns.md                            # Cold start mitigation, warmers
│
├── 07-infrastructure-as-code/
│   ├── README.md                                         # IaC for Laravel overview
│   ├── terraform/
│   │   ├── index.md                                      # Terraform overview, installation
│   │   ├── laravel-aws-modules.md                        # VPC, RDS, ElastiCache, ECS, S3
│   │   ├── ec2-provisioning.md                           # Single-server setup with Terraform
│   │   ├── ecs-fargate.md                                # ECS + Fargate for Laravel
│   │   ├── rds.md                                        # Database instance + replication
│   │   ├── elasticache.md                                # Redis cluster
│   │   ├── s3-cloudfront.md                              # Asset storage + CDN
│   │   ├── state-management.md                           # S3 + DynamoDB locking
│   │   ├── multi-environment.md                          # Workspaces, dir layout
│   │   ├── modules/                                      # Reusable modules
│   │   │   ├── laravel-vpc/
│   │   │   │   ├── main.tf
│   │   │   │   ├── outputs.tf
│   │   │   │   └── variables.tf
│   │   │   ├── laravel-rds/
│   │   │   │   └── ...
│   │   │   └── laravel-ecs/
│   │   │       └── ...
│   │   └── environments/
│   │       ├── dev/main.tf
│   │       ├── staging/main.tf
│   │       └── prod/main.tf
│   ├── pulumi/
│   │   ├── index.md                                      # Pulumi overview vs Terraform
│   │   ├── typescript-setup.md                           # Laravel infra in TypeScript
│   │   ├── component-resources.md                        # Reusable Pulumi components
│   │   └── state-backend.md                              # Pulumi Cloud, S3, self-managed
│   ├── aws-cdk/
│   │   ├── index.md                                      # CDK for Laravel on AWS
│   │   ├── stacks.md                                     # Stack composition
│   │   └── constructs.md                                 # Reusable constructs
│   └── ansible/
│       ├── index.md                                      # Ansible for Laravel provisioning
│       ├── playbooks/
│       │   ├── laravel-server.yml
│       │   ├── php-fpm.yml
│       │   ├── nginx.yml
│       │   └── redis.yml
│       └── roles/
│           ├── php/
│           ├── nginx/
│           ├── mysql/
│           ├── redis/
│           └── supervisor/
│
├── 08-environment-secrets-management/
│   ├── README.md                                         # Environment management overview
│   ├── dotenv-practices.md                               # .env file conventions, .env.example
│   ├── vapor-env.md                                      # vapor env:pull, env:push
│   ├── forge-env.md                                      # Managing env via Forge dashboard
│   ├── doppler.md                                        # Doppler integration for Laravel
│   ├── aws-secrets-manager.md                            # Secrets rotation, IAM access
│   ├── hashicorp-vault.md                                # Vault agent sidecar pattern
│   ├── github-environments.md                            # GitHub Environments + secrets
│   ├── gitlab-variables.md                               # GitLab CI variable scoping
│   └── branch-environments.md                            # Per-branch environment strategies
│
├── 09-database-deployment/
│   ├── README.md                                         # DB migration in deployment
│   ├── migrations-in-ci.md                               # Running migrations during deploy
│   ├── zero-downtime-migrations.md                       # Safe schema changes
│   ├── rollback-strategies.md                            # Forward vs rollback migrations
│   ├── read-replicas.md                                  # Configuration + deployment
│   ├── seeding-production.md                             # Safe seed patterns
│   └── multi-db-migrations.md                            # Multiple connection deployments
│
├── 10-observability-monitoring/
│   ├── README.md                                         # Observability for Laravel
│   ├── laravel-nightwatch/
│   │   ├── index.md                                      # Setup, configuration
│   │   └── deployment-alerts.md                          # Alerting rules
│   ├── laravel-pulse/
│   │   ├── index.md                                      # Installation, dashboard
│   │   └── custom-recorders.md                           # Building custom Pulse recorders
│   ├── laravel-telescope/
│   │   ├── index.md                                      # Setup, production concerns
│   │   └── production-auth.md                            # Gate authorization
│   ├── sentry.md                                         # Exception + performance tracking
│   ├── flare.md                                          # Ignition error tracking
│   ├── datadog-apm.md                                    # APM setup, custom tracing
│   ├── new-relic.md                                      # Agent + custom instrumentation
│   ├── prometheus-grafana.md                             # Custom metrics, pre-built dashboards
│   ├── server-uptime.md                                  # Oh Dear!, UptimeRobot, BetterUptime
│   └── logging-practices.md                              # Structured logging, log levels, aggregation
│
├── 11-hosting-platforms/
│   ├── README.md                                         # Platform comparisons
│   ├── fly-io/
│   │   ├── index.md                                      # Fly.io overview for Laravel
│   │   ├── getting-started.md                            # fly launch, deploy flow
│   │   ├── dockerfile.md                                 # Generated Dockerfile structure
│   │   ├── fly-toml.md                                   # Configuration reference
│   │   ├── databases.md                                  # MySQL, PostgreSQL, SQLite via LiteFS
│   │   ├── redis.md                                      # Upstash Redis integration
│   │   ├── storage.md                                    # Fly Volumes, Tigris S3-compatible
│   │   ├── cron-queues.md                                # Scheduler + queue worker setup
│   │   ├── ci-cd.md                                      # GitHub Actions auto-deploy
│   │   ├── global-regions.md                             # Multi-region deployment
│   │   ├── php-node-versions.md                          # Runtime configuration
│   │   ├── custom-dockerfile.md                          # Manual Dockerfile customization
│   │   └── scaling.md                                    # Machine sizing, auto-scaling
│   ├── railway/
│   │   ├── index.md                                      # Railway overview for Laravel
│   │   ├── getting-started.md                            # One-click, GitHub, CLI deploy
│   │   ├── monolith-architecture.md                      # App + Cron + Worker + DB setup
│   │   ├── custom-scripts.md                             # Railway init, worker, cron scripts
│   │   ├── database.md                                   # Postgres provisioning, migrations
│   │   ├── networking.md                                 # Public domains, private networking
│   │   └── logging.md                                    # stderr logging configuration
│   ├── platform-sh/
│   │   ├── index.md                                      # Platform.sh overview
│   │   ├── platform-yaml.md                              # .platform.app.yaml reference
│   │   ├── routes-yaml.md                                # Route configuration
│   │   ├── services-yaml.md                              # DB, Redis configuration
│   │   ├── multi-env.md                                  # Branch-based environments
│   │   └── artisan-commands.md                           # Post-deploy hooks
│   ├── digitalocean-app-platform.md                      # Buildpack deploy, static assets
│   ├── aws-self-managed/
│   │   ├── architecture.md                               # EC2 + RDS + ElastiCache + ALB
│   │   ├── reference-architecture.md                     # Diagram and component list
│   │   ├── ecs-fargate.md                                # Container-native AWS deployment
│   │   └── ec2-autoscaling.md                            # ASG + ALB setup
│   ├── vultr.md                                          # Vultr-specific patterns
│   ├── hetzner.md                                        # Hetzner-specific patterns
│   └── comparisons.md                                    # Feature/cost/practicality matrix
│
├── 12-laravel-octane-performance/
│   ├── README.md                                         # Octane in production
│   ├── frankenphp-production.md                          # FrankenPHP as app server
│   ├── roadrunner-production.md                          # RoadRunner configuration
│   ├── swoole-production.md                              # Swoole tuning
│   ├── nginx-reverse-proxy.md                            # Nginx + Octane (all servers)
│   ├── worker-management.md                              # Count, max-requests, memory limits
│   ├── graceful-reload.md                                # octane:reload in CI/CD
│   ├── memory-leak-detection.md                          # Pre/post deployment memory check
│   └── cache-octane.md                                   # Octane cache driver (Swoole tables)
│
├── 13-security-hardening/
│   ├── README.md                                         # Security in deployment
│   ├── app-debug.md                                      # Enforcing APP_DEBUG=false
│   ├── file-permissions.md                               # storage, bootstrap/cache
│   ├── nginx-security.md                                 # Block sensitive paths, rate limiting
│   ├── ssl-certificates.md                               # Let's Encrypt, Forge SSL, cert renewal
│   ├── waf.md                                            # Web Application Firewall (Cloudflare, AWS WAF)
│   ├── dos-protection.md                                 # Rate limiting, CDN DDoS protection
│   └── secret-rotation.md                                # Key rotation, credential cycling
│
├── 14-backup-disaster-recovery/
│   ├── README.md                                         # Backup strategies
│   ├── database-backups.md                               # Automated DB snapshots
│   ├── file-backups.md                                   # Storage backups (S3, volumes)
│   ├── disaster-recovery-plan.md                         # RTO/RPO, failover procedures
│   └── restore-testing.md                                # Regular restore drills
│
└── shared/
    ├── docker-compose-templates/                         # Reusable docker-compose files
    │   ├── dev.yml
    │   ├── prod.yml
    │   └── ci.yml
    ├── nginx-templates/
    │   ├── laravel.conf
    │   ├── laravel-octane.conf
    │   └── security-headers.conf
    ├── supervisor-configs/
    │   ├── horizon.conf
    │   └── queue-worker.conf
    ├── scripts/
    │   ├── deploy.sh
    │   ├── rollback.sh
    │   ├── health-check.sh
    │   └── optimize.sh
    └── monitoring-dashboards/
        ├── laravel-overview.json                          # Grafana dashboard JSON
        └── prometheus-rules.yml                           # Alerting rules
```
