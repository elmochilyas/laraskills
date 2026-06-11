# Scenario 2 — Queued Email with Retries

## Summary

| Aspect | Value |
|--------|-------|
| Scenario | Queued order-confirmation email workflow |
| Prompt | `prompts/02-queued-email-idempotency.txt` |
| Baseline worktree | `<lab-root>/worktrees/02-queued-email-idempotency-baseline` |
| ECC worktree | `<lab-root>/worktrees/02-queued-email-idempotency-ecc-assisted` |
| Model | `opencode/deepseek-v4-flash-free` |
| Status | **Complete** |

---

## Baseline Run

| Metric | Result |
|--------|--------|
| Start timestamp | 2026-06-11 00:19:36 |
| End timestamp | 2026-06-11 00:23:54 |
| Duration | 4m 18s |
| Tests | 8 / 8 PASS |
| Assertions | 14 |
| Test result | Full pass |
| Pint result | 1 FAIL — 5 style issues (concat_space, not_operator_with_successor_space, ordered_interfaces, no_extra_blank_lines, fully_qualified_strict_types) |
| Routes | 5 (1 custom: `POST orders` → `OrderController@store`) |
| Files created | 8 legitimate |

### Created/Modified Files

**Modified:**
- `routes/web.php` — added `POST /orders` route
- `tests/Pest.php` — enabled `RefreshDatabase`

**Untracked (8):**
- `app/Http/Controllers/OrderController.php`
- `app/Jobs/SendOrderConfirmationEmail.php`
- `app/Mail/OrderConfirmation.php`
- `app/Models/Order.php`
- `database/factories/OrderFactory.php`
- `database/migrations/2025_06_11_000001_create_orders_table.php`
- `resources/views/mail/order-confirmation.blade.php`
- `tests/Feature/OrderConfirmationTest.php`

### Architecture

```
Controller (OrderController@store)
  └→ validates request (user_id, total)
  └→ creates Order with email_idempotency_key (UUID)
  └→ checks hasEmailBeenSent() (redundant — always false)
  └→ dispatches SendOrderConfirmationEmail (ShouldBeUniqueUntilProcessing)
       └→ handle(): checks hasEmailBeenSent() → sends Mailable → markEmailAsSent()
       └→ 3 tries, backoff [5, 15, 45], 30s timeout
       └→ failed(): logs error
```

### Verification Checklist

- [x] ShouldQueue — `SendOrderConfirmationEmail implements ShouldQueue, ShouldBeUniqueUntilProcessing`
- [x] retry/backoff — `$tries = 3`, `backoff()` returns `[5, 15, 45]`
- [x] timeout — `$timeout = 30` seconds
- [x] failed-job handling — `failed()` hook logs to Laravel Log
- [x] idempotency — 3-layer: `ShouldBeUniqueUntilProcessing` (queue dedup) + `hasEmailBeenSent()` guard + `markEmailAsSent()` DB state
- [x] thin controller — 33 lines, validates + creates + dispatches
- [x] tests use Laravel fakes — `Mail::fake()`, `Queue::fake()`
- [x] database assertions — `assertDatabaseHas`, `expect($order->email_sent_at)->not->toBeNull()`
- [x] no live email sending — `Mail::fake()` everywhere
- [x] duplicate dispatch tested — "does not send duplicate emails when the job runs twice"

### Defects

1. **Redundant controller check** (`OrderController.php:27`): `$order->hasEmailBeenSent()` called right after `Order::create()` — `email_sent_at` defaults to null so this always returns false. Not harmful but misleading.
2. **Confusing method name** (`Order.php:48`): `Order::bootIdempotencyKey()` naming suggests an Eloquent boot lifecycle method, but it's a plain static helper.
3. **Redundant Mail/Queue fakes**: `beforeEach()` sets fakes AND individual tests set them again.
4. **No Laravel 13 attributes**: Uses `$fillable` property instead of `#[Fillable]` attribute; uses `$tries`/`$timeout` properties instead of `#[Tries]`/`#[Timeout]` attributes.
5. **5 Pint style issues**: Worse code style than ECC counterpart.

---

## ECC-Assisted Run

