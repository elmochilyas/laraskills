# Anti-Patterns: QueueManager and Connector Pattern

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K003 — QueueManager and Connector Pattern |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Custom Connector Implemented Partially | Reliability | Critical |
| 2 | Driver Registration in Routes Instead of Service Provider | Operational | Critical |
| 3 | Eager Connection in Custom Driver Constructor | Performance | High |
| 4 | One Connection Per Queue Name | Infrastructure | Critical |
| 5 | Custom Driver When Built-in Sufficient | Design | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Queue Contract Not Checked at Registration Time | queue-manager-connector-pattern, queue-driver-architecture | High |
| Connector Without Configuration Validation | queue-manager-connector-pattern, queue-driver-architecture | Medium |
| Multi-Connection Infrastructure Without Isolation Justification | queue-manager-connector-pattern, queue-connections-vs-queues | High |

---

## Anti-Pattern 1: Custom Connector Implemented Partially

### Category
Reliability — Runtime Failure

### Description
Implementing a custom queue connector that does not fully implement the `Queue` contract. Missing methods (`push`, `pop`, `delete`, `release`, `size`) cause runtime errors on first operation — in production, this means silent job loss.

### Why It Happens
Developers implement only the methods they think are needed based on their specific use case. The full `Queue` contract is not reviewed. The implementation works in simple testing but fails when the framework calls an unimplemented method.

### Warning Signs
- Custom queue class does not implement `Illuminate\Contracts\Queue\Queue`
- Missing `push()`, `pop()`, `delete()`, `release()`, or `size()` methods
- "Method not implemented" errors in queue worker logs
- Jobs dispatched successfully (push works) but never processed (pop missing)
- Custom driver appears to work for dispatch but breaks on worker operations

### Why Harmful
Runtime errors surface in production, not during development. A missing `pop()` method means the worker can never retrieve jobs — they queue up forever. A missing `delete()` means jobs are processed repeatedly (double processing).

### Real-World Consequences
A team builds a custom RabbitMQ connector but forgets to implement `pop()`. Dispatch works — jobs appear in RabbitMQ. Workers start, connect to RabbitMQ, but crash immediately because `pop()` is not implemented. The team spends 4 hours debugging before discovering the missing method. Meanwhile, 10,000 jobs accumulate unprocessed.

### Preferred Alternative
Always implement the full `Queue` contract. Use the interface as a checklist — ensure all methods (`push`, `pop`, `delete`, `release`, `size`) are implemented before deployment.

### Refactoring Strategy
1. Add `implements Queue` to the custom queue class
2. Let the IDE/linter flag missing methods
3. Implement each missing method with at minimum a proper implementation
4. Add integration tests for each Queue contract method
5. Test with a running worker before production deployment

### Detection Checklist
- [ ] Custom queue class lacks `implements Queue` interface
- [ ] Missing methods from Queue contract
- [ ] Runtime "method not implemented" errors
- [ ] Workers crash on first job retrieval

### Related Rules/Skills/Decision Trees
- **Rule 1**: custom-connectors-must-return-full-contract (`05-rules.md`)
- **Decision 1**: Custom Queue Driver vs Built-in Driver (`07-decision-trees.md`)

---

## Anti-Pattern 2: Driver Registration in Routes Instead of Service Provider

### Category
Operational — Registration Timing

### Description
Registering a custom queue driver in a route file or middleware instead of a service provider's `boot()` method. When the queue manager resolves the connection, the connector may not be registered yet — "Driver [custom] is not supported" error in production.

### Why It Happens
Route files are the quickest place to add code. Developers don't understand the boot order of Laravel's service providers vs route/middleware loading.

### Warning Signs
- `Queue::extend()` or `Queue::addConnector()` calls in `routes/web.php` or `routes/api.php`
- Driver registration alongside route definitions
- Intermittent "Driver not supported" errors that disappear after application restart
- Custom driver works in Artisan commands (which boot fully) but fails in HTTP workers
- Missing `QueueServiceProvider` or custom service provider for driver registration

