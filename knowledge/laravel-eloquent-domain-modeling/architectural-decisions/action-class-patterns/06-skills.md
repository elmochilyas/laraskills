# Action Class Patterns — Skills

---

## Skill 1: Create an Action Class

### Purpose
Generate a new single-use-case action class with constructor injection, typed return, and proper transaction boundaries.

### When To Use
- You need a named, testable entry point for a use case that coordinates multiple aggregates
- The operation has external side-effects (email, queue, API call)
- You are extracting logic from a fat controller or CLI command

### When NOT To Use
- The operation only reads or mutates a single model's own state — use a model method
- The operation is a trivial CRUD save under 3 lines — keep it in the controller
- The only goal is to make the controller thin with no actual orchestration

### Prerequisites
- Existing model classes for the aggregates involved
- A DTO or validated data object (optional but recommended)
- Interface contracts (optional, for `#[Override]`)

### Inputs
- Domain name (e.g., `Billing`, `Inventory`)
- Verb phrase for the action (e.g., `PayInvoice`, `CancelSubscription`)
- List of constructor dependencies
- List of aggregate roots to modify
- Whether the action needs a queue

### Workflow

1. **Create the class file**
   - Path: `App\Actions\{Domain}\{Verb}{Entity}Action.php`
   - Class is a plain PHP class with no base class unless necessary

2. **Define constructor with injected dependencies**
   - All dependencies are injected via constructor — never `app()` inside the body
   - Use PHP 8 promoted properties with `private readonly` where possible

3. **Implement `__invoke` with typed parameters and return type**
   - Parameters: models and DTOs only — never `Request` or raw input
   - Return type: typed DTO, Model instance, `void`, `bool`, or `Collection`

4. **Wrap cross-aggregate mutations in `DB::transaction()`**
   - All writes to two or more aggregate roots go inside the closure
   - Read-only operations do not need a transaction

5. **Dispatch domain events with `DB::afterCommit()`**
   - Never inline `event()` inside a transaction
   - Use `DB::afterCommit(fn () => event(...))` so events only fire on success

6. **Compose sub-actions via constructor injection when action exceeds 5 steps**

7. **Add `#[Override]` attribute if implementing an interface contract**

8. **Add authorization check at the action boundary** (before domain logic)

### Validation Checklist

- [ ] Class is invocable (`__invoke`) — no named method ceremony
- [ ] All dependencies are constructor-injected
- [ ] No `app()`, `resolve()`, or `make()` inside the method body
- [ ] Cross-aggregate operations wrapped in `DB::transaction()`
- [ ] Domain events dispatched via `DB::afterCommit()`
- [ ] Return type is explicit (DTO, Model, void, bool, Collection)
- [ ] Parameters are typed (model, DTO) — never raw arrays or `Request`
- [ ] Action is under 100 lines
- [ ] `#[Override]` present if implementing an interface
- [ ] Action has at least one test covering its outcome

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Test cannot mock dependency | `app()` used in method body | Move to constructor injection |
| Action returns raw array | Missing DTO class | Create typed DTO and return it |
| Email sent on rollback | `event()` called inside transaction | Wrap in `DB::afterCommit()` |
| Action over 150 lines | Orchestrating too much | Extract sub-operations into child actions |
| Route binding fails | Missing `__invoke` or wrong signature | Implement `__invoke` with correct params |

### Decision Points

| Question | Consideration |
|---|---|
| Queued or synchronous? | Queued if operation takes >500ms or involves external I/O |
| One action or sub-actions? | Keep under 100 lines; extract if exceeded |
| Transaction or no? | Only if 2+ aggregate roots are written |
| DTO or model parameter? | DTO for external input; model for existing entities |

### Performance Considerations
- Action resolution cost is one PHP object — negligible
- Keep transaction time short; move external I/O outside the transaction
- For queued actions, serialize only model keys and DTOs — never full model instances

### Security Considerations
- Never pass `Request` or `$request->all()` to the action
- Validate input in FormRequest before it reaches the action
- Authorization checks at the action boundary, not inside model methods
- Log action entry/exit with correlation IDs for audit trails

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Prefer `__invoke` for single-entry-point actions | `05-rules.md` Rule 1 |
| Rule 2: Never use `app()` inside action methods | `05-rules.md` Rule 2 |
| Rule 3: Always wrap cross-aggregate operations in `DB::transaction()` | `05-rules.md` Rule 3 |
| Rule 4: Return typed results from actions | `05-rules.md` Rule 4 |
| Rule 5: Dispatch domain events with `DB::afterCommit()` | `05-rules.md` Rule 5 |
| Rule 6: Limit actions to one use case and under 100 lines | `05-rules.md` Rule 6 |
| Rule 7: Never pass raw request input to actions | `05-rules.md` Rule 7 |
| Rule 8: Use `#[Override]` on interface implementations | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| When Models Are Enough | Counter-pattern — know when NOT to create an action |
| Write Model Separation | Actions write through models, not bypass them |
| Domain Events | Actions dispatch events via `DB::afterCommit()` |

