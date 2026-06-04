# Anti-Patterns: Webhook Gateway Services (Convoy, Svix) vs Self-Hosted Patterns

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit | Webhook Gateway Services (Convoy, Svix) vs Self-Hosted Patterns |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Gateway Dependency Without Local Event Backup | Reliability | Critical |
| 2 | Sending All Events Through Gateway Including Low-Value Internal Ones | Architecture | Medium |
| 3 | Gateway as Event Source of Truth | Architecture | Critical |
| 4 | Single Gateway Provider Without Fallback Plan | Reliability | High |
| 5 | No Monitoring of Gateway Delivery Performance | Observability | High |

---

## Anti-Pattern 1: Gateway Dependency Without Local Event Backup

### Category
Reliability

### Description
Sending webhook events exclusively through a gateway service without storing them locally first, so a gateway outage permanently loses events that were not successfully dispatched.

### Why It Happens
Gateway services promote their high-availability (99.99%+ uptime). Developers trust these SLAs and assume the gateway is always available, skipping local storage as an unnecessary intermediate step.

### Warning Signs
- Events are POSTed directly to the gateway API without local database storage
- No outbox or event table exists for webhooks sent via gateway
- Gateway outage results in permanent event loss
- No replay mechanism for events that failed during gateway unavailability
- Gateway is the only record of what events were dispatched

### Why Harmful
If the gateway is unavailable (rate-limited, under maintenance, or experiencing an outage), events sent directly to it are lost. The gateway may accept the HTTP request but not process it (due to internal queue backpressure). Without local backup, these events cannot be replayed.

### Real-World Consequences
- Gateway API returns 503 during peak traffic; 500 payment confirmation events are lost
- Gateway rate-limits the application after a traffic spike; events are rejected silently
- Gateway incident (Convoy, Svix) lasts 45 minutes; all webhooks during that window disappear
- Customer disputes: "I never received the webhook" — and there's no record to verify delivery attempt

### Preferred Alternative
Always store the webhook event locally BEFORE sending it to the gateway. Use the local store as the source of truth for replay, audit, and recovery.

```php
class WebhookDispatcher {
    public function dispatch(string $eventType, array $payload): void {
        // 1. Store locally first (source of truth)
        $event = WebhookEvent::create([
            'event_type' => $eventType,
            'payload' => $payload,
            'status' => 'pending',
        ]);
        
        // 2. Send to gateway (delivery mechanism)
        try {
            $gateway->sendMessage($event->toStandardPayload());
            $event->update(['status' => 'dispatched']);
        } catch (GatewayException $e) {
            Log::error('Gateway dispatch failed, event queued locally', [
                'event_id' => $event->id,
                'error' => $e->getMessage(),
            ]);
            $event->update(['status' => 'gateway_failed']);
            // Event remains locally; retry job will re-attempt gateway dispatch
        }
    }
}
```

### Refactoring Strategy
1. Create local event store table for all webhooks sent via gateway
2. Change dispatch flow: store locally → send to gateway → update status
3. Implement local retry job for events with `gateway_failed` status
4. Add monitoring for events stuck in `pending` or `gateway_failed` status
5. Document recovery procedure for rebuilding from local store

### Detection Checklist
- [ ] Local event store exists for all gateway-dispatched webhooks
- [ ] Gateway send never happens without preceding local storage
- [ ] Gateway outage does not cause permanent event loss
- [ ] Local retry mechanism re-dispatches failed events after gateway recovery
- [ ] Local store is the source of truth; gateway is delivery mechanism

### Related Rules/Skills/Trees
- Rule: Store events locally BEFORE sending to gateway (backup if gateway is down)
- Rule: Maintain local event store as source of truth; gateway is delivery mechanism
- Related KU: Outbox Pattern (local storage before dispatch)

---

## Anti-Pattern 2: Sending All Events Through Gateway Including Low-Value Internal Ones

### Category
Architecture

### Description
Routing ALL webhook events (including low-value internal notifications, activity feeds, and health checks) through the gateway service, incurring unnecessary per-event costs and latency.

### Why Happens
A single dispatch pipeline is simpler than multiple paths. Teams route everything through the gateway because it's already set up, without considering cost-value for different event types.

### Warning Signs
- Internal service webhooks (between your own microservices) go through the gateway
- Non-critical events (user activity feeds, analytics pings) are gateway-dispatched
- Gateway bill is significantly higher than expected for the number of external subscribers
- Gateway fan-out includes internal endpoints alongside external subscriber endpoints
- Event classification by criticality does not inform delivery mechanism choice

### Why Harmful
Gateway services charge per event. Routing internal events through the gateway multiplies costs unnecessarily (internal services multiply event volume by the number of internal subscribers). It also adds latency: internal services could receive events directly via queue or local HTTP instead of routing through an external managed service.

### Real-World Consequences
- Gateway bill is $2,000/month, but only $500 is for external subscriber delivery
- Internal notification webhooks (50K/day) are routed through gateway, costing $1,500/month
- Internal service-to-service events take 200ms (via gateway) instead of 5ms (direct queue)
- Gateway becomes a dependency for internal services, increasing blast radius of gateway outages
- Scaling internal services requires scaling gateway capacity, not just internal infrastructure