### Why Harmful
The driver is not registered when the queue manager resolves the connection — production workers crash on startup. Jobs never process, and the queue backlog grows.

### Real-World Consequences
A team registers a custom Kafka driver in `routes/web.php`. HTTP requests work because routes are loaded before controller execution. But `php artisan queue:work` fails immediately with "Driver [kafka] is not supported" because the worker only boots service providers, not route files. All jobs remain in the queue unprocessed.

### Preferred Alternative
Always register custom queue drivers in a service provider's `boot()` method.

### Refactoring Strategy
1. Create (or use existing) service provider such as `AppServiceProvider`
2. Move `Queue::extend()` or `Queue::addConnector()` to the `boot()` method
3. Remove registration code from route files
4. Test that `php artisan queue:work` resolves the driver correctly
5. Verify driver registration order relative to `QueueServiceProvider`

### Detection Checklist
- [ ] `Queue::extend()` in route files
- [ ] "Driver not supported" error in worker startup
- [ ] Custom driver works in HTTP but fails in workers
- [ ] No custom service provider for queue registration

### Related Rules/Skills/Decision Trees
- **Rule 2**: register-drivers-in-service-provider (`05-rules.md`)
- **Decision 2**: Connector Registration Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 3: Eager Connection in Custom Driver Constructor

### Category
Performance — Wasted Resources

### Description
Establishing backend connections (TCP, HTTP) inside a custom driver's constructor instead of deferring to the `connect()` method. The manager creates connector instances eagerly — a constructor-based connection establishes backends that may never be used.

### Why It Happens
Developers follow the common pattern of establishing connections in constructors. The lazy initialization pattern is less intuitive and requires understanding that the framework constructs connectors eagerly.

### Warning Signs
- Custom connector constructor establishes TCP/HTTP connections
- Backend connections established even for unused queue connections
- Resource usage (file descriptors, memory) spikes at application boot
- Database connection pool exhaustion from eager queue connector connections
- Multiple Redis connections established per worker (not per connection name)

### Why Harmful
In a multi-connection setup, every connection establishes a backend TCP/HTTP session on every worker start — even connections that are never used. This wastes resources, increases boot time, and can exhaust connection limits.

### Real-World Consequences
A custom Kafka connector establishes a TCP connection in its constructor. The application configures 3 queue connections (Redis, SQS, Kafka) but only Redis is actively used. Every worker boot creates 3 TCP connections — 2 of which are never used. With 50 workers, 100 TCP connections are wasted, exhausting the server's file descriptor limit.

### Preferred Alternative
Defer backend connections to the `connect()` method, not the constructor.

### Refactoring Strategy
1. Remove backend connection logic from the constructor
2. Move connection establishment to the `connect(array $config)` method
3. Pass configuration to the Queue instance for later connection
4. Test that unused connections don't establish backends
5. Monitor resource usage before and after

### Detection Checklist
- [ ] Custom connector constructor establishes external connections
- [ ] Backend connections created for unused queue connections
- [ ] Resource usage spikes at application boot
- [ ] Connection count correlates with connector instances, not usage

### Related Rules/Skills/Decision Trees
- **Rule 3**: lazy-connect-in-custom-drivers (`05-rules.md`)
- **Decision 1**: Custom Queue Driver vs Built-in Driver (`07-decision-trees.md`)

---

## Anti-Pattern 4: One Connection Per Queue Name

### Category
Infrastructure — Multiplication

### Description
Creating separate queue connections (and often separate infrastructure) for each queue name. A single connection can host many queue names — separate connections multiply infrastructure costs without benefit.

### Why It Happens
Developers confuse connections (backend instances) with queues (named channels). Configuration examples that show separate connections for different drivers are misapplied to queue name separation.

### Warning Signs
- Multiple connections in `config/queue.php` all using the same driver and credentials
- Multiple Redis instances for different queue names
- Worker commands specify `--connection=` for each queue
- Dispatch calls use `onConnection()` instead of `onQueue()` for same-driver queues
- Infrastructure costs scale with queue count

