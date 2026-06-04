---
Domain: Async & Distributed Systems
Subdomain: Message Distribution Systems
Knowledge Unit: K036 — RabbitMQ Exchange Types
Knowledge ID: K036
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Topic Exchange with Exact Routing Keys | Performance | Medium |
| 2 | Non-Durable Exchange in Production | Reliability | High |
| 3 | Fanout Exchange When Selective Routing Needed | Architecture | Medium |
| 4 | Binding Key Mismatch with Exchange Type | Configuration | High |
| 5 | Orphaned Bindings from Deleted Queues | Operations | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Over-Engineered Routing (topic for direct) | Medium — unnecessary pattern matching overhead | Use direct exchange for point-to-point dispatch |
| Non-Durable Exchanges | High — exchange lost on restart = messages unroutable | Infrastructure-as-code must set `durable=true` |
| Binding Key Mismatch | High — messages silently dropped or misrouted | Unit test routing with expected bindings |

---

## 1. Topic Exchange with Exact Routing Keys

### Category
Performance

### Description
Using a topic exchange when all routing keys are exact matches (no wildcard patterns needed). Topic exchange adds pattern matching overhead for each message without providing any routing flexibility benefit.

### Why It Happens
- Developer always uses topic exchange "just in case" future patterns are needed
- Copying from other systems that use topic exchanges
- Not evaluating whether wildcards are actually used
- "Topic is more flexible" mindset without considering cost
- Template configuration that defaults to topic

### Warning Signs
- All bindings use exact routing keys (no `*` or `#`)
- Binding list shows only exact-match patterns
- No use case for wildcard routing exists in the application
- Per-message routing latency is higher than expected for simple dispatch
- Direct exchange would achieve the exact same routing

