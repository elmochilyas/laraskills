# Folder Architecture: Observability & Production Intelligence

```
observability-production-intelligence/
│
├── domain-analysis.md                              ← This document
│
├── 01-logging/
│   ├── README.md                                    # Logging in Laravel: Monolog, channels, levels
│   ├── structured-logging/
│   │   ├── json-formatting.md                       # JSON formatters for Monolog
│   │   ├── contextual-enrichment.md                 # User/request/trace context attachment
│   │   └── field-naming-conventions.md              # Standardized field names across services
│   ├── channel-configuration/
│   │   ├── stack-channels.md                        # Multi-channel stack setup
│   │   ├── custom-monolog-handlers.md               # Building custom handlers
│   │   └── per-environment-logging.md               # Environment-specific config
│   ├── log-levels/
│   │   ├── rfc-5424-reference.md                    # Log level semantics
│   │   └── when-to-use-each-level.md                # Decision matrix for log levels
│   ├── pii-redaction/
│   │   ├── sensitive-data-filtering.md              # Log sanitization strategies
│   │   └── gdpr-compliance-logging.md               # Legal considerations
│   ├── log-aggregation/
│   │   ├── elk-stack-setup.md                       # Elasticsearch, Logstash, Kibana
│   │   ├── loki-grafana-setup.md                    # Grafana Loki for log aggregation
│   │   ├── datadog-logs.md                          # Datadog log ingestion
│   │   └── log-sampling.md                          # Dynamic sampling strategies
│   └── cli-tools/
│       ├── laravel-pail.md                          # Laravel Pail CLI log viewer
│       └── tail-log-monitoring.md                   # Production log tailing patterns
│
├── 02-error-tracking/
│   ├── README.md                                    # Error tracking landscape in Laravel
│   ├── sentry/
│   │   ├── installation-configuration.md            # sentry/sentry-laravel setup
│   │   ├── performance-monitoring.md                # Sentry Performance / tracing
│   │   ├── release-tracking.md                      # Release health, regressions
│   │   ├── source-maps.md                           # Source map upload for JS errors
│   │   └── sentry-self-hosting.md                   # Self-hosted Sentry (onpremise)
│   ├── flare/
│   │   ├── installation-configuration.md            # Flare Laravel integration
│   │   └── deep-laravel-integration.md              # Flare-specific Laravel context
│   ├── bugsnag/
│   │   ├── installation-configuration.md            # Bugsnag Laravel SDK
│   │   └── mobile-error-tracking.md                 # Bugsnag mobile-first features
│   ├── rollbar/
│   │   ├── installation-configuration.md            # Rollbar Laravel integration
│   │   └── ai-assisted-triage.md                    # Rollbar AI grouping features
│   ├── honeybadger/
│   │   ├── installation-configuration.md            # Honeybadger for Laravel
│   │   └── bundled-monitoring.md                    # Uptime + cron + errors bundle
│   ├── error-tracking-comparison.md                 # Decision matrix: Sentry vs Flare vs Bugsnag vs Rollbar vs Honeybadger
│   ├── custom-error-handler.md                      # Building a PSR-14 event-driven error pipeline
│   └── alerting/
│       ├── slack-notifications.md                   # Slack webhook integration
│       ├── pagerduty-integration.md                 # PagerDuty Events API
│       ├── opsgenie-integration.md                  # OpsGenie alert routing
│       ├── email-notifications.md                   # Laravel mail notifications
│       └── alert-fatigue-management.md              # Graduated alerting, deduplication
│
├── 03-apm-performance-monitoring/
│   ├── README.md                                    # APM in Laravel: tools and strategies
│   ├── laravel-pulse/
│   │   ├── installation-configuration.md            # Pulse setup, middleware, auth
│   │   ├── recorders/
│   │   │   ├── slow-queries.md                      # SlowQueries recorder configuration
│   │   │   ├── exceptions.md                        # Exceptions recorder
│   │   │   ├── slow-requests.md                     # SlowRequests recorder
│   │   │   ├── slow-jobs.md                         # SlowJobs/queue recorder
│   │   │   ├── cache-interactions.md                # Cache hit/miss tracking
│   │   │   └── user-requests.md                     # User activity tracking
│   │   ├── custom-cards.md                          # Building custom Pulse dashboard cards
│   │   ├── multi-server-pulse.md                    # Pulse for multi-server deployments
│   │   └── performance-tuning.md                    # Pulse DB configuration, sampling, trimming
│   ├── laravel-telescope/
│   │   ├── installation-configuration.md            # Telescope setup, local-only config
│   │   ├── watchers/
│   │   │   ├── request-watcher.md                   # Request inspection
│   │   │   ├── query-watcher.md                     # Database query debugging
│   │   │   ├── exception-watcher.md                 # Exception capture
│   │   │   ├── job-watcher.md                       # Queue job inspection
│   │   │   ├── mail-watcher.md                      # Mail debugging
│   │   │   ├── cache-watcher.md                     # Cache operation tracking
│   │   │   └── event-watcher.md                     # Event debugging
│   │   ├── tagging-monitoring.md                    # User/entity tagging for targeted monitoring
│   │   ├── filtering.md                             # Entry type/batch filtering
│   │   └── pruning.md                               # Data pruning strategies
│   ├── laravel-nightwatch/
│   │   ├── installation-configuration.md            # Nightwatch agent setup
│   │   ├── event-types.md                           # Requests, jobs, queries, cache, etc.
│   │   ├── dashboard-guide.md                       # Nightwatch UI navigation
│   │   ├── smart-alerts.md                          # Nightwatch alert configuration
│   │   ├── multi-environment.md                     # Managing multiple envs/apps
│   │   └── pricing-events.md                        # Understanding event-based pricing
│   ├── apm-comparison.md                            # Nightwatch vs Pulse vs Telescope decision matrix
│   ├── vendor-apm-tools/
│   │   ├── scout-apm.md                             # Scout APM Laravel (Laravel-first)
│   │   ├── new-relic.md                             # New Relic PHP agent for Laravel
│   │   ├── datadog-apm.md                           # Datadog tracing for Laravel
│   │   ├── blackfire-profiling.md                   # Blackfire deep profiling
│   │   └── apm-cost-comparison.md                   # Pricing analysis with event volume scenarios
│   └── queue-monitoring/
│       ├── horizon-dashboard.md                     # Laravel Horizon metrics
│       ├── queue-throughput-analysis.md             # Job processing rates, backpressure
│       └── failed-job-alerting.md                   # Failed job notification patterns
│
├── 04-distributed-tracing/
│   ├── README.md                                    # Distributed tracing: why and how
│   ├── opentelemetry/
│   │   ├── php-sdk-installation.md                  # OTel PHP SDK via Composer
│   │   ├── php-extension-setup.md                   # OTel PHP extension (PECL) for auto-instrumentation
│   │   ├── tracer-configuration.md                  # TracerProvider setup
│   │   ├── span-management.md                       # Creating, ending, and attributing spans
│   │   ├── context-propagation.md                   # W3C TraceContext, baggage
│   │   ├── auto-instrumentation/
│   │   │   ├── laravel-auto-instrumentation.md      # open-telemetry/opentelemetry-auto-laravel
│   │   │   ├── pdo-auto-instrumentation.md          # Database query tracing
│   │   │   ├── http-client-instrumentation.md       # Outgoing HTTP request tracing
│   │   │   └── custom-hooks.md                      # PHP function hooks for custom tracing
│   │   ├── community-packages/
│   │   │   ├── keepsuit-laravel-opentelemetry.md    # keepsuit/laravel-opentelemetry
│   │   │   └── overtrue-laravel-opentelemetry.md    # overtrue/laravel-open-telemetry
│   │   ├── otel-collector/
│   │   │   ├── installation-configuration.md        # OTel Collector deployment
│   │   │   ├── receivers.md                         # OTLP, Jaeger, Prometheus receivers
│   │   │   ├── processors.md                        # Batch, attributes, memory_limiter, tail sampling
│   │   │   ├── exporters.md                         # OTLP, Prometheus, Datadog, New Relic exporters
│   │   │   └── production-hardening.md              # Backpressure, retry, scaling
│   │   └── backends/
│   │       ├── jaeger-setup.md                      # Jaeger tracing backend
│   │       ├── grafana-tempo.md                     # Grafana Tempo for traces
│   │       ├── sigNoz-setup.md                      # Open-source observability platform
│   │       ├── uptrace-setup.md                     # Uptrace (OpenTelemetry-native APM)
│   │       └── oneuptime-setup.md                   # OneUptime observability platform
│   ├── cross-service-tracing/
│   │   ├── http-propagation.md                      # Trace context via HTTP headers
│   │   ├── queue-context-propagation.md             # Preserving trace context across jobs
│   │   └── polyglot-tracing.md                      # Tracing across PHP, Node, Go, Python services
│   ├── sampling/
│   │   ├── head-sampling.md                         # Decision at request start
│   │   ├── tail-sampling.md                         # Decision after request completes
│   │   └── sampler-configuration.md                 # ParentBased, TraceIdRatio, custom samplers
│   └── artisan-command-tracing.md                   # Instrumenting CLI commands with spans
│
├── 05-metrics-collection/
│   ├── README.md                                    # Metrics in Laravel: types and collection
│   ├── opentelemetry-metrics/
│   │   ├── meter-provider-setup.md                  # MeterProvider configuration
│   │   ├── instruments/
│   │   │   ├── counter.md                           # Counter instrument (monotonic)
│   │   │   ├── up-down-counter.md                   # UpDownCounter (non-monotonic)
│   │   │   ├── histogram.md                         # Histogram for latency distributions
│   │   │   ├── observable-counter.md                # Async counter via callback
│   │   │   ├── observable-gauge.md                  # Async gauge (current value)
│   │   │   └── observable-up-down-counter.md        # Async non-monotonic counter
│   │   ├── aggregation-temporality.md               # Delta vs cumulative aggregation
│   │   └── metric-export.md                         # OTLP, Prometheus exposition, stdout
│   ├── prometheus/
│   │   ├── prometheus-exporter.md                   # Prometheus metrics endpoint for Laravel
│   │   ├── custom-laravel-metrics.md                # Business-specific Prometheus metrics
│   │   └── prometheus-querying.md                   # PromQL for Laravel metric analysis
│   ├── redis-metrics/
│   │   ├── custom-metrics-storage.md                # Using Redis for metric aggregation
│   │   └── real-time-counters.md                    # Atomic increment/decrement patterns
│   ├── red-metrics.md                               # Rate/Errors/Duration framework
│   ├── use-metrics.md                               # Utilization/Saturation/Errors framework
│   ├── custom-business-metrics.md                   # Orders processed, revenue, signups
│   └── high-cardinality-metrics.md                  # Managing metric cardinality
│
├── 06-health-checks/
│   ├── README.md                                    # Health checks: concepts and implementation
│   ├── built-in-health-endpoint/
│   │   ├── laravel-11-up-endpoint.md                # Laravel 11+ /up route
│   │   ├── diagnosing-health-event.md               # DiagnosingHealth event listener
│   │   └── extending-health-checks.md               # Adding custom checks to /up
│   ├── spatie-laravel-health/
│   │   ├── installation-configuration.md            # Package setup
│   │   ├── built-in-checks.md                       # CPU, Disk, DB, Redis, Debug, Env, Ping, etc.
│   │   ├── custom-checks.md                         # Creating custom health check classes
│   │   ├── result-stores.md                         # JSON file, database result storage
│   │   ├── notifications.md                         # Mail, Slack, Oh Dear integration
│   │   ├── result-viewer.md                         # Web UI for health status
│   │   └── throttling.md                            # Notification throttling configuration
│   ├── health-check-architecture/
│   │   ├── endpoint-design.md                       # REST health endpoint patterns
│   │   ├── dependency-modeling.md                   # Modeling service dependencies
│   │   ├── health-status-codes.md                   # 200 OK vs 503 degraded semantics
│   │   └── load-balancer-integration.md             # AWS ALB, GCP LB, Kubernetes probes
│   ├── checks/
│   │   ├── database-connectivity.md                 # DB connection check
│   │   ├── cache-connectivity.md                    # Redis/Memcached ping
│   │   ├── queue-worker-health.md                   # Horizon queue status
│   │   ├── storage-availability.md                  # Disk space, S3 accessibility
│   │   ├── external-api-reachability.md             # Third-party API health
│   │   └── scheduled-task-status.md                 # Last run time of scheduled tasks
│   └── uptime-monitoring/
│       ├── pingdom-setup.md                         # External uptime monitoring
│       ├── oh-dear-integration.md                   # Oh Dear monitoring service
│       └── custom-uptime-check.md                   # Cron-based uptime checker
│
├── 07-dashboards-visualization/
│   ├── README.md                                    # Dashboard design for Laravel operators
│   ├── pulse-dashboard/
│   │   ├── default-dashboard-cards.md               # Built-in Pulse cards usage
│   │   ├── custom-card-development.md               # Building custom Livewire cards
│   │   ├── card-data-capture.md                     # Capturing data for custom cards
│   │   └── dashboard-customization.md               # Layout, branding, filters
│   ├── nightwatch-dashboard/
│   │   ├── event-timeline.md                        # Request/job/query timelines
│   │   ├── grouping-and-filtering.md                # Event grouping patterns
│   │   └── custom-charts.md                         # Nightwatch chart configuration
│   ├── grafana/
│   │   ├── grafana-setup.md                         # Grafana instance configuration
│   │   ├── prometheus-datasource.md                 # Connecting Prometheus metrics
│   │   ├── loki-datasource.md                       # Connecting Loki logs
│   │   ├── tempo-datasource.md                      # Connecting Tempo traces
│   │   ├── laravel-dashboard-templates.md           # Reusable Laravel dashboards
│   │   └── alerting-in-grafana.md                   # Grafana alert rules
│   └── logging-dashboards/
│       ├── kibana-log-dashboards.md                 # Kibana for log visualization
│       ├── grafana-loki-explore.md                  # LogQL queries for Laravel
│       └── datadog-log-dashboards.md               # Datadog log analytics
│
├── 08-alerting-incident-response/
│   ├── README.md                                    # Alerting strategies and incident response
│   ├── alert-design/
│   │   ├── threshold-definition.md                  # Setting meaningful thresholds
│   │   ├── anomaly-detection.md                     # Statistical anomaly detection
│   │   ├── graduated-alerting.md                    # Warning → Critical → Page
│   │   └── alert-fatigue-prevention.md              # Rate limiting, deduplication, silencing
│   ├── notification-channels/
│   │   ├── laravel-notifications.md                # Laravel notification system
│   │   ├── slack-setup.md                           # Slack webhook + blocks
│   │   ├── pagerduty-setup.md                       # PagerDuty Events API v2
│   │   ├── opsgenie-setup.md                        # OpsGenie alert routing
│   │   ├── discord.md                               # Discord webhook integration
│   │   ├── telegram.md                              # Telegram bot integration
│   │   └── sms-voice.md                             # Twilio-based critical alerts
│   ├── on-call-management/
│   │   ├── escalation-policies.md                   # Tiered escalation design
│   │   ├── schedule-management.md                   # Rotation scheduling
│   │   └── incident-response-runbooks.md            # Standardized incident playbooks
│   └── postmortems/
│       ├── incident-documentation.md                # Structured postmortem format
│       └── action-item-tracking.md                  # From incident to improvement
│
├── 09-advanced-topics/
│   ├── README.md                                    # Advanced observability patterns
│   ├── ai-llm-observability/
│   │   ├── openai-tracing.md                        # Tracing OpenAI API calls
│   │   ├── token-usage-metrics.md                   # Token counting and cost tracking
│   │   ├── prompt-versioning.md                     # Prompt version tracking for debugging
│   │   └── otel-llm-semantic-conventions.md         # OpenTelemetry semantic conventions for LLM
│   ├── real-user-monitoring-rum/
│   │   ├── otel-rum-setup.md                        # OpenTelemetry RUM for web frontend
│   │   └── laravel-session-correlation.md           # Correlating RUM with backend traces
│   ├── synthetic-monitoring/
│   │   ├── playwright-health-smoke-tests.md         # Playwright-based synthetic checks
│   │   └── scheduled-synthetic-jobs.md              # Laravel job-based synthetic monitoring
│   ├── continuous-profiling/
│   │   ├── blackfire-continuous-profiling.md        # Blackfire profiling in production
│   │   └── otel-profiling-signal.md                 # OpenTelemetry profiling (experimental)
│   ├── multi-tenant-observability.md                # Isolating telemetry per tenant
│   ├── observability-cost-management.md             # Controlling data volume and cost
│   └── observability-as-code.md                     # Declarative config for dashboards, alerts, checks
│
├── 10-examples/
│   ├── README.md                                    # Complete runnable examples
│   ├── complete-logging-setup/
│   │   ├── config-logging.php                       # Production-ready logging config
│   │   └── context-enricher.php                     # Request context middleware
│   ├── health-check-setup/
│   │   ├── health-check-controller.php              # Custom health endpoint
│   │   └── spatie-health-registration.php           # Spatie health checks setup
│   ├── otel-tracing-example/
│   │   ├── OpenTelemetryServiceProvider.php          # OTel SDK service provider
│   │   ├── artisan-tracing.php                      # Artisan command instrumentation
│   │   └── docker-compose-collector.yml             # OTel Collector + Jaeger
│   ├── sentry-error-tracking/
│   │   ├── sentry-config.php                        # Sentry configuration
│   │   └── exception-handler-modifications.php       # Custom exception handler
│   ├── pulse-setup/
│   │   ├── pulse-config.php                         # Pulse recorder configuration
│   │   ├── pulse-auth.php                           # Dashboard authorization
│   │   └── custom-pulse-card/                       # Complete custom card example
│   ├── custom-metrics/
│   │   ├── business-metrics-middleware.php           # Request-level business metrics
│   │   └── prometheus-metrics-endpoint.php           # /metrics endpoint for Prometheus
│   └── docker-observability-stack/
│       ├── docker-compose.yml                       # Full OTel + Grafana + Loki + Tempo stack
│       ├── otel-collector-config.yml                 # Collector pipeline configuration
│       └── grafana-dashboards/                       # Pre-built Laravel dashboards
│
└── templates/
    ├── health-check-template.php                     # Reusable health check class template
    ├── custom-pulse-card-template.php                # Pulse card boilerplate
    ├── notification-channel-template.php             # Custom notification channel
    ├── monolog-handler-template.php                  # Custom Monolog handler
    ├── otel-span-template.php                        # Manual span creation pattern
    └── incident-response-runbook-template.md         # Postmortem/documentation template
```