### Why Harmful
Each new queue name requires infrastructure provisioning. Connection pools, monitoring, and operational complexity multiply. A team adds 5 queue names and provisions 5 Redis instances when one would serve all of them.

### Real-World Consequences
A team creates separate Redis connections for `critical`, `default`, and `bulk` queues — each with its own Redis instance. When they need a `media` queue, DevOps provisions a 4th Redis instance (3-day lead time). Each instance costs $30/month. Meanwhile, a team using one connection with `->onQueue('media')` would add the queue in 5 minutes with zero infrastructure changes.

### Preferred Alternative
Use one connection per driver type with multiple named queues. Create separate connections only for different drivers, isolated infrastructure, or environment separation.

### Refactoring Strategy
1. Consolidate same-driver connections into one in `config/queue.php`
2. Update dispatch calls to use `->onQueue('name')` instead of `->onConnection('name')`
3. Drain and decommission redundant connections
4. Update worker commands to use the consolidated connection
5. Simplify monitoring by removing per-connection panels

### Detection Checklist
- [ ] Multiple connections with same driver and credentials
- [ ] Dispatch calls use `onConnection()` for same-driver queues
- [ ] Infrastructure provisioned per queue name
- [ ] Worker commands specify connection per queue

### Related Rules/Skills/Decision Trees
- **Rule 4**: one-connection-not-per-queue (`05-rules.md`)
- **Decision 1**: Custom Queue Driver vs Built-in Driver (`07-decision-trees.md`)

---

## Anti-Pattern 5: Custom Driver When Built-in Sufficient

### Category
Design — Unnecessary Maintenance

### Description
Building a custom queue driver when a built-in driver (Redis, SQS, database) would suffice. Custom drivers require implementing the full Queue contract, maintaining compatibility across Laravel upgrades, and handling edge cases that built-in drivers already solve.

### Why It Happens
Teams want to use a specific backend (RabbitMQ, Kafka) for reasons unrelated to queue functionality — existing infrastructure investment, team familiarity, or architectural preference. The cost of building and maintaining a custom driver is underestimated.

### Warning Signs
- Custom connector for a backend with similar semantics to Redis/SQS
- No built-in driver evaluation before custom development
- Custom driver maintenance costs exceed backend licensing costs
- Laravel upgrades break custom driver (contract changes)
- Team spends significant time on driver maintenance vs business logic

### Why Harmful
Custom drivers carry ongoing maintenance burden. Each Laravel version update may break the contract. Edge cases (serialization, timeouts, retries) must be re-implemented. The driver becomes a liability that distracts from business feature development.

### Real-World Consequences
A team builds a custom RabbitMQ connector over 3 weeks. Over the next 2 years, they spend 2-3 days per Laravel upgrade fixing contract incompatibilities. The driver has 3 production incidents from edge cases that built-in drivers handle natively. Total maintenance cost exceeds $30K — more than 10x the cost of switching to Redis.

### Preferred Alternative
Evaluate built-in drivers first. Use Redis for high-throughput queueing with Horizon support. Use SQS for serverless AWS-native architectures. Only build custom drivers for backends with fundamentally different semantics (e.g., Kafka's log-based storage).

### Refactoring Strategy
1. Evaluate if Redis (with Horizon) or SQS meets the requirements
2. Estimate total cost of ownership for custom driver vs built-in migration
3. If built-in driver works: migrate jobs to the standard driver
4. Decommission custom driver
5. Redirect maintenance effort to business features

### Detection Checklist
- [ ] Custom driver for backend with similar semantics to Redis/SQS
- [ ] No built-in driver evaluation documented
- [ ] Laravel upgrades cause driver breakage
- [ ] Significant team time spent on driver maintenance

### Related Rules/Skills/Decision Trees
- **Decision 1**: Custom Queue Driver vs Built-in Driver (`07-decision-trees.md`)
- **Decision 2**: Connector Registration Strategy (`07-decision-trees.md`)
