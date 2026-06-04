# Folder Architecture: Cost & Resource Optimization Engineering

```
cost-resource-optimization/
│
├── README.md                                        # Domain overview, scope, quick-start guide
│
├── domain-analysis.md                               # Comprehensive domain discovery (this file)
│
├── 01-compute-optimization/
│   ├── overview.md                                  # Compute strategy: EC2 vs Lambda vs Fargate
│   ├── ec2-right-sizing.md                          # Instance selection, Graviton migration
│   ├── lambda-cost.md                               # Lambda pricing, cold start mitigation costs
│   ├── fargate-vs-ec2.md                            # Comparison matrix, cost breakeven analysis
│   ├── octane-frankenphp.md                         # Laravel Octane cost-per-request analysis
│   ├── graviton-benchmarks.md                       # ARM vs x86 price-performance for Laravel
│   └── autoscaling-strategies.md                    # Horizontal, vertical, predictive, scheduled
│
├── 02-database-cost-optimization/
│   ├── overview.md                                  # Database cost landscape for Laravel
│   ├── rds-provisioned-sizing.md                    # Instance selection, Multi-AZ tradeoffs
│   ├── aurora-serverless-v2.md                      # ACU tuning, breakeven analysis, platform versions
│   ├── neon-serverless-pg.md                        # Neon vs Aurora vs Supabase comparison
│   ├── read-replicas-cost.md                        # Replica strategy: provisioned vs serverless
│   ├── reserved-vs-serverless.md                    # When to commit vs when to pay-per-use
│   ├── connection-pooling.md                        # RDS Proxy vs PgBouncer vs Laravel native
│   ├── storage-i-o-costs.md                         # I/O-Optimized vs Standard, storage auto-scaling
│   └── multi-az-failover-cost.md                    # HA cost tradeoffs
│
├── 03-queue-worker-optimization/
│   ├── overview.md                                  # Queue cost landscape: SQS vs Redis vs RabbitMQ
│   ├── sqs-cost-deep-dive.md                        # Batching, long polling, 64KB rules, idle queues
│   ├── redis-queue-cost.md                          # Redis memory for queues, Horizon cost analysis
│   ├── rabbitmq-self-hosted.md                      # EC2 vs EKS cost, case study ($6K->$2.8K)
│   ├── kafka-msk-cost.md                            # MSK minimum costs, breakeven vs SQS
│   ├── worker-scaling.md                            # KEDA, queue-depth autoscaling, Fargate Spot
│   ├── laravel-horizon-cost.md                      # Horizon overhead, supervisor tuning
│   └── batch-processing-optimization.md             # Batch sizing, visibility timeout tuning
│
├── 04-cache-layer-optimization/
│   ├── overview.md                                  # Redis/Memcached cost strategies
│   ├── redis-memory-optimization.md                 # Hashes vs strings, compression, listpack
│   ├── elasticache-sizing.md                        # Node selection, Graviton, cluster mode
│   ├── cache-hit-ratio.md                           # Monitoring, improvement strategies
│   ├── ttl-eviction-policies.md                     # maxmemory-policy, key expiration
│   ├── stampede-prevention.md                       # Atomic locks, probabilistic expiration
│   ├── cache-tags-strategy.md                       # Laravel cache tags for efficient invalidation
│   └── multi-purpose-redis.md                       # Shared Redis: cache + queue + sessions
│
├── 05-cdn-storage-optimization/
│   ├── overview.md                                  # CDN and storage cost landscape
│   ├── cloudfront-vs-direct-s3.md                   # Always-cheaper analysis, free tier math
│   ├── cloudfront-configuration.md                  # Price classes, Origin Shield, compression
│   ├── s3-lifecycle-policies.md                     # Transition rules, Intelligent-Tiering
│   ├── cloudflare-r2.md                             # Zero egress fees, Laravel Cloud integration
│   ├── data-transfer-costs.md                       # VPC endpoints, cross-region minimization
│   ├── asset-versioning.md                          # Cache busting vs invalidation costs
│   └── multi-region-storage.md                      # Cross-region replication cost analysis
│
├── 06-commitment-optimization/
│   ├── overview.md                                  # Commitment instruments landscape
│   ├── compute-savings-plans.md                     # 66% off, flexible across all compute
│   ├── ec2-instance-savings-plans.md                # 72% off, locked to instance family
│   ├── database-savings-plans.md                    # RDS/Aurora commitment (2025+)
│   ├── reserved-instances.md                        # Legacy — capacity reservation only
│   ├── spot-instances.md                            # 90% off, interruption risks, right workloads
│   ├── commitment-strategy.md                       # Floor vs ceiling, layering strategy
│   └── ri-vs-sp-decision.md                         # Decision matrix with examples
│
├── 07-monitoring-observability-cost/
│   ├── overview.md                                  # Monitoring cost landscape
│   ├── cloudwatch-cost.md                           # Free tier, log pricing traps
│   ├── datadog-cost.md                              # Per-host pricing, custom metric cardinality
│   ├── new-relic-cost.md                            # Per-GB ingested, free tier 100GB
│   ├── grafana-prometheus.md                        # Open-source, Grafana Cloud pricing
│   ├── scout-apm.md                                 # Laravel-specific, $39-299/month flat
│   ├── vendor-comparison.md                         # Feature vs cost matrix at 3 scale levels
│   ├── log-retention-strategy.md                    # Sampling, filtering, retention tiers
│   └── budget-alerts.md                             # AWS Budgets, cost anomaly detection
│
├── 08-network-cost-optimization/
│   ├── overview.md                                  # Network cost landscape
│   ├── vpc-endpoints.md                             # S3, DynamoDB gateway endpoints
│   ├── nat-gateway-alternatives.md                  # NAT instances, private link
│   ├── cross-az-minimization.md                     # Colocate resources in same AZ
│   ├── data-transfer-pricing.md                     # Ingress/egress, regional variance
│   └── multi-region-networking.md                   # Transit Gateway, VPC peering costs
│
├── 09-server-sizing-autoscaling/
│   ├── overview.md                                  # Sizing methodology for Laravel
│   ├── cpu-memory-baselines.md                      # Typical Laravel profiles per user count
│   ├── octane-swoole-sizing.md                      # Octane-specific CPU/memory patterns
│   ├── queue-worker-sizing.md                       # Worker count, memory limits, concurrency
│   ├── scaling-policies.md                          # CPU, memory, request count, custom metrics
│   ├── scheduled-scaling.md                         # 50-70% off-hours staging savings
│   ├── predictive-scaling.md                        # ML-based forecasting for cyclical patterns
│   └── load-testing-budgets.md                      # Cost-aware capacity planning
│
├── 10-multi-region-global-cost/
│   ├── overview.md                                  # Global architecture cost drivers
│   ├── active-passive.md                            # Lower cost than active-active
│   ├── aurora-global-database.md                    # Storage replication, serverless DR readers
│   ├── cloudfront-global.md                         # Regional edge caching strategies
│   ├── data-transfer-costs.md                       # Cross-region egress minimization
│   └── compliance-residency-cost.md                 # Data sovereignty: region selection
│
├── 11-laravel-cloud-platform-cost/
│   ├── overview.md                                  # Laravel Cloud pricing deep-dive
│   ├── cloud-vs-vapor.md                            # 30-50% savings case studies
│   ├── cloud-vs-forge.md                            # TCO comparison: managed vs self-managed
│   ├── scale-to-zero.md                             # Flex compute, 500ms wake, $5 Starter plan
│   ├── private-cloud-cost.md                        # Dedicated K8s cluster, VPC peering costs
│   ├── spending-limits.md                           # Hard monthly ceilings, alerts at 50/75/90%
│   └── migration-cost-analysis.md                   # Vapor/Forge->Cloud migration TCO
│
├── 12-tools-automation/
│   ├── overview.md                                  # Tooling for cost optimization
│   ├── aws-cost-explorer.md                         # Native cost analysis
│   ├── compute-optimizer.md                         # Right-sizing recommendations
│   ├── aws-pricing-calculator.md                    # Pre-deployment cost modeling
│   ├── terraform-cost-estimation.md                 # Infra-as-code cost validation
│   ├── prometheus-grafana-cost.md                   # Open-source monitoring stack
│   ├── keda-autoscaling.md                          # Event-driven autoscaling for queues
│   └── cost-anomaly-detection.md                    # ML-based spend alerts
│
├── templates/
│   ├── cost-model-spreadsheet.md                    # Monthly cost modeling template
│   ├── ri-sp-calculator.md                          # Commitment discount decision tool
│   ├── migration-tco-template.md                    # Platform migration cost analysis
│   └── monitoring-budget-template.md                # Observability cost allocation
│
└── references/
    ├── aws-pricing-links.md                         # Curated pricing page URLs (2026)
    ├── calculators.md                               # Online cost calculator tools
    ├── case-studies.md                              # Summaries of real-world savings
    └── glossary.md                                  # Domain terminology definitions
```