### Success Criteria
- Action class exists at `App\Actions\{Domain}\{Verb}{Entity}Action.php`
- All dependencies are constructor-injected
- Method body has zero container calls
- Cross-aggregate writes are transactional
- Return type is explicit and typed
- Action passes tests for success and failure paths
- Action is under 100 lines

---

## Skill 2: Refactor Inline Controller Logic into an Action

### Purpose
Extract orchestration logic from a controller method into a dedicated action class, leaving the controller as a thin HTTP adapter.

### When To Use
- A controller method exceeds 15 lines and coordinates multiple models
- The same logic needs to be reused from a queue job, CLI command, or another action
- The controller method has side-effects beyond returning a response (email, dispatch, API call)

### When NOT To Use
- The controller method only reads data and returns it — keep it in the controller
- The logic is a single model save with no orchestration
- You are refactoring pre-emptively without an actual need (YAGNI)

### Prerequisites
- Existing controller method with orchestration logic
- Understanding of the action class pattern (Skill 1)

### Inputs
- Source controller file and method name
- List of dependencies the controller uses (gateways, repos, services)
- List of aggregate roots involved

### Workflow

1. **Identify the orchestration boundary**
   - Find the lines in the controller that coordinate multiple models
   - Exclude: validation, authorization, HTTP response construction
   - Include: model mutations, service calls, event dispatching, transaction logic

2. **Create the action class following Skill 1 workflow**
   - Name after the use case, not the controller method

3. **Move constructor-injectable dependencies from controller to action**
   - Gateways, repositories, mailers, loggers go in the action's constructor
   - HTTP-specific dependencies (Request, Session) stay in the controller

4. **Move the orchestration code into `__invoke`**
   - Replace `app()` calls with `$this->` references
   - Wrap cross-aggregate writes in `DB::transaction()`
   - Move `event()` calls to `DB::afterCommit()`

5. **Replace the controller body with action invocation**
   ```php
   // Before
   public function store(StoreInvoiceRequest $request): RedirectResponse
   {
       $invoice = $this->invoices->createFromRequest($request->validated());
       $this->gateway->charge($invoice, $request->validated('amount'));
       event(new InvoiceCreated($invoice));
       return redirect()->route('invoices.show', $invoice);
   }

   // After
   public function store(StoreInvoiceRequest $request): RedirectResponse
   {
       $invoice = $this->payInvoice->__invoke(
           $request->toDTO(),
       );
       return redirect()->route('invoices.show', $invoice);
   }
   ```

6. **Move controller tests to action tests**
   - The controller test becomes a thin integration test
   - The action gets a dedicated unit test with mocked dependencies

7. **Delete or deprecate the old inlined logic**

### Validation Checklist

- [ ] Controller no longer contains orchestration logic
- [ ] Controller only: validates, authorizes, invokes action, returns response
- [ ] Action has all previous orchestrations plus proper transaction boundary
- [ ] All existing tests pass (update assertions if return type changed)
- [ ] Action is independently testable without HTTP mocks
- [ ] Action does not return HTTP responses or use request objects

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Action still uses `Request` | Controller thinking leaked | Replace with DTO; validate in FormRequest |
| Action returns `RedirectResponse` | Action-as-controller | Return model or DTO; controller builds response |
| Test harder to write | Action depends on too many things | Extract sub-actions; reduce constructor params |
| Duplicate logic remains | Old method not removed | Delete the old controller method body |

### Decision Points

| Question | Consideration |
|---|---|
| Extract partial or full method? | Full if entire method is orchestration; partial if mixed with response logic |
| Keep old controller test? | Refactor into action test; keep controller test as minimal integration |
| Create sub-actions now? | Only if extracted action exceeds 100 lines |

### Performance Considerations
- One additional PHP object per request — negligible overhead
- Transaction scope may change — ensure it doesn't widen inadvertently

### Security Considerations
- Ensure authorization remains in the controller or is moved to a form request
- Action must not receive unfiltered input after refactor
- Verify validation still runs before action invocation

### Related Rules

| Rule | Reference |
|---|---|
| Rule 6: Limit actions to one use case and under 100 lines | `05-rules.md` Rule 6 |
| Rule 7: Never pass raw request input to actions | `05-rules.md` Rule 7 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create an Action Class | Used as the target for refactoring |
| Write Model Separation | Ensures action writes through model methods |
| When Models Are Enough | Helps decide if refactoring is needed at all |

### Success Criteria
- Controller method is under 10 lines and contains no domain logic
- Action class is independently testable without HTTP
- All original tests pass without modification (or minimal assertion updates)
- Action has its own test suite covering success and failure paths
- No `Request` or `RedirectResponse` usage inside the action

---

## Skill 3: Implement a Queued Action with Proper Serialization

### Purpose
Create an action that runs on a queue, serializing only minimal data (model keys, DTOs) and re-fetching entities inside `handle()`.

### When To Use
- The action performs I/O that takes >500ms (API calls, file processing, email sending)
- The action must survive request timeouts or process failures
- The action is triggered after a successful transaction commit