### Preferred Alternative
Use a hybrid pattern: gateway for external subscriber delivery; self-hosted (queue, local HTTP) for internal services.

```php
class EventRouter {
    public function dispatch(WebhookEvent $event): void {
        if ($event->isExternal()) {
            GatewayDispatcher::dispatch($event); // Managed gateway
        } else {
            InternalDispatcher::dispatch($event); // Direct queue/local HTTP
        }
    }
}
```

### Refactoring Strategy
1. Classify events: external subscriber delivery vs internal service communication
2. Route internal events to queue or local HTTP dispatch (bypass gateway)
3. Keep gateway only for events destined to external subscriber endpoints
4. Monitor gateway cost savings after routing change
5. Document routing criteria for future event types

### Detection Checklist
- [ ] Only external subscriber events go through the gateway
- [ ] Internal events use direct dispatch (queue, local HTTP)
- [ ] Gateway cost is proportional to external subscriber volume
- [ ] Internal event latency does not include gateway network hop
- [ ] Gateway outage does not affect internal service communication

### Related Rules/Skills/Trees
- Rule: Use gateway for external subscriber delivery; self-hosted for internal services
- Rule: Sending all events through gateway including low-value internal ones
- Related KU: Self-hosted webhook patterns (Spatie webhook-server)

---

## Anti-Pattern 3: Gateway as Event Source of Truth

### Category
Architecture

### Description
Treating the webhook gateway as the authoritative record of events sent, relying on its delivery logs for audit, replay, and compliance evidence.

### Why It Happens
Gateway services provide sophisticated dashboards, delivery logs, and replay capabilities. It's tempting to use these features instead of maintaining a separate local event store, which feels redundant.

### Warning Signs
- No local event store; gateway dashboard is the primary event record
- Replay relies entirely on gateway's "replay" feature
- Audit evidence is exported from gateway delivery logs
- Compliance team references gateway logs as the source of truth
- No local backup of event data if gateway account is compromised or data is deleted

### Why Harmful
The gateway is a delivery mechanism, not an event store. It may have data retention limits (Svix: 30-90 days based on plan), data deletion policies, or export restrictions. If the gateway provider suffers data loss, account compromise, or service deprecation, all event history is lost.

### Real-World Consequences
- Svix data retention is 30 days on the plan; compliance audit requires 1 year of webhook history
- Gateway account is compromised; attacker deletes all delivery logs
- Company switches from Svix to Convoy; historical event data cannot be migrated
- Gateway provider goes out of business; all delivery history is lost
- Compliance audit fails: no independently verifiable event store

### Preferred Alternative
Maintain a local event store as the authoritative source of truth. Use the gateway purely for delivery. The local store provides long-term retention, independent verification, and portability between gateway providers.

```php
class EventStore {
    public function record(WebhookEvent $event): void {
        // Local database: permanent, independent, auditable
        LocalEvent::create([
            'event_id' => $event->id,
            'event_type' => $event->type,
            'payload' => $event->payload,
            'created_at' => now(),
        ]);
        
        // Also send to gateway for delivery
        $this->gateway->send($event);
    }
}
```

### Refactoring Strategy
1. Create local event store table for all gateway-dispatched events
2. Implement dual-write: local store + gateway dispatch
3. Set up local event retention to meet compliance requirements (1 year+)
4. Document that the local event store is the official source of truth
5. Schedule event store backup and verify restore procedure

### Detection Checklist
- [ ] Local event store exists with independent record of all dispatched events
- [ ] Retention period meets or exceeds compliance requirements
- [ ] Gateway logs are not the sole source of event history
- [ ] Local event store can be used to replay events through any gateway or direct delivery
- [ ] Gateway migration does not lose event history

### Related Rules/Skills/Trees
- Rule: Maintain local event store as source of truth; gateway is delivery mechanism
- Rule: Store events locally BEFORE sending to gateway
- Related KU: Event Sourcing for Webhooks (event store patterns)

---

## Anti-Pattern 4: Single Gateway Provider Without Fallback Plan

### Category
Reliability

### Description
Relying on a single webhook gateway provider (Svix, Convoy) with no fallback mechanism, making all webhook delivery dependent on that provider's availability.

### Why It Happens
Setting up a single gateway is straightforward. Configuring a second provider adds cost, complexity, and ongoing synchronization. Teams accept single-provider dependency as a business risk.

### Warning Signs
- One gateway provider configured; alternatives not evaluated
- No fallback delivery path if the primary gateway is unavailable
- Gateway outage stops ALL webhook delivery with no failover
- No documented migration plan to alternative gateway
- Gateway provider's status page is not monitored

### Why Harmful
If the chosen gateway provider has an extended outage (rare but possible), all webhook delivery stops. No subscriber receives events. For B2B SaaS platforms, this means all integrated services are down. Single-provider dependency also creates vendor lock-in: switching becomes harder.

