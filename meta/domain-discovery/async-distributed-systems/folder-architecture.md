# Folder Architecture: Async & Distributed Systems

```
research/
├── phase-1-domain-discovery/
│   └── async-distributed-systems/
│       ├── domain-analysis.md
│       └── folder-architecture.md
│
knowledge/
└── async-distributed-systems/
    ├── 01-queue-engineering/
    │   ├── README.md
    │   ├── 01-drivers-connections/
    │   │   ├── redis-driver-deep-dive/
    │   │   │   ├── knowledge-unit.md              # Redis as queue driver: lpush/brpop, blocking mechanics
    │   │   │   ├── redis-cluster-support.md       # Horizon v5.46+ Redis Cluster integration
    │   │   │   └── redis-vs-sqs-vs-database.md    # Driver comparison matrix
    │   │   ├── sqs-driver-deep-dive/
    │   │   │   ├── knowledge-unit.md              # SQS queue creation, visibility timeout, FIFO
    │   │   │   ├── sqs-vs-horizon-limitations.md  # SQS incompatibility with Horizon
    │   │   │   └── sqs-lambda-serverless.md       # Serverless job processing with Lambda
    │   │   ├── database-driver-deep-dive/
    │   │   │   ├── knowledge-unit.md              # Database driver internals, polling mechanics
    │   │   │   └── when-to-use-database.md        # Thresholds and limitations
    │   │   ├── rabbitmq-driver/
    │   │   │   ├── knowledge-unit.md              # AMQP protocol, exchange types, bindings
    │   │   │   └── rabbitmq-production-patterns.md # Dead-letter, prefetch, clustering
    │   │   ├── kafka-driver/
    │   │   │   ├── knowledge-unit.md              # Topics, partitions, consumer groups, offsets
    │   │   │   └── kafka-vs-rabbitmq-decision.md   # When to choose each
    │   │   └── connections-vs-queues/
    │   │       ├── knowledge-unit.md              # Conceptual distinction, configuration examples
    │   │       └── queue-topology-design.md       # Multi-queue architectures per workload
    │   │
    │   ├── 02-job-creation-dispatch/
    │   │   ├── knowledge-unit.md                  # Job class anatomy, ShouldQueue contract
    │   │   ├── dispatch-patterns/
    │   │   │   ├── knowledge-unit.md              # dispatch(), dispatchSync(), dispatchIf(), dispatchUnless()
    │   │   │   ├── dispatchAfterResponse.md       # Post-response execution mechanics
    │   │   │   └── afterCommit-transactional.md   # Transactional dispatch safety
    │   │   ├── pending-dispatch-lifecycle/
    │   │   │   ├── knowledge-unit.md              # PendingDispatch wrapper, fluent chaining
    │   │   │   └── implicit-vs-explicit-dispatch.md # On-destruction vs explicit dispatch()
    │   │   ├── serialization/
    │   │   │   ├── knowledge-unit.md              # Job serialization, payload envelope structure
    │   │   │   ├── SerializesModels-trait.md      # Model serialization, restoration, pivot issues
    │   │   │   └── closure-job-serialization.md   # Serializable closures, Opis/Closure
    │   │   └── queueable-types/
    │   │       ├── knowledge-unit.md              # Jobs, mail, notifications, broadcast events
    │   │       └── queueable-listener-patterns.md  # Queued event listeners
    │   │
    │   ├── 03-job-middleware/
    │   │   ├── knowledge-unit.md                  # Middleware pipeline concept, before handle()
    │   │   ├── built-in-middleware/
    │   │   │   ├── knowledge-unit.md              # RateLimited, ThrottlesExceptions, WithoutOverlapping
    │   │   │   ├── RateLimited-deep-dive.md       # RateLimiter facade, limit definitions, per-job scoping
    │   │   │   ├── ThrottlesExceptions-deep-dive.md # Exception-based throttling, backoff callbacks
    │   │   │   ├── WithoutOverlapping-deep-dive.md # Cache-based locking, releaseAfter, expiration
    │   │   │   └── rate-limited-job-middleware-spatie.md # Spatie package: exponential backoff, custom intervals
    │   │   ├── unique-jobs/
    │   │   │   ├── knowledge-unit.md              # ShouldBeUnique, uniqueFor, uniqueVia
    │   │   │   └── unique-job-locking-mechanics.md # Cache lock implementation
    │   │   └── custom-middleware/
    │   │       ├── knowledge-unit.md              # make:job-middleware, middleware() method
    │   │       └── custom-middleware-patterns.md  # Logging, metrics, circuit breaker
    │   │
    │   └── 04-queue-manager-worker/
    │       ├── knowledge-unit.md                  # QueueManager, connectors, Worker class
    │       ├── worker-lifecycle/
    │       │   ├── knowledge-unit.md              # Daemon architecture, boot sequence, main loop
    │       │   ├── process-signals.md             # SIGTERM, SIGQUIT, SIGUSR2, SIGCONT handling
    │       │   ├── memory-management.md           # --max-jobs, --max-time recycling strategies
    │       │   └── worker-timeouts.md             # --timeout, retry_after, timeout interaction matrix
    │       ├── queue-commands/
    │       │   ├── knowledge-unit.md              # queue:work, queue:listen, queue:restart
    │       │   └── queue-work-flags.md            # --queue, --sleep, --tries, --timeout reference
    │       └── supervisor-configuration/
    │           ├── knowledge-unit.md              # Supervisord config structure, numprocs
    │           ├── supervisord-production.md      # stopwaitsecs, stopasgroup, killasgroup
    │           ├── systemd-alternative.md         # systemd service files, scaling
    │           └── deployment-restart.md          # horizon:terminate, signal-based restart
    │
    ├── 02-job-batching-chaining/
    │   ├── README.md
    │   ├── 01-batch-architecture/
    │   │   ├── knowledge-unit.md                  # Bus::batch, batch storage, UUID, state tracking
    │   │   ├── job-batches-table-schema.md        # Database schema, columns, indexes
    │   │   ├── row-level-locking-bottleneck.md    # SELECT FOR UPDATE contention analysis
    │   │   └── batch-state-machine.md             # pending→completed→finished lifecycle
    │   ├── 02-batch-callbacks/
    │   │   ├── knowledge-unit.md                  # then/catch/finally/progress/before callbacks
    │   │   ├── callback-serialization.md          # Closure serialization, deployment hazards
    │   │   └── allowFailures-behavior.md          # Failure tolerance, then/catch interaction
    │   ├── 03-batchable-trait/
    │   │   ├── knowledge-unit.md                  # Batchable trait, batch() method, cancelled()
    │   │   └── batch-cancellation-patterns.md     # Cancelling batches, pending job short-circuit
    │   ├── 04-job-chaining/
    │   │   ├── knowledge-unit.md                  # Bus::chain, sequential execution
    │   │   ├── chain-failure-propagation.md       # Chain abort on failure, cleanup
    │   │   └── batch-of-chains/
    │   │       ├── knowledge-unit.md              # Nested batch+chain pattern
    │   │       └── finally-callback-edge-cases.md # Known bug: finally() not firing on mid-chain fail
    │   └── 05-testing-batches-chains/
    │       ├── knowledge-unit.md                  # Bus::fake, assertBatchDispatched
    │       └── batch-chain-test-patterns.md       # Testing sequential + parallel combinations
    │
    ├── 03-retry-failure-handling/
    │   ├── README.md
    │   ├── 01-failure-taxonomy/
    │   │   ├── knowledge-unit.md                  # Release vs Exception vs Fail
    │   │   └── failure-decision-tree.md            # Classification flow per exception type
    │   ├── 02-retry-configuration/
    │   │   ├── knowledge-unit.md                  # $tries, $maxExceptions, retryUntil()
    │   │   ├── backoff-strategies/
    │   │   │   ├── knowledge-unit.md              # Fixed, exponential, exponential+jitter
    │   │   │   ├── backoff-array-deep-dive.md     # Progressive delay arrays, thundering herd
    │   │   │   └── retryUntil-time-based.md       # Time-based vs attempt-based retry limits
    │   │   └── per-job-vs-global-config.md        # Job properties vs worker flags vs horizon config
    │   ├── 03-failed-job-storage/
    │   │   ├── knowledge-unit.md                  # failed_jobs table, DynamoDB storage
    │   │   ├── dynamodb-failed-jobs.md            # AWS DynamoDB integration, throughput
    │   │   └── failed-job-lifecycle.md            # Storage, inspection, retry, pruning
    │   ├── 04-dead-letter-patterns/
    │   │   ├── knowledge-unit.md                  # Dead-letter queue concept, poison messages
    │   │   ├── laravel-dlq-implementation.md      # Manual DLQ via failed() + dispatch to DLQ queue
    │   │   └── poison-message-detection.md        # Detecting non-recoverable failures early
    │   ├── 05-retry-workflows/
    │   │   ├── knowledge-unit.md                  # queue:retry, Horizon retry, batch retry
    │   │   └── automated-retry-pipelines.md       # Scheduled retry, DLQ reprocessing
    │   ├── 06-idempotency/
    │   │   ├── knowledge-unit.md                  # Idempotency keys, deduplication strategies
    │   │   └── idempotency-implementation.md      # DB constraints, processed-ID tables, upsert
    │   └── 07-cleanup-maintenance/
    │       ├── knowledge-unit.md                  # Pruning failed jobs, queue:prune-failed
    │       └── ignoring-missing-models.md         # Model-not-found handling on deserialization
    │
    ├── 04-event-driven-architecture/
    │   ├── README.md
    │   ├── 01-events-listeners/
    │   │   ├── knowledge-unit.md                  # Event/listener pattern, generation, anatomy
    │   │   ├── auto-discovery/
    │   │   │   ├── knowledge-unit.md              # Filesystem scanning, handle/__invoke detection
    │   │   │   ├── ShouldBeDiscovered-interface.md # Opt-in discovery control (Laravel 13.12+)
    │   │   │   └── custom-listeners-directory.md   # withEvents for non-standard paths
    │   │   ├── manual-registration.md             # EventServiceProvider, manual mapping
    │   │   ├── event-subscribers/
    │   │   │   ├── knowledge-unit.md              # Subscriber class, subscribe() method
    │   │   │   └── subscribers-vs-listeners.md    # When to use each pattern
    │   │   └── queued-listeners/
    │   │       ├── knowledge-unit.md              # ShouldQueue on listeners, connection/queue config
    │   │       └── listener-queue-patterns.md     # When to queue, ordering considerations
    │   ├── 02-domain-events/
    │   │   ├── knowledge-unit.md                  # Domain events vs Laravel events
    │   │   └── domain-event-patterns.md           # Event sourcing prep, event naming conventions
    │   └── 03-testing-events/
    │       ├── knowledge-unit.md                  # Event::fake(), assertDispatched, assertListening
    │       └── event-test-patterns.md             # Faking subsets, ordered assertions
    │
    ├── 05-broadcasting-realtime/
    │   ├── README.md
    │   ├── 01-broadcasting-system/
    │   │   ├── knowledge-unit.md                  # Broadcasting architecture, install:broadcasting
    │   │   ├── pusher-protocol.md                 # Pusher protocol, Reverb compatibility
    │   │   └── driver-comparison.md               # Pusher vs Reverb vs Ably vs Soketi
    │   ├── 02-laravel-reverb/
    │   │   ├── knowledge-unit.md                  # Reverb WebSocket server, FrankenPHP engine
    │   │   ├── installation-configuration.md      # reverb.php, env vars, app credentials
    │   │   ├── running-reverb.md                  # reverb:start, debugging, restarting
    │   │   ├── production-deployment.md           # Open files, event loop, Nginx, WSS, ports
    │   │   ├── scaling-reverb.md                  # Multiple processes, load balancing
    │   │   └── monitoring-reverb.md               # Metrics, health checks, alerts
    │   ├── 03-channels/
    │   │   ├── knowledge-unit.md                  # Public, private, presence channel types
    │   │   ├── channel-authorization.md           # Private/presence auth, routes/channels.php
    │   │   └── presence-channel-state.md          # Join/leave events, user state
    │   ├── 04-laravel-echo/
    │   │   ├── knowledge-unit.md                  # Echo client setup, channel listening
    │   │   └── echo-advanced-usage.md             # Presence channels, whispering, leaving
    │   └── 05-testing-broadcasting/
    │       ├── knowledge-unit.md                  # Event::fake with broadcast assertions
    │       └── broadcasting-test-strategies.md    # Fake channels, assertBroadcasted
    │
    ├── 06-message-distribution-systems/
    │   ├── README.md
    │   ├── 01-amazon-sqs/
    │   │   ├── knowledge-unit.md                  # SQS driver, queue creation, IAM permissions
    │   │   ├── fifo-vs-standard.md                # Exactly-once vs at-least-once, ordering
    │   │   ├── visibility-timeout.md              # SQS visibility timeout mechanics
    │   │   └── sqs-lambda-integration.md          # Serverless workers via Lambda triggers
    │   ├── 02-rabbitmq/
    │   │   ├── knowledge-unit.md                  # AMQP protocol, vyuldashev/laravel-queue-rabbitmq
    │   │   ├── exchange-types.md                  # Direct, fanout, topic, headers — routing patterns
    │   │   ├── dead-letter-rabbitmq.md            # Native DLQ, per-queue TTL, overflow
    │   │   ├── prefetch-and-qos.md                # Channel prefetch count, consumer pacing
    │   │   └── rabbitmq-clustering.md             # Mirrored queues, quorum queues, cluster setup
    │   ├── 03-apache-kafka/
    │   │   ├── knowledge-unit.md                  # Kafka driver, topics, partitions
    │   │   ├── consumer-groups.md                 # Group coordination, offset commit strategies
    │   │   ├── replay-capability.md               # Offset seeking, re-processing from start
    │   │   └── kafka-vs-traditional-queues.md     # Log-based vs queue-based architecture differences
    │   ├── 04-redis-streams/
    │   │   ├── knowledge-unit.md                  # Redis streams, consumer groups, pending entries
    │   │   └── streams-vs-list-queues.md          # XADD/XREADGROUP vs LPUSH/BRPOP
    │   └── 05-driver-selection-guide/
    │       ├── knowledge-unit.md                  # Decision framework for driver selection
    │       └── driver-comparison-matrix.md        # Throughput, latency, durability, complexity
    │
    ├── 07-horizon-scaling/
    │   ├── README.md
    │   ├── 01-horizon-architecture/
    │   │   ├── knowledge-unit.md                  # Horizon overview, Redis-backed, dashboard
    │   │   ├── auto-start-master.md              # horizon:start, supervisor process tree
    │   │   └── horizon-internal-redis.md         # Reserved horizon Redis connection
    │   ├── 02-supervisor-configuration/
    │   │   ├── knowledge-unit.md                  # config/horizon.php, environments, supervisors
    │   │   ├── supervisor-workload-separation.md  # Separate supervisors by job type/priority
    │   │   ├── maxTries-maxTime-maxJobs.md        # Per-supervisor retry/timeout/limit settings
    │   │   └── supervisor-backoff.md              # Per-supervisor exponential backoff arrays
    │   ├── 03-balancing-strategies/
    │   │   ├── knowledge-unit.md                  # Auto, simple, false balancing modes
    │   │   ├── auto-balancing-deep-dive.md        # time vs size strategy, min/max processes
    │   │   ├── balanceMaxShift-balanceCooldown.md # Tuning scaling aggression and cooldown
    │   │   └── when-to-use-each-strategy.md       # Decision guide per workload pattern
    │   ├── 04-monitoring-metrics/
    │   │   ├── knowledge-unit.md                  # Throughput, runtime, wait time, failures
    │   │   ├── job-tags.md                        # Tagging jobs for filtering and search
    │   │   ├── silenced-jobs.md                   # Silenced interface, config-level silencing
    │   │   └── horizon-metrics-api.md             # Programmatic access to metrics data
    │   ├── 05-notifications-alerts/
    │   │   ├── knowledge-unit.md                  # Wait time thresholds, failure notifications
    │   │   └── notification-channels.md           # Slack, email, custom notification routing
    │   ├── 06-multi-server-horizon/
    │   │   ├── knowledge-unit.md                  # Shared Redis, independent server registration
    │   │   └── multi-server-deployment.md         # Coordinated supervisor configs, termination
    │   └── 07-redis-cluster-support/
    │       ├── knowledge-unit.md                  # Horizon v5.46+ Redis Cluster support
    │       └── cluster-limitations.md             # Known constraints and workarounds
    │
    ├── 08-async-patterns/
    │   ├── README.md
    │   ├── 01-core-dispatch-patterns/
    │   │   ├── knowledge-unit.md                  # dispatch(), dispatchSync(), dispatchIf(), dispatchUnless()
    │   │   ├── dispatchAfterResponse-deep-dive.md # Registering shutdown handlers, limitations
    │   │   └── afterCommit-pattern.md            # Transactional job dispatch, configuration levels
    │   ├── 02-defer-pattern/
    │   │   ├── knowledge-unit.md                  # Laravel 12 batch defer for lightweight async
    │   │   └── defer-vs-queue-decision.md         # When to defer vs full queue dispatch
    │   ├── 03-conditional-dispatch/
    │   │   ├── knowledge-unit.md                  # dispatchIf(), dispatchUnless(), onConnection(), onQueue()
    │   │   └── dispatch-chaining.md               # PendingDispatch method reference
    │   └── 04-closure-jobs/
    │       ├── knowledge-unit.md                  # dispatch(function() { ... }) pattern
    │       ├── closure-catch-callbacks.md         # catch() on closures, $this limitation
    │       └── closure-vs-class-jobs.md          # When to use each
    │
    ├── 09-webhook-distribution/
    │   ├── README.md
    │   ├── 01-webhook-server-spatie/
    │   │   ├── knowledge-unit.md                  # Sending webhooks, config, queue usage
    │   │   ├── webhook-signing.md                 # HMAC signing, DefaultSigner
    │   │   ├── retry-backoff-strategies.md        # ExponentialBackoffStrategy config
    │   │   └── tag-meta-payload.md               # Metadata, tagging, conditional dispatch
    │   ├── 02-webhook-client-spatie/
    │   │   ├── knowledge-unit.md                  # Receiving webhooks, config, signature validation
    │   │   ├── signature-validators.md            # Default, custom, timestamp-based validation
    │   │   ├── payload-storage-processing.md      # Storing incoming payloads, queued processing
    │   │   └── replay-attack-prevention.md        # Timestamp headers, nonce patterns
    │   └── 03-webhook-architecture/
    │       ├── knowledge-unit.md                  # Webhook reliability, idempotency keys
    │       └── webhook-event-mapping.md           # Mapping webhook payloads to domain events
    │
    ├── 10-queue-observability/
    │   ├── README.md
    │   ├── 01-laravel-pulse/
    │   │   ├── knowledge-unit.md                  # Pulse overview, installation, recorders
    │   │   ├── slow-jobs-recorder.md              # SlowJobs recorder configuration, thresholds
    │   │   ├── custom-pulse-recorders.md          # Building custom queue monitoring cards
    │   │   └── pulse-vs-horizon-metrics.md        # When to use each tool
    │   ├── 02-horizon-observability/
    │   │   ├── knowledge-unit.md                  # Dashboard metrics, wait time analysis
    │   │   └── horizon-api-integration.md         # Programmatic metrics export
    │   ├── 03-logging-alerting/
    │   │   ├── knowledge-unit.md                  # Queue logging strategies, structured logging
    │   │   ├── failed-job-alerting.md             # Slack/PagerDuty/email on failure thresholds
    │   │   └── queue-depth-monitoring.md          # Monitoring queue backlog growth
    │   └── 04-distributed-tracing/
    │       ├── knowledge-unit.md                  # Trace propagation across jobs
    │       └── trace-id-patterns.md              # Injecting and propagating correlation IDs
    │
    ├── 11-production-patterns/
    │   ├── README.md
    │   ├── 01-queue-topology-design/
    │   │   ├── knowledge-unit.md                  # Queue naming conventions, priority separation
    │   │   ├── workload-isolation.md              # CPU-bound vs I/O-bound job separation
    │   │   └── queue-topology-examples.md         # E-commerce, SaaS, media processing patterns
    │   ├── 02-scaling-strategies/
    │   │   ├── knowledge-unit.md                  # Vertical vs horizontal worker scaling
    │   │   ├── concurrency-tuning.md              # Optimal process counts per workload
    │   │   └── resource-sizing-guide.md           # CPU, memory, Redis connection planning
    │   ├── 03-deployment-practices/
    │   │   ├── knowledge-unit.md                  # Rolling restarts, zero-downtime queue deploys
    │   │   └── horizon-terminate-strategy.md      # Coordinated terminations across servers
    │   ├── 04-disaster-recovery/
    │   │   ├── knowledge-unit.md                  # Queue backup, failover, job replay
    │   │   └── queue-migration-strategies.md      # Moving between queue drivers without data loss
    │   └── 05-cost-optimization/
    │       ├── knowledge-unit.md                  # SQS cost, Redis memory, worker utilization
    │       └── driver-cost-comparison.md          # Cost analysis per job volume
    │
    └── references/
        ├── laravel-docs-links.md
        ├── community-articles.md
        ├── source-code-pointers.md
        └── package-repositories.md
```

## Architecture Principles

1. **One knowledge-unit per concept** — each leaf directory contains a single `knowledge-unit.md` as the canonical source for that concept
2. **Progressive depth** — top-level folders are subdomains, second-level are concepts, third-level are deep dives
3. **Cross-referencing** — knowledge units reference each other via relative paths (e.g., `../../job-middleware/README.md`)
4. **Driver-agnostic first** — generic knowledge sits higher, driver-specific knowledge deeper
5. **Production bias** — each subdomain includes production-pattern-specific directories
6. **Decision records** — comparison files (e.g., `redis-vs-sqs-vs-database.md`) distill tradeoff knowledge
7. **Version awareness** — Laravel version minimums noted where features were introduced or changed