### When NOT To Use
- The action runs under 200ms and has no external I/O — keep it synchronous
- The caller needs the action's return value immediately — queues are fire-and-forget
- The domain requires immediate consistency — queue is for eventual consistency

### Prerequisites
- Laravel queue system configured (driver, connection, worker running)
- Existing action class or identified use case for the action

### Inputs
- Action logic (sync version if one exists)
- Model class and key name for re-fetching
- DTO or payload data structure
- Queue connection and queue name

### Workflow

1. **Implement `ShouldQueue` interface on the action class**
   ```php
   use Dispatchable, InteractsWithQueue, Queueable;
   ```

2. **Store model keys and DTOs in constructor — never full model instances**
   ```php
   public function __construct(
       private int $invoiceId,
       private PayInvoiceData $data,
   ) {}
   ```

3. **Re-fetch models inside `handle()` using `findOrFail`**
   ```php
   public function handle(): void
   {
       $invoice = Invoice::findOrFail($this->invoiceId);
       // processing logic
   }
   ```
   - Use `findOrFail` so the job fails fast if the model was deleted

4. **Move `handle()` logic into a separate sync action for reuse**
   - The queued action calls the sync action's `__invoke` after re-fetching
   - This avoids duplicating domain logic between sync and queue contexts

5. **Dispatch the queued action after transaction commit**
   - From a sync action: `DB::afterCommit(fn () => ProcessInvoiceAction::dispatch($invoice->id, $data))`
   - Never dispatch inside an open transaction

6. **Configure queue connection and retries on the class**
   ```php
   public $connection = 'redis';
   public $queue = 'billing';
   public $tries = 3;
   public $backoff = [5, 15, 60];
   ```

7. **Handle failure gracefully — implement `failed()` method**
   ```php
   public function failed(?Throwable $e): void
   {
       Log::error('Invoice processing failed', [
           'invoice_id' => $this->invoiceId,
           'error' => $e?->getMessage(),
       ]);
   }
   ```

### Validation Checklist

- [ ] Action implements `ShouldQueue`
- [ ] Constructor serializes only model keys and DTOs — no model instances
- [ ] `handle()` re-fetches models via `findOrFail`
- [ ] Sync logic is extractable or reused from a separate sync action
- [ ] Dispatch happens via `DB::afterCommit()` — never mid-transaction
- [ ] Queue connection, queue name, retries, and backoff are configured
- [ ] `failed()` method logs the failure (or sends alert)
- [ ] Tests cover: dispatch, successful processing, model-not-found failure

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Serialization error on dispatch | Model instance in constructor | Replace with model key; re-fetch in `handle()` |
| Job fires even on rollback | Dispatch inside transaction | Wrap in `DB::afterCommit()` |
| Stale model data on job run | Long queue delay; model updated between dispatch and run | Re-fetch in `handle()`; consider locking |
| Duplicate execution | No idempotency check | Add processed-flag or unique job ID |
| Job silently fails | No `failed()` method | Implement `failed()` with logging/alerting |

### Decision Points

| Question | Consideration |
|---|---|
| Shared action or separate sync/queue? | Shared if sync version also exists; separate if queue logic diverges |
| Queue connection? | `redis` for high-throughput; `database` for low-volume reliability |
| Retry strategy? | 3 retries with exponential backoff for transient failures; 0 for validation errors |
| Unique job? | Use `ShouldBeUnique` to prevent duplicate enqueue for same entity |

### Performance Considerations
- Serialize the minimum payload — large payloads increase Redis/database overhead
- Re-fetching models in `handle()` ensures fresh data at execution time
- Consider `WithoutOverlapping` middleware for jobs that should not run concurrently on the same entity
- Use `RateLimited` middleware for jobs that call external APIs with rate limits

### Security Considerations
- Validate input before dispatching — the queue worker trusts the payload
- Ensure the user triggering the dispatch has authorization (check at dispatch time)
- Re-authorize inside `handle()` if the job runs hours later and permissions may change
- Never serialize secrets or API keys in the job payload

### Related Rules

| Rule | Reference |
|---|---|
| Rule 5: Dispatch domain events with `DB::afterCommit()` | `05-rules.md` Rule 5 |
| Rule 6: Limit actions to one use case and under 100 lines | `05-rules.md` Rule 6 |
| Rule 7: Never pass raw request input to actions | `05-rules.md` Rule 7 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create an Action Class | Base pattern for the queued action |
| Refactor Inline Controller Logic into an Action | Often precedes adding a queue for slow operations |
| Domain Events | Queued actions may also dispatch events after processing |

### Success Criteria
- Queued action class implements `ShouldQueue` with minimal serialized payload
- `handle()` re-fetches models and delegates to sync action or contains logic directly
- Dispatched only after the triggering transaction commits
- Queue connection, retries, and backoff configured appropriately
- `failed()` method handles failure logging or alerting
- Tests verify dispatch, successful processing, and failure scenarios