## Architecture Notes

### Directory Depth Rationale
- **Top-level folders** (01-12) map to distinct subdomains with independent decision-making processes
- **Two levels of nesting maximum**: keeps navigation flat and discoverable
- **Separate platform folder** (11): Laravel Cloud pricing is distinct enough from raw AWS to warrant its own analysis
- **Separate tools folder** (12): cross-cutting cost tooling used across all subdomains

### File Naming Convention
- `kebab-case.md` for all files
- Leading numbers for ordered reading sequence
- Descriptive rather than cryptic names (e.g., `aurora-serverless-v2.md` not `asv2.md`)
- `overview.md` in each folder for context and navigation

### Intended Audience
- **DevOps/SRE engineers**: Focus on folders 01, 02, 06, 09
- **Laravel developers**: Focus on folders 03, 04, 05, 11
- **Engineering managers**: Focus on overview files, case studies, templates
- **FinOps practitioners**: Focus on folders 06, 07, 10, 12

### Cross-Cutting Concerns
- Cost anomaly detection spans all folders — referenced in each overview
- Commitment optimization (06) applies to compute (01), database (02), and queue (03) infrastructure
- Monitoring costs (07) affect all decisions — every other folder references monitoring strategy
- Migration TCO tools in 11/templates apply whenever changing compute/database/queue providers