### Why Harmful
- Topic exchange pattern matching adds CPU overhead per message (~0.01ms vs direct's O(1))
- Unnecessary complexity in the routing topology
- Harder to debug: "is this a binding issue or pattern matching issue?"
- Misconfigured patterns can cause unexpected routing
- Developers must understand wildcard syntax for simple routing

### Consequences
- Slightly higher message routing latency
- Debugging complexity for simple routing scenarios
- Risk of wildcard pattern typos causing silent routing failures
- Unnecessary complexity for new team members
- Harder to audit routing logic

### Alternative
- Use direct exchange for exact routing key matching:
  ```php
  $this->channel->exchange_declare('jobs', 'direct');
  $this->channel->queue_bind('high_priority', 'jobs', 'high');
  ```
- Switch to topic only when wildcard patterns are actually needed

### Refactoring Strategy
1. Audit all binding patterns on topic exchanges
2. If no wildcards (`*`, `#`) are used: switch to direct exchange
3. Update queue declarations and bindings
4. Verify message routing still works correctly
5. Remove topic exchange if no longer needed

### Detection Checklist
- [ ] No wildcard patterns in topic exchange bindings
- [ ] Direct exchange used for exact-match routing
- [ ] Routing performance baseline shows no pattern matching overhead
- [ ] Exchange type documented with rationale
- [ ] Code review evaluates exchange type choice

### Related Rules
- use-direct-exchange-for-point-to-point

### Related Skills
- Select RabbitMQ Exchange Type for Queue Routing

### Related Decision Trees
- Exchange Type Selection: Direct vs Fanout vs Topic

---

## 2. Non-Durable Exchange in Production

### Category
Reliability

### Description
Declaring RabbitMQ exchanges without the `durable = true` flag in production. Non-durable exchanges are deleted on broker restart — messages in bound queues become unroutable because the exchange no longer exists.

### Why It Happens
- Default exchange declaration is non-durable
- Not reading RabbitMQ documentation about durability
- Development config copied to production without review
- Assuming exchanges survive broker restarts by default
- Not testing broker restart scenarios

### Warning Signs
- After RabbitMQ restart, queues have messages but no exchange exists
- Producers fail with "not found" errors for the exchange
- RabbitMQ management UI shows exchange as `D: false` (non-durable)
- Exchange declaration missing `durable = true` parameter
- Messages pile up in queues with no route to consumers

### Why Harmful
- After any broker restart, all exchanges must be re-declared
- If the application doesn't auto-declare exchanges on startup, messages are unroutable
- Queues still exist (if durable) but have no exchange to route to
- Messages published to non-existent exchanges are dropped by RabbitMQ
- Application requires a restart before exchanges are restored

### Consequences
- Complete message routing failure after broker restart
- Lost messages published to non-existent exchanges
- Application must be restarted to re-declare exchanges
- Emergency manual exchange creation during incidents
- Unplanned downtime until exchanges are restored

### Alternative
- Always declare exchanges with `durable = true` in production:
  ```php
  $channel->exchange_declare('orders', 'direct', false, true, false);
  //                                                   ^durable=true
  ```
- Include exchange declaration in application boot process
- Test broker restart as part of disaster recovery

### Refactoring Strategy
1. Audit all exchange declarations for `durable = true`
2. Update non-durable exchanges to durable
3. Test broker restart — verify exchanges persist
4. Ensure application re-declares exchanges on startup (for recovery)
5. Add durability check to infrastructure-as-code templates

### Detection Checklist
- [ ] All production exchanges declared with `durable = true`
- [ ] Exchanges survive broker restart
- [ ] Application re-declares exchanges on startup (idempotent)
- [ ] Disaster recovery test includes exchange durability verification
- [ ] Non-production exchanges explicitly marked as non-durable

### Related Rules
- use-durable-exchanges-in-production

### Related Skills
- Select RabbitMQ Exchange Type for Queue Routing

### Related Decision Trees
- Exchange Type Selection: Direct vs Fanout vs Topic

---

## 3. Fanout Exchange When Selective Routing Needed

### Category
Architecture

### Description
Using a fanout exchange when consumers need only a subset of messages. Fanout delivers every message to every bound queue — consumers must filter and discard messages they don't need, wasting processing resources.

### Why It Happens
- "All consumers should see everything" assumption
- Starting with fanout for simplicity, then adding selective consumers later
- Not considering that fanout forces all consumers to process all messages
- Avoiding the complexity of topic exchange configuration
- Copying broadcast event patterns without evaluating consumer needs

### Warning Signs
- Fanout exchange consumers filter messages by type in application code
- Most bound queues ignore 90%+ of messages in the exchange
- Consumer CPU is dominated by message filtering, not actual processing
- Adding a new consumer requires it to handle irrelevant message types
- Discussion: "we just ignore events we don't care about"

### Why Harmful
- Every consumer processes ALL messages, even irrelevant ones
- Wasted CPU on message filtering and deserialization
- Consumer scaling must account for all messages, not just relevant subset
- Irrelevant messages consume consumer resources (memory, CPU, I/O)
- Adding message types increases load on ALL consumers, not just interested ones

### Consequences
- Higher infrastructure costs (consumers need more resources for filtering)
- Consumer scaling tied to total message volume, not relevant message volume
- CPU wasted on deserializing and filtering irrelevant messages
- Consumer code must know all message types to filter (tight coupling)
- New message types cannot be added without considering every consumer's filtering logic

### Alternative
- Use topic exchange for selective routing with wildcard patterns:
  ```php
  $this->channel->exchange_declare('events', 'topic');
  $this->channel->queue_bind('notifications', 'events', 'user.*');
  $this->channel->queue_bind('analytics', 'events', '#');
  ```
- Use direct exchange with separate routing keys for distinct message types

### Refactoring Strategy
1. Identify consumers that filter fanout messages in application code
2. Determine the subset of messages each consumer actually needs
3. Switch from fanout to topic exchange
4. Create specific bindings for each consumer's needs
5. Remove filtering code from consumers
6. Verify consumers receive only relevant messages

### Detection Checklist
- [ ] No fanout consumer filters messages in application code
- [ ] Each consumer receives only messages it actually processes
- [ ] Binding patterns match consumer responsibilities
- [ ] Adding a new message type doesn't affect unrelated consumers
- [ ] Consumer resource usage correlates with relevant message volume

### Related Rules
- use-fanout-exchange-for-broadcast-events

### Related Skills
- Select RabbitMQ Exchange Type for Queue Routing

### Related Decision Trees
- Exchange Type Selection: Direct vs Fanout vs Topic

---

## 4. Binding Key Mismatch with Exchange Type

### Category
Configuration

### Description
Configuring bindings with routing keys that don't match the exchange type's matching rules. For example, using wildcard patterns (`*`, `#`) in direct exchange bindings, or using exact keys in topic exchange without understanding the difference.

### Why It Happens
- Not understanding how each exchange type matches routing keys
- Copying binding configuration from one exchange type to another
- Assuming all bindings work the same way
- Not testing binding behavior before production deployment
- Confusing binding keys with routing keys in documentation

### Warning Signs
- Direct exchange has bindings with `*` or `#` patterns
- Topic exchange bindings never use wildcards
- Messages are delivered to unexpected queues or dropped
- Binding key format doesn't match exchange type documentation
- `rabbitmqctl list_bindings` shows unexpected matches

### Why Harmful
- Direct exchange treats `*` and `#` as literal characters — wildcards don't work
- Topic exchange treat exact routing keys as exact matches (no wildcard benefit but overhead remains)
- Messages may be delivered to unintended queues or dropped
- Debugging is confusing — bindings look correct but routing fails
- Silent misrouting can cause data leaks to wrong consumers

### Consequences
- Messages delivered to wrong consumers or not delivered at all
- Data privacy issues (messages routed to wrong queue)
- Hours of debugging routing issues that look correct in config
- Emergency binding fixes during production incidents
- Consumer-specific message processing bypassed

### Alternative
- Match binding key style to exchange type:
  - Direct: exact routing key only (e.g., `order.created`)
  - Topic: wildcards with `*` (one word) and `#` (zero or more words)
  - Fanout: binding key is ignored (empty string)
  - Headers: no routing key, use header attributes

### Refactoring Strategy
1. Audit all exchange bindings for pattern matching compatibility
2. Correct binding keys to match exchange type rules
3. Update exchange type if the binding pattern requires it
4. Test routing with actual messages
5. Document binding key conventions per exchange type

### Detection Checklist
- [ ] Direct exchange bindings use exact keys only
- [ ] Topic exchange bindings use wildcards where pattern matching needed
- [ ] Binding keys are documented per exchange type
- [ ] Routing tests verify correct delivery
- [ ] No messages routed to unexpected queues
- [ ] Code review checks binding key vs exchange type compatibility

### Related Rules
- use-direct-exchange-for-point-to-point

### Related Skills
- Select RabbitMQ Exchange Type for Queue Routing

### Related Decision Trees
- Exchange Type Selection: Direct vs Fanout vs Topic

---

## 5. Orphaned Bindings from Deleted Queues

### Category
Operations

### Description
Accumulating orphaned bindings from queues that were deleted but whose bindings to exchanges were not cleaned up. RabbitMQ does not automatically remove bindings for deleted queues — stale bindings accumulate and can cause unexpected routing after queue re-creation.

### Why It Happens
- Deleting queues via management UI without cleaning bindings
- Not knowing RabbitMQ retains bindings for deleted queues
- Automated queue deletion without binding cleanup
- Queue re-creation with different routing keys (old bindings remain)
- No periodic binding audit or cleanup process

### Warning Signs
- Exchange has more bindings than active queues
- `rabbitmqctl list_bindings` shows bindings for non-existent queues
- After queue re-creation, messages arrive from unexpected routing keys
- Binding count grows over time without corresponding queue growth
- Management UI shows warnings about orphaned bindings

### Why Harmful
- Orphaned bindings silently route messages to nowhere
- Queue re-creation with different configuration inherits old bindings
- Binding count grows unbounded, consuming exchange memory
- Debugging routing issues is confused by stale bindings
- Application behavior changes unexpectedly after queue re-creation

### Consequences
- Messages routed to non-existent queues (silently dropped)
- Unexpected message delivery after queue re-creation
- Exchange performance degrades with many stale bindings
- Confusing binding audits — "why is this binding here?"
- Emergency cleanup of hundreds of orphaned bindings

### Alternative
- Always delete bindings when deleting queues
- Use infrastructure-as-code to manage queue/binding lifecycle
- Implement periodic binding audit: list all bindings, verify queue existence
- Use RabbitMQ management API to automate cleanup

### Refactoring Strategy
1. List all bindings: `rabbitmqctl list_bindings`
2. Identify bindings for non-existent queues
3. Remove orphaned bindings: `rabbitmqctl clear_bindings`
4. Implement queue deletion script that also removes bindings
5. Set up periodic binding audit (weekly)

### Detection Checklist
- [ ] All bindings have corresponding active queues
- [ ] No bindings for non-existent queues
- [ ] Queue deletion process includes binding cleanup
- [ ] Periodic binding audit in place (weekly)
- [ ] Binding count is stable (not growing)
- [ ] Infrastructure-as-code manages binding lifecycle

### Related Rules
- use-durable-exchanges-in-production

### Related Skills
- Select RabbitMQ Exchange Type for Queue Routing

### Related Decision Trees
- Exchange Type Selection: Direct vs Fanout vs Topic