## Architecture Decisions

### Why This Structure
- **Subdomain isolation**: Each major observability pillar (logging, error tracking, APM, tracing, metrics, health, dashboards, alerting) has its own directory, mirroring the domain decomposition
- **Tool under responsibility**: Tools like Sentry, Pulse, Telescope, and Nightwatch live under their respective subdomains (error tracking, APM), not in a flat vendor directory
- **Cross-cutting concerns**: Alerting is elevated to its own top-level directory because it spans all subdomains (alerts from logs, traces, metrics, and health checks all converge here)
- **Advanced topics separate**: AI/LLM observability, RUM, synthetic monitoring, and profiling are kept separate as emerging/niche areas
- **Executable examples**: A dedicated examples directory with runnable code mirrors the conceptual structure, providing concrete reference implementations
- **Templates**: Reusable boilerplate accelerates adoption and ensures consistency

### File Naming Convention
- Kebab-case for all files and directories
- Descriptive names that indicate content (e.g., `slow-queries.md` rather than `queries.md`)
- README.md in each directory provides overview and navigation
- Code examples in PHP use `.php` extension; config files use relevant extension (`.yml`, `.json`)
- Templates prefixed with descriptive action (`custom-pulse-card-template.php`)

### Relationship to Other Phase 1 Domains
This architecture is designed to be referenced by and integrate with other Phase 1 domain analyses:
- **Infrastructure & Deployment**: Health checks reference deployment probes; APM depends on infrastructure topology
- **Data Layer**: Database monitoring (query tracing, slow query analysis) and cache (hit rates, eviction) cross-reference from here
- **Queue & Job Architecture**: Queue monitoring (throughput, retries, failed jobs) is shared between this domain and queue architecture
- **Security**: PII redaction in logging and error tracking has security implications
- **Testing**: Synthetic monitoring and health checks connect observability to quality assurance
