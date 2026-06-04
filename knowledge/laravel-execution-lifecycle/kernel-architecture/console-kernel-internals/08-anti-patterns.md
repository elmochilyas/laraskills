# ECC Anti-Patterns — Console Kernel Internals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Kernel Architecture |
| **Knowledge Unit** | Console Kernel Internals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Console Command as Monolith
2. Request-Dependent Command Logic
3. Unbounded Queue Workers
4. Scheduling Overlapping Tasks
5. Auto-Discovery Overhead in Production

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — console commands should use injected services, not inline queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Console Command as Monolith

### Category
Architecture

### Description
Putting all business logic inside the command's `handle()` method instead of delegating to services.

### Why It Happens
Commands are treated as "scripts" rather than orchestrators.

### Warning Signs
- `handle()` method exceeds 50 lines
- Database queries in `handle()`
- Same logic duplicated across multiple commands

### Why It Is Harmful
Commands should be thin orchestrators. Monolithic commands are untestable, violate SRP, and duplicate logic. Business logic in commands cannot be reused by controllers or other commands.

### Preferred Alternative
Delegate to service classes. Command `handle()` orchestrates; services contain business logic.

### Detection Checklist
- [ ] `handle()` with inline business logic
- [ ] Commands calling `DB::` or model methods directly
- [ ] Logic duplicated across commands

### Related Rules
Console Kernel Internals (05-rules.md): N/A

### Related Skills
Console Kernel Internals (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Request-Dependent Command Logic

### Category
Reliability

### Description
Using Request facade, session, or auth in console commands.

### Preferred Alternative
Use CLI arguments and options instead.

### Detection Checklist
- [ ] `request()`, `session()`, `auth()` in commands
- [ ] HTTP-specific services injected into commands

### Related Rules
Console Kernel Internals (05-rules.md): N/A

### Related Skills
Console Kernel Internals (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Unbounded Queue Workers

### Category
Reliability

### Description
Running `queue:work` without `--max-jobs` or `--max-time`.

### Preferred Alternative
Always set `--max-jobs=500` and `--max-time=3600`.

### Detection Checklist
- [ ] `queue:work` without limits
- [ ] OOM crashes in long-running workers

### Related Rules
Console Kernel Internals (05-rules.md): N/A

### Related Skills
Console Kernel Internals (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Scheduling Overlapping Tasks

### Category
Reliability

### Description
Not using `->withoutOverlapping()` for long-running scheduled tasks.

### Preferred Alternative
Use `->withoutOverlapping()` to prevent concurrent process execution.

### Detection Checklist
- [ ] Long-running tasks without overlap prevention
- [ ] Multiple concurrent instances of same task

### Related Rules
Console Kernel Internals (05-rules.md): N/A

### Related Skills
Console Kernel Internals (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Auto-Discovery Overhead in Production

### Category
Performance

### Description
Using `$this->load()` for command auto-discovery in production.

### Preferred Alternative
Use `$commands` array for explicit registration in production.

### Detection Checklist
- [ ] `$this->load()` used in `commands()` method
- [ ] Autoloader overhead from scanning commands directory

### Related Rules
Console Kernel Internals (05-rules.md): N/A

### Related Skills
Console Kernel Internals (06-skills.md): N/A

### Related Decision Trees
N/A
