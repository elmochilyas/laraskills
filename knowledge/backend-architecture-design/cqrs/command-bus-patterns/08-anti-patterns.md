# ECC Anti-Patterns — Command Bus Patterns

## Domain: Backend Architecture & Design | Subdomain: Command Query Separation

### Anti-Pattern Inventory

1. **Command as CRUD Wrapper** — Command/Handler pair for every simple DB operation
2. **Command Returning Data** — Commands that return query results (mixing C with Q)
3. **Fat Commands** — Command objects with 10+ fields, carrying too much data
4. **No Middleware** — Bus used without transaction, logging, or validation middleware
5. **Self-Handling Command Coupling** — Command containing handle() logic, coupling data to execution
6. **Mixed Bus** — Same bus for commands and queries without separation

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Command as CRUD Wrapper

**Category:** Architecture

**Description:** Creating a command and handler for every database write, including simple field updates.

**Why It Happens:** "CQRS means commands for all writes" applied without discrimination.

**Warning Signs:** `UpdateUserNameCommand` → `UpdateUserNameHandler` for a single field update.

**Why Is It Harmful:** Massive boilerplate. Command/handler pairs for operations that could be simple Eloquent updates. Development velocity drops.

**Preferred Alternative:** Use commands only for operations with business rules. Direct model updates for simple field changes.

**Refactoring Strategy:** Remove command/handler for trivial field updates. Keep commands only where business logic exists.

**Related Rules:** Apply commands selectively based on complexity (05-rules.md)

---

### Anti-Pattern 2: Command Returning Data

**Category:** CQRS Violation

**Description:** Commands that return data to the caller, violating command-query separation.

**Why It Happens:** Convenience — caller needs the created entity's ID.

**Warning Signs:** `CreateOrderCommand` returns `Order` object; command handler has return value.

**Why Is It Harmful:** Commands with return values cannot be reliably queued. Async command dispatch becomes impossible. Violates CQRS principle.

**Preferred Alternative:** Commands return void. If caller needs data, dispatch query separately.

**Refactoring Strategy:** Remove return values from command handlers. Use separate query for data retrieval.

**Related Rules:** Commands must not return data (05-rules.md)

---

### Anti-Pattern 3: Fat Commands

**Category:** Design

**Description:** Command objects with many fields, carrying excessive data for the operation.

**Why It Happens:** Commands designed as catch-all for all possible operation parameters.

**Warning Signs:** Command with 15+ properties; many properties optional/unused in practice.

**Why Is It Harmful:** Commands become unclear — which fields are actually required? Testing requires constructing massive command objects.

**Preferred Alternative:** Keep commands minimal — only fields needed for the operation. Use related commands for additional concerns.

**Refactoring Strategy:** Split fat command into focused ones. Remove optional fields.

**Related Rules:** Keep commands focused and minimal (05-rules.md)

---

### Anti-Pattern 4: No Middleware

**Category:** Architecture

**Description:** Command bus configured without middleware pipeline — no transaction wrapping, logging, or validation.

**Why It Happens:** Bus treated as simple dispatcher; middleware seen as optional.

**Warning Signs:** Bus dispatch called directly; no transaction management around handlers.

**Why Is It Harmful:** Missed opportunity for cross-cutting concerns. Transaction handling duplicated across handlers. No centralized logging.

**Preferred Alternative:** Use middleware for database transactions, logging, validation, and audit.

**Refactoring Strategy:** Add middleware to bus configuration. Move cross-cutting concerns from handlers to middleware.

**Related Rules:** Use middleware for cross-cutting concerns (05-rules.md)

---

### Anti-Pattern 5: Self-Handling Command Coupling

**Category:** Architecture

**Description:** Command class contains its own handle() method, coupling command data to execution logic.

**Why It Happens:** Convenience — command and handler in one class.

**Warning Signs:** `class CreateOrderCommand { public function handle() { ... } }`.

**Why Is It Harmful:** Command (data) coupled to execution (handler). Cannot reuse handler independently. Testing requires constructing command with execution logic.

**Preferred Alternative:** Separate command object from handler class. Handler receives command and processes it.

**Refactoring Strategy:** Split command's handle() into separate handler class. Command becomes pure DTO.

**Related Rules:** Separate command from handler (05-rules.md)

---

### Anti-Pattern 6: Mixed Bus

**Category:** CQRS Violation

**Description:** Same bus used for both commands and queries without separation.

**Why It Happens:** Single Bus facade used for all dispatch; separation not enforced.

**Warning Signs:** `Bus::dispatch($someCommand)` and `Bus::dispatch($someQuery)` in same dispatcher.

**Why Is It Harmful:** Commands (mutations) and queries (read-only) treated identically. Cannot apply different middleware. Queries queued accidentally.

**Preferred Alternative:** Separate command bus and query bus. Different middleware pipelines for each.

**Refactoring Strategy:** Create separate dispatch mechanisms for commands and queries. Commands go through transactional middleware; queries bypass it.

**Related Rules:** Separate command bus from query bus (05-rules.md)