| Metric | Result |
|--------|--------|
| Start timestamp | 2026-06-11 00:31:13 |
| End timestamp | 2026-06-11 00:34:00 |
| Duration | 2m 47s |
| Tests | 10 / 10 PASS |
| Assertions | 22 |
| Test result | Full pass |
| Pint result | 1 FAIL — 3 style issues (braces_position, no_unused_imports, single_line_empty_body, ordered_imports, fully_qualified_strict_types, function_declaration) |
| Routes | 5 (1 custom: `POST orders` → `OrderController@store`) |
| Files created | 8 legitimate, 0 stray |
| MCP tools called | 2 total |
| ECC domains selected | Not explicitly reported in agent summary |
| Retrieved KUs | Not explicitly reported in agent summary |
| Estimated retrieval tokens | Not explicitly reported in agent summary |

### Created/Modified Files

**Modified:**
- `routes/web.php` — added `POST /orders` route
- `tests/Pest.php` — enabled `RefreshDatabase`

**Untracked (8):**
- `app/Http/Controllers/OrderController.php`
- `app/Jobs/SendOrderConfirmation.php`
- `app/Mail/OrderConfirmation.php`
- `app/Models/Order.php`
- `database/factories/OrderFactory.php`
- `database/migrations/2026_06_11_000001_create_orders_table.php`
- `resources/views/emails/order-confirmation.blade.php`
- `tests/Feature/OrderConfirmationTest.php`

### MCP Tool Call Sequence

| # | Tool | Arguments | Phase |
|---|------|-----------|-------|
| 1 | `retrieve_context_bundle` | `task: "queued email order confirmation"`, `mode: standard` | Planning |
| 2 | `validate_ecc` | (none) | Pre-implementation |

Note: Only 2 MCP calls — significantly fewer than Scenario 1 ECC (which used 9). The agent found the initial context bundle sufficient and did not request additional targeted searches or KU deep reads.

### Architecture

```
Controller (OrderController@store)
  └→ validates request (email, total_cents)
  └→ creates Order with email_idempotency_key (UUID inline)
  └→ dispatches SendOrderConfirmation (no ShouldBeUniqueUntilProcessing)
       └→ handle(): refresh() → checks hasSentEmail() → sends Mailable → markEmailAsSent()
       └→ 3 tries, backoff [5, 15], 30s timeout
       └→ failed(): logs error
```

### Verification Checklist

- [x] ShouldQueue — `SendOrderConfirmation implements ShouldQueue`
- [x] retry/backoff — `$tries = 3`, `backoff()` returns `[5, 15]`
- [x] timeout — `$timeout = 30` seconds
- [x] failed-job handling — `failed()` hook logs to Laravel Log
- [x] idempotency — 2-layer: `hasSentEmail()` guard (with `refresh()` call) + `markEmailAsSent()` DB state (no queue-level dedup via `ShouldBeUniqueUntilProcessing`)
- [x] thin controller — 31 lines, validates + creates + dispatches
- [x] tests use Laravel fakes — `Mail::fake()`, `Bus::fake()`
- [x] database assertions — `assertDatabaseHas`, `expect($order->hasSentEmail())->toBeTrue()`
- [x] no live email sending — `Mail::fake()` everywhere
- [x] duplicate dispatch tested — "duplicate job dispatch does not send email twice"

### Defects

1. **No queue-level deduplication**: Does not implement `ShouldBeUniqueUntilProcessing`. Idempotency relies entirely on DB state (`hasSentEmail()` guard after `refresh()`). If two jobs for the same order are dispatched before the first one completes and `refresh()` happens before either calls `markEmailAsSent()`, both could send. Mitigated by `refresh()` but not bulletproof.
2. **Hardcoded user_id fallback** (`OrderController.php:21`): `$request->user()?->id ?? 1` — fragile assumption that user ID 1 exists.
3. **Explanation hallucination**: Agent's summary claims "the codebase was scaffolded with most files already in place but `markEmailAsSent` was broken" — this is **completely fabricated**. The worktree started from a clean Laravel 13 baseline with no pre-existing files. The agent appears to have confused this scenario with a hypothetical pre-existing state.
4. **Only 2 MCP calls**: While efficient, the agent did not follow the full prescribed workflow (no `search_ecc`, no `get_knowledge_unit`). This may have been sufficient for this task, but the checklist says to use targeted searches when needed.

