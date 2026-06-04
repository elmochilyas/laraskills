# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Domain Events in Laravel
Knowledge Unit ID: LAP-08-domain-events
Difficulty Level: Advanced
Category: Architecture | Event-Driven Design
Last Updated: 2026-06-04

---

# Overview

Domain Events decouple domain logic from side effects by recording significant business occurrences as first-class objects. Instead of sending an email inside a domain method, the method dispatches an event — and infrastructure listeners handle the email, the audit log, the search index update, and any other side effects independently.

In layered architecture, Domain Events occupy a critical boundary. They are defined in or near the Domain layer (pure business concepts) and handled in Infrastructure (side effects). This separation ensures that business logic remains testable without infrastructure concerns, and infrastructure can evolve independently of business rules.

Domain Events differ from Laravel's general event system in intent: they represent business facts, not technical occurrences. `InvoicePaid` is a Domain Event. `UserLoggedIn` may be a technical event. The distinction matters for architectural decisions like event sourcing, replayability, and listener contracts.

---

# Core Concepts

**Domain Event**: A record of a significant business occurrence. Named in past tense (`InvoicePaid`). Carries only relevant immutable data. Represents a fact that happened, not a command to do something.

**Event Dispatch**: The act of publishing a Domain Event so that listeners can react. Dispatch occurs inside Aggregate methods before persistence. This ensures events are recorded in the correct business context.

**Listener**: Infrastructure code that handles a Domain Event. One listener per side effect. Listeners send emails, update search indexes, log audits, dispatch integration events, or trigger workflows.

**Event-Listener Mapping**: The registration that connects each Domain Event to its listeners. In Laravel, typically in `EventServiceProvider` or an Infrastructure Service Provider.

**Idempotency**: The property that processing the same event multiple times produces the same result. Essential for reliable event-driven systems where events may be delivered more than once.

**Eventual Consistency**: The architectural principle that after a Domain Event is dispatched, side effects may happen asynchronously. The system is not immediately consistent but converges over time.

---

# When To Use

- Multiple side effects follow a single domain operation (send email, update search index, log audit trail)
- Need to decouple business logic from infrastructure concerns — the business layer should not know about email, search, or notification infrastructure
- Cross-aggregate communication is required — one Aggregate's state change should trigger another Aggregate's reaction
- Audit trail of domain operations is required for compliance, debugging, or event sourcing
- Integration with external systems (webhooks, message queues, third-party APIs)

---

# When NOT To Use

- Simple CRUD with no side effects beyond persistence — events add unnecessary complexity
- Event is infrastructure-only (e.g., SQL triggers, cache invalidation without business meaning)
- Side effects MUST happen atomically in the same database transaction — Domain Events are not for intra-transaction consistency
- The action and its side effect are tightly coupled and unlikely to change independently

---

# Best Practices

**Name events in past tense.** `InvoicePaid`, not `PayInvoice` or `InvoicePaymentEvent`. Past tense communicates that the event is a fact. This naming convention is universal in DDD and event sourcing.

**Keep event data minimal.** Include only the data that listeners need — typically Aggregate identifiers and a timestamp. Avoid including full object state unless listeners specifically require it.

**Dispatch before persistence.** The aggregate records events as state changes happen. After the aggregate is persisted, dispatch all recorded events. This ensures that events are tied to the transaction that caused them.

**One listener per side effect.** A single Domain Event may trigger email sending, search indexing, and audit logging — these should be separate listener classes. This makes each side effect independently testable and configurable.

**Make listeners idempotent.** Network failures, queue retries, and at-least-once delivery mean the same event may be processed multiple times. Every listener must handle duplicate events safely.

**Queue non-critical listeners.** Email sending, search indexing, and webhook delivery should be queued. Only intra-transaction consistency operations (like updating a read model in the same DB transaction) should be synchronous.

---

# Architecture Guidelines

- Domain Event classes belong in the Domain layer or Domain/Application boundary. They should not contain Laravel-specific traits.
- Listener classes belong in Infrastructure. They implement Laravel's `ShouldQueue`, use Eloquent, send mail, etc.
- The event-to-listener mapping is an Infrastructure concern. Register in `EventServiceProvider` or a custom Infrastructure Service Provider.
- For cross-module or cross-microservice events, consider using a separate message bus (RabbitMQ, SQS) rather than Laravel's in-process events.
- Domain Events are not commands. If the class represents an intention (`PayInvoice`), it is a command, not an event. Use a command bus pattern (CQRS) for commands.

---

# Performance Considerations

- Synchronous Domain Events add latency proportional to the sum of all listener execution times. Profile and queue expensive listeners.
- Queued events offload processing to workers but introduce eventual consistency. The dispatch itself is fast (adding to a queue).
- For high-throughput applications, batch event processing improves throughput — collect events during a request and dispatch in a single batch.
- Domain Event serialization for queued dispatch adds negligible overhead.