### Real-World Consequences
- Convoy experiences 2-hour outage; all webhook delivery stops
- Subscribers report missing data; customer support overwhelmed
- Application can't fall back to self-hosted delivery because no path exists
- SLA breaches with customers who depend on webhook delivery
- Post-incident: 8 hours to configure a basic self-hosted fallback

### Preferred Alternative
Implement a fallback delivery mechanism: self-hosted dispatcher (Spatie webhook-server) as backup, or a second gateway provider as failover.

```php
class ResilientDispatcher {
    public function dispatch(WebhookEvent $event): void {
        try {
            $this->primaryGateway->send($event);
        } catch (GatewayUnavailableException $e) {
            Log::warning('Primary gateway unavailable, using fallback', [
                'event_id' => $event->id,
            ]);
            
            try {
                $this->fallbackGateway->send($event);
            } catch (\Exception $e2) {
                // Last resort: self-hosted
                $this->selfHostedDispatcher->send($event);
            }
        }
    }
}
```

### Refactoring Strategy
1. Evaluate fallback options: second gateway provider or self-hosted dispatcher
2. Implement fallback delivery path in the dispatcher
3. Test fallback activation: simulate primary gateway outage
4. Document fallback procedure and communication plan
5. Monitor fallback activation frequency (should be near-zero)

### Detection Checklist
- [ ] Fallback delivery path exists (second gateway or self-hosted)
- [ ] Fallback activation is tested regularly (quarterly)
- [ ] Fallback is transparent to subscribers (same signing, same format)
- [ ] Primary gateway outage does not stop webhook delivery
- [ ] Monitoring tracks fallback activation events

### Related Rules/Skills/Trees
- Rule: Single gateway provider without fallback plan
- Rule: Maintain local queue of undelivered events for replay after recovery
- Related KU: Business continuity for webhook delivery

---

## Anti-Pattern 5: No Monitoring of Gateway Delivery Performance

### Category
Observability

### Description
Integrating a webhook gateway without monitoring its delivery performance, latency, failure rates, or health, so gateway degradation goes unnoticed until subscribers report issues.

### Why It Happens
The gateway is a managed service that is assumed to be reliable. Teams monitor the application but don't monitor the delivery infrastructure, expecting the gateway provider to handle their own monitoring.

### Warning Signs
- No monitoring metrics for gateway delivery latency or success rate
- No alerting on gateway API response time degradation
- Gateway delivery failures are detected only through subscriber complaints
- Gateway dashboard is not integrated with the team's monitoring system
- No service-level objectives (SLOs) defined for gateway delivery performance

### Why Harmful
The gateway is a critical dependency: if it's slow (adding latency) or failing (dropping events), webhook delivery SLOs are breached silently. The gateway provider's status page reports uptime, but it doesn't report per-account latency degradation, rate-limit proximity, or endpoint health.

### Real-World Consequences
- Gateway latency gradually increases to 2 seconds per event (up from 50ms); subscribers see 2s delivery delay
- No alert fires because gateway is "up" — only internal monitoring detects the degradation
- Gateway rate-limits the application; events are queued in gateway for 30 minutes
- Subscribers start complaining about delayed webhooks; operations team discovers the queue
- 4-hour incident to identify and resolve the rate limit issue

### Preferred Alternative
Monitor gateway delivery as an integration dependency: track dispatch latency, success rate, failure codes, and throughput.

```php
class MonitoredGatewayDispatcher {
    public function send(WebhookEvent $event): void {
        $start = microtime(true);
        
        try {
            $this->gateway->send($event);
            $duration = (microtime(true) - $start) * 1000;
            
            Monitor::timing('gateway.dispatch.latency', $duration);
            Monitor::increment('gateway.dispatch.success');
            
            if ($duration > 1000) {
                Log::warning('Gateway dispatch slow', [
                    'event_id' => $event->id,
                    'latency_ms' => $duration,
                ]);
            }
        } catch (GatewayException $e) {
            Monitor::increment('gateway.dispatch.failure');
            Monitor::increment("gateway.dispatch.{$e->getCode()}");
            throw $e;
        }
    }
}
```

### Refactoring Strategy
1. Add monitoring metrics: gateway dispatch latency (p50, p95, p99), success rate, failure rate by status code
2. Set up alerting: dispatch latency > 1s (warning), > 5s (critical); success rate < 99.5%
3. Create gateway health dashboard alongside application health dashboard
4. Define gateway delivery SLOs and monitor compliance
5. Integrate gateway status page with incident management system

### Detection Checklist
- [ ] Gateway dispatch latency is monitored (p50, p95, p99)
- [ ] Gateway success and failure rates are tracked
- [ ] Alerting exists for latency degradation and failure rate increase
- [ ] Gateway delivery SLOs are defined and monitored
- [ ] Gateway health dashboard exists

### Related Rules/Skills/Trees
- Rule: Monitor gateway delivery latency and failure rates as integration metrics
- Rule: No monitoring of gateway delivery performance
- Related KU: Integration Health Checks (external dependency monitoring)
