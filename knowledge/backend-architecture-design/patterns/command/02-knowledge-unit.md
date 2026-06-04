# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Command pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Command encapsulates a request as an object, parameterizing clients with different requests, queuing or logging them, and supporting undoable operations. In Laravel, commands are central: queued jobs implement the command pattern, the Artisan command bus dispatches console commands, and the `Bus` facade provides a command bus for synchronous/asynchronous dispatch. The pattern decouples action invocation from execution, enabling deferred execution, retry logic, and audit trails.

---

# Core Concepts

- Command: object that encapsulates all information needed to perform an action
- Invoker: asks the command to carry out the request
- Receiver: knows how to perform the actual work
- Client: creates the command and sets its receiver
- Command bus: dispatches commands to their handlers

---

# Mental Models

- **Restaurant Order**: Waiter (invoker) takes order (command), chef (receiver) cooks
- **Undo/Redo**: Each action is a command object stored in history
- **Task Queue**: Commands serialize to queue, workers execute them later
- **Macro Recording**: Record commands as user actions, replay later

---

# Internal Mechanics

Laravel's command bus (`Illuminate\Bus\Dispatcher`) resolves command handlers from the container. Commands are plain objects (often DTO-like, with public properties for data). The `handle()` method on the handler receives the command. For queued jobs, Command implements `ShouldQueue`, serializes to JSON, dispatcher serializes/deserializes. The bus middleware pipeline wraps command execution with cross-cutting concerns.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Queued Job | Async execution, retry | Fault tolerance, scalability | Serialization overhead, eventual results |
| Synchronous Command | Immediate execution | Transactional consistency | Long execution blocks response |
| Batch Command | Composite command execution | Atomic batch operations | Failure rollback complexity |
| Undoable Command | Reversible operations | Audit trail, compensation | State management complexity |

---

# Architectural Decisions

- Use Command for: operations that should be queued (email sending, report generation)
- Use Command for: operations needing audit trail (who did what, when)
- Use Command for: operations that may need retry on failure
- Use for: separating controller logic from business operations
- Avoid Command for: simple CRUD operations without side effects
- Avoid for: read operations (use Query objects or direct service calls)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Decouples invocation from execution | More classes (Command + Handler) | Navigation overhead |
| Enables deferred/queued execution | Result not immediately available | Async complexity for caller |
| Retry, logging, monitoring built-in | Command serialization concerns | Objects must be serializable |
| Undo/compensation support | State management complexity | Memory for command history |

---

# Performance Considerations

- Command serialization (to queue): JSON encode for most queue drivers
- Large commands with many properties increase serialization cost
- Handler resolution via container adds ~0.1-1ms
- Batch commands: individual command dispatch overhead multiplies
- Consider command DTO size for queue performance

---

# Production Considerations

- Monitor command failure rates in Horizon dashboard
- Set appropriate retry limits per command type
- Log command payload for debugging (but exclude PII)
- Test command serialization/deserialization round-trip
- Version command classes to handle deployment of changed handlers

---

# Common Mistakes

- Command containing too much data → large queue payloads, serialization issues
- Command performing logic in __construct→ constructor accessed during serialization
- Not implementing ShouldQueue inconsistently → some commands sync, some async
- Commands depending on container-resolved services → not available after deserialization
- Commands with non-serializable properties → job fails at dispatch

---

# Failure Modes

- **Serialization failure**: command contains Closure or resource → queue fails to serialize
- **Handler not found**: command dispatched but no handler registered → runtime exception
- **Stale handler**: command from old deployment handled by new handler with different expectations → data inconsistency
- **Retry exhaustion**: command keeps failing → goes to failed_jobs table; no one monitors it
- **Ordering violation**: two commands expected to be sequential but processed out of order

---

# Ecosystem Usage

- **Laravel Queues**: `dispatch(new ProcessOrder($orderId))` → serialized, queued, worker executes handler
- **Laravel Bus**: `Bus::dispatch(new CreateUser($data))` → sync or async dispatch
- **Horizon**: command monitoring, retry, failed job management
- **Artisan Commands**: `Illuminate\Console\Command` — console command pattern
- **Spatie/QueueAware**: commands aware of queue context

---

# Related Knowledge Units

**Prerequisites**: Queues, serialization | **Related**: Strategy (how to do something vs what to do), Observer (state change notification vs action encapsulation), CQRS Command bus | **Advanced**: Idempotent commands, Saga pattern for multi-step commands, Event sourcing command handling

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