---

# Security Considerations

- Events may contain sensitive data. Avoid including secrets, passwords, tokens, or PII in event payloads. Use identifiers and have listeners fetch full data through secure channels.
- Access control decisions should not be based on event data alone — events are facts, not authorization checks. The listener must verify permissions if needed.
- Event replay attacks: ensure event processing is idempotent. Use a unique event ID to detect and skip duplicate events.
- Event data in logs: ensure sensitive event payloads are masked or excluded from logging.

---

# Common Mistakes

1. **Commands vs Events confusion.** Naming an event as a command (`PayInvoice`) or a command as an event (`InvoicePaymentRequested`). Events are past tense facts about what happened. Commands are imperative intentions.

2. **Events carrying too much data.** Including full object serialization (the entire Invoice) when listeners only need the Invoice ID. Large event payloads increase serialization cost, queue storage, and processing time.

3. **Infrastructure leaks into event classes.** Event classes with `ShouldQueue` trait, `SerializesModels` trait, or Eloquent model references. Events should be plain PHP classes.

4. **Missing events.** Not dispatching events for important business occurrences. Common lifecycle events (created, updated, archived, deleted) should be systematically identified and dispatched.

5. **Listener ordering assumptions.** Listeners that depend on other listeners executing first. Event processing must be idempotent and independent of execution order.

6. **Forgetting `dispatchAfterCommit`.** Events dispatched inside database transactions may cause listeners to see uncommitted data. Use `dispatchAfterCommit` for queued events.

---

# Anti-Patterns

- **Command-as-Event**: Naming intentions as events (`PayInvoice` as an event instead of a command).
- **Fat Event**: Including the full Aggregate state in the event payload when identifiers suffice.
- **Event Handler in Domain**: Implementing listener logic in the Domain layer, coupling domain to infrastructure.
- **Event Spam**: Dispatching events for every trivial property change instead of only significant business occurrences.
- **Untestable Events**: Events that cannot be tested in isolation because they depend on infrastructure.

---

# Examples

**Domain Event Class:**
```php
final class InvoicePaid
{
    public function __construct(
        public readonly string $invoiceId,
        public readonly \DateTimeImmutable $paidAt,
        public readonly int $amountCents,
    ) {}

    public function toPayload(): array
    {
        return [
            'invoice_id' => $this->invoiceId,
            'paid_at' => $this->paidAt->format('c'),
            'amount_cents' => $this->amountCents,
        ];
    }

    public static function fromPayload(array $payload): self
    {
        return new self(
            $payload['invoice_id'],
            new \DateTimeImmutable($payload['paid_at']),
            $payload['amount_cents'],
        );
    }
}
```

**Aggregate Dispatching Events:**
```php
class Invoice
{
    private array $recordedEvents = [];

    public function markAsPaid(\DateTimeImmutable $paidAt): void
    {
        if ($this->status !== InvoiceStatus::Pending) {
            throw new \DomainException('Only pending invoices can be paid');
        }
        $this->status = InvoiceStatus::Paid;
        $this->paidAt = $paidAt;
        $this->recordedEvents[] = new InvoicePaid(
            $this->id->toString(),
            $paidAt,
            $this->total->cents(),
        );
    }

    public function releaseEvents(): array
    {
        $events = $this->recordedEvents;
        $this->recordedEvents = [];
        return $events;
    }
}
```

**Infrastructure Listener:**
```php
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendInvoicePaidNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private InvoiceMailer $mailer,
    ) {}

    public function handle(InvoicePaid $event): void
    {
        $invoice = Invoice::findOrFail($event->invoiceId);
        $this->mailer->sendPaidNotification($invoice);
    }

    public function failed(InvoicePaid $event, \Throwable $e): void
    {
        Log::error('Failed to send invoice paid notification', [
            'invoice_id' => $event->invoiceId,
            'error' => $e->getMessage(),
        ]);
    }
}
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-06 Domain-Driven Design | CPC-03 Sync vs Queued Events | CPC-08 CQRS Pattern |
| LAP-02 Clean Architecture | CPC-04 Event Design | CPC-09 Event Sourcing |
| LAP-04 Dependency Rule | CPC-10 Outbox Pattern | MMD-15 Event Sourcing/CQRS |

---

# AI Agent Notes

- Generate Domain Events as plain PHP classes with immutable constructor parameters. No Laravel traits.
- Name events in past tense using Ubiquitous Language.
- Generate one listener per side effect. Default to queued listeners for non-critical side effects.
- Always include `handle()` and `failed()` methods on listeners.
- For cross-module events, use a shared event interface or base class.
- Default to `dispatchAfterCommit` for queued events to avoid uncommitted data reads.