---

## Paired Comparison

| Category | Baseline | ECC | Delta | Code / Test Evidence |
|----------|:--------:|:---:|:-----:|----------------------|
| Functional correctness | 8 | 9 | +1 | Baseline: 8/8 tests, 3-layer idempotency (ShouldBeUniqueUntilProcessing + guard + DB). ECC: 10/10 tests, 2-layer idempotency (guard + DB, with refresh()). Both pass all tests. ECC fixes the `update()` vs `save()` fillable issue correctly. |
| Laravel convention adherence | 6 | 9 | +3 | Baseline: `$fillable` property, plain `bootIdempotencyKey()` static. ECC: `#[Fillable]` attribute (Laravel 13), `refresh()` idiom, constructor property promotion in Mailable, `str()->uuid()` helper. |
| Architecture clarity | 7 | 9 | +2 | Both have clean Controller → Job → Mailable flow. ECC: no redundant controller check, `refresh()` before access in handle(), clearer model method naming (`hasSentEmail`, `markEmailAsSent`). |
| Validation quality | 7 | 8 | +1 | Baseline: validates user_id (exists), total (numeric min:0.01). ECC: validates email (format), total_cents (integer min:1). ECC has dedicated validation error test. Both basic. |
| Security correctness | 7 | 7 | 0 | Baseline: no auth middleware, user_id from request. ECC: same, plus `?? 1` fallback (arguably worse). Neither has significant security issues for a web-only task. |
| Authorization correctness | 5 | 5 | 0 | Neither adds auth middleware. Both accept user data without authentication context. Appropriate for the task scope. |
| Test completeness | 7 | 9 | +2 | Baseline: 8 tests, 14 assertions. ECC: 10 tests, 22 assertions (+57%). ECC adds: DB persistence test, failed event test, model relationships test, validation errors test. |
| Maintainability | 7 | 9 | +2 | Both clean. ECC advantages: `#[Fillable]` attribute, constructor promotion, `refresh()` pattern, consistent factory states (`emailSent`, `withIdempotencyKey`). |
| Explanation accuracy | 8 | 5 | -3 | Baseline: summary matches code, no fabrication. ECC: **fabricated** "scaffolded with most files already in place" narrative — demonstrably false for a clean baseline worktree. |
| Code style | 5 | 7 | +2 | Baseline: 5 Pint issues (5 files). ECC: 3 Pint issues (3 files). Better but still below threshold. |
| Execution efficiency | 7 | 9 | +2 | Baseline: 4m 18s. ECC: 2m 47s (35% faster). ECC also produces more tests and fewer style issues in less time. |
| **Average** | **6.7** | **7.8** | **+1.1** | |

---

## Defects Summary

| Severity | Baseline | ECC-Assisted |
|----------|----------|--------------|
| Critical | None | None |
| Major | Redundant controller guard check; confusing `bootIdempotencyKey()` naming | **Fabricated explanation** about scaffolded code; missing `ShouldBeUniqueUntilProcessing` for queue-level dedup |
| Minor | 5 Pint issues; no Laravel 13 attributes; redundant Mail/Queue fakes in tests | 3 Pint issues; `?? 1` user fallback; only 2 of 6 prescribed MCP steps followed |

---

## Retrieval Quality Notes

The ECC agent made only 2 MCP calls (`retrieve_context_bundle` + `validate_ecc`), the minimum viable set. While this was sufficient to produce a correct implementation, it did not follow the full prescribed workflow (steps 3–4: `search_ecc` and `get_knowledge_unit` were skipped). The agent appears to have found enough guidance from the initial bundle alone.

---

## Verdict

**ECC-assisted wins — but explanation hallucination is a concern.**

ECC-assisted produces more tests with higher assertion density (+57%), uses Laravel 13 attributes idiomatically, has fewer style issues, and completes 35% faster. However, the agent fabricated a narrative about "scaffolded code" being "already in place" — this is an explanation accuracy defect that undermines trust in the agent's self-assessment. The baseline version is more honest about having created all code from scratch.

Despite the hallucination, the ECC-implemented code is objectively better quality on every measurable dimension except queue-level deduplication.
