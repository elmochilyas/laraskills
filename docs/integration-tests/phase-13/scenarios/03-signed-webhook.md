# Scenario 3 — Signed Webhook with Replay Protection

## Summary

| Aspect | Value |
|--------|-------|
| Scenario | HMAC-signed webhook endpoint with replay protection and idempotent dispatch |
| Prompt | `prompts/03-signed-webhook.txt` |
| Baseline worktree | `<lab-root>/worktrees/03-signed-webhook-baseline` |
| ECC worktree | `<lab-root>/worktrees/03-signed-webhook-ecc-assisted` |
| Model | `opencode/deepseek-v4-flash-free` |
| Status | **Complete** |

---

## Baseline Run

| Metric | Result |
|--------|--------|
| Start timestamp | 2026-06-11 00:38:15 |
| End timestamp | 2026-06-11 00:41:46 |
| Duration | 3m 31s |
| Tests | 8 / 8 PASS |
| Assertions | 22 |
| Test result | Full pass |
| Pint result | 1 FAIL — 2 style issues (concat_space, not_operator_with_successor_space) in 2 files |
| Routes | 5 (1 custom: `POST api/webhook` → `WebhookController`) |
| Files created | 6 legitimate |

### Created/Modified Files

**Modified:**
- `routes/api.php` — added `POST /api/webhook` route
- `config/services.php` — added `webhook.secret` config
- `tests/Pest.php` — added `RefreshDatabase` to Feature group

**Untracked (6):**
- `app/Http/Controllers/WebhookController.php`
- `app/Http/Requests/WebhookRequest.php`
- `app/Jobs/HandlePaymentWebhookJob.php`
- `app/Models/ProcessedWebhookEvent.php`
- `database/migrations/2025_01_01_000003_create_processed_webhook_events_table.php`
- `tests/Feature/WebhookTest.php`

### Architecture

```
Request → POST api/webhook
  → WebhookRequest (validates: event_id, event_type, timestamp, data, signature)
  → WebhookController::__invoke
      1. Check timestamp within ±300s of server time → 403 if expired
      2. Check event_id uniqueness in DB → 200 "Event already processed" if duplicate
      3. Compute HMAC: hash_hmac('sha256', "timestamp.eventId.eventType.json_encode(data)", secret)
      4. Compare via hash_equals() → 403 if mismatch
      5. Create ProcessedWebhookEvent record
      6. Dispatch HandlePaymentWebhookJob
      7. Return 200 {"message": "Webhook received"}
```

### Verification Checklist

- [x] Route: `POST api/webhook` in `routes/api.php`
- [x] Signature via headers: No — signature passed in JSON body
- [x] HMAC algorithm: SHA-256 via `hash_hmac`
- [x] Timing-safe comparison: `hash_equals()` on line 31 of controller
- [x] Timestamp tolerance: ±300 seconds (line 19)
- [x] Replay protection: event_id unique constraint in DB + duplicate check before processing
- [x] Job dispatch after all verification: `HandlePaymentWebhookJob::dispatch()` at line 44
- [x] Tests: 7 Feature tests — valid, invalid signature, expired, replayed old timestamp, duplicate event_id, missing fields
- [x] Tests use `Queue::fake()`, assertPushed / assertNotPushed

### Defects

1. **`json_encode` non-determinism** (baseline, line 28): `json_encode($data)` without options — PHP arrays do not guarantee key order, so different platforms/serializers could produce different output, breaking the HMAC. Should use `JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE` and `ksort()` for canonical JSON.
2. **No `ctype_digit` guard on timestamp**: Casting `$timestamp` to `(int)` without validating it's numeric first — a non-numeric string silently becomes 0, potentially passing the tolerance check.
3. **Empty `handle()` in job** (`HandlePaymentWebhookJob.php:19-22`): The dispatched job has an empty `handle()` — it's a placeholder with no actual behavior. Acceptable given the scope, but the baseline marks the event as `processed` in the controller before dispatch, not in the job.

---

## ECC-Assisted Run

| Metric | Result |
|--------|--------|
| Start timestamp | 2026-06-11 00:44:08 |
| End timestamp | 2026-06-11 00:46:37 |
| Duration | 2m 29s |
| Tests | 8 / 8 PASS |
| Assertions | 18 |
| Test result | Full pass |
| Pint result | 1 FAIL — 7 style issues in 3 files (WebhookController: concat_space, no_unused_imports, not_operator_with_successor_space; ProcessPaymentWebhook: braces_position, no_unused_imports, single_line_empty_body; WebhookTest: concat_space) |
| Routes | 5 (1 custom: `POST api/webhooks/payment` → `WebhookController`) |
| Files created | 7 legitimate |

### Created/Modified Files

**Modified:**
- `routes/web.php` — added `POST api/webhooks/payment` route
- `config/services.php` — added `payment_webhook.secret` and `payment_webhook.tolerance`
- `tests/Pest.php` — added `RefreshDatabase` to Feature group

**Untracked (7):**
- `app/Http/Controllers/WebhookController.php`
- `app/Http/Requests/StoreWebhookRequest.php`
- `app/Jobs/ProcessPaymentWebhook.php`
- `app/Models/WebhookEvent.php`
- `database/migrations/2025_01_01_000001_create_webhook_events_table.php`
- `tests/Feature/WebhookTest.php`
- `resources/views/webhook_events.blade.php` (stub — not referenced)

### MCP Tool Call Sequence

| # | Tool | Arguments | Phase |
|---|------|-----------|-------|
| 1 | `retrieve_context_bundle` | `task: "signed webhook replay protection"`, `mode: standard` | Planning |
| 2 | `validate_ecc` | (none) | Pre-implementation |

Note: Only 2 MCP calls — identical pattern to Scenario 2 ECC. The agent reported "search_ecc and get_knowledge_unit were not needed; the bundle was sufficient."

### Architecture

```
Request → POST api/webhooks/payment
  → StoreWebhookRequest (validates: event_id, type, data)
  → WebhookController::__invoke
      1. Extract X-Webhook-Signature and X-Webhook-Timestamp headers → 400 if missing
      2. Validate timestamp with ctype_digit() guard → ±300s tolerance → 401 if expired
      3. Compute HMAC: hash_hmac('sha256', "timestamp.rawBody", secret)
      4. Compare via hash_equals() → 401 if mismatch
      5. Cache replay check: `webhook_replay:{timestamp}:{md5(body)}` → 401 if present
      6. DB event_id uniqueness check → 200 "duplicate" if exists
      7. Create WebhookEvent (status: pending)
      8. Set cache key for replay (300s TTL)
      9. Dispatch ProcessPaymentWebhook
      10. Return 200 {"status": "ok"}
```

### Verification Checklist

- [x] Route: `POST api/webhooks/payment` via invokable controller
- [x] Signature via headers: Yes — `X-Webhook-Signature`, `X-Webhook-Timestamp`
- [x] HMAC algorithm: SHA-256 via `hash_hmac`
- [x] Timing-safe comparison: `hash_equals()` on line 76 of controller
- [x] Raw body signing: `$request->getContent()` — no re-encoding risk
- [x] Timestamp tolerance: ±300 seconds with `ctype_digit()` guard
- [x] Replay protection: **Dual-layer** — Cache (timestamp + body MD5, 300s TTL) + DB (event_id unique constraint)
- [x] Job dispatch after all verification: `ProcessPaymentWebhook::dispatch()` at line 55
- [x] Job actually works: Sets `status = 'processed'` and `processed_at = now()` in `handle()`
- [x] Tests: 7 Feature tests — valid, invalid signature, expired, replay, duplicate event_id, missing headers
- [x] No live queue dependency: `QUEUE_CONNECTION=sync` in phpunit.xml handles inline execution

### Defects

1. **No `Queue::fake()` usage**: Tests rely on `QUEUE_CONNECTION=sync` for immediate execution, meaning the job runs inline during tests. This works but prevents assertions like `Queue::assertPushed`. The baseline's `Queue::fake()` approach is more explicit.
2. **Only 2 MCP calls**: While the agent reported the bundle was sufficient, the full prescribed workflow (steps 3–4: `search_ecc`, `get_knowledge_unit`) was not followed. No harm in this case, but inconsistent with procedure.
3. **Extra stub view**: `resources/views/webhook_events.blade.php` was created but never referenced — dead file.
4. **Fewer assertions than baseline**: 18 (ECC) vs 22 (baseline). ECC lacks separate "replayed old timestamp" and "missing required fields 422" tests.

---

## Paired Comparison

| Category | Baseline | ECC | Delta | Code / Test Evidence |
|----------|:--------:|:---:|:-----:|----------------------|
| Functional correctness | 8 | 9 | +1 | Both pass 8/8 tests. Baseline: `json_encode($data)` non-determinism breaks HMAC if key order changes. ECC: `$request->getContent()` raw body signing is the industry-standard approach used by Stripe/GitHub/Slack. |
| Laravel convention adherence | 7 | 8 | +1 | Both use `$fillable` property. ECC: invokable controller, `StoreWebhookRequest` naming (RESTful convention). Baseline: generic `WebhookRequest` name. ECC route `api/webhooks/payment` is more RESTful than baseline's `api/webhook`. |
| Architecture clarity | 7 | 9 | +2 | ECC: dual-layer replay protection (cache + DB) is more robust. Header-based signing separates transport security from payload. `ctype_digit()` guard on timestamp. Job actually does meaningful work. Baseline: `json_encode` in signature (fragile), empty job `handle()`. |
| Validation quality | 7 | 8 | +1 | Baseline: validates 5 fields in body, 422 on empty. ECC: validates 3 body fields + header guard (400 if missing). ECC missing a "required fields → 422" test. Both decent. |
| Security correctness | 7 | 9 | +2 | Baseline: `hash_equals()` ✓, ±300s ✓, event_id dedup ✓. **Defects**: `json_encode` non-determinism for HMAC payload; no `ctype_digit` guard; stores `$request->all()` as payload (includes internal fields like `signature`). ECC: `hash_equals()` ✓, `ctype_digit()` guard ✓, raw body signing ✓, dual-layer replay protection ✓, proper `$validated['data']` only in payload. |
| Authorization correctness | 7 | 7 | 0 | Neither adds auth middleware — webhooks are external by design. Both use `authorize(): true` in FormRequest. Appropriate for a public webhook endpoint. |
| Test completeness | 8 | 7 | -1 | Baseline: 22 assertions, `Queue::assertPushed/assertNotPushed`, separate replayed-timestamp test. ECC: 18 assertions, no queue assertions, fewer test variants. Baseline has better test coverage despite equal test count. |
| Maintainability | 7 | 8 | +1 | Both clean and readable. ECC advantages: `ctype_digit()` guard, dual-layer replay as separate private methods, job updates DB state. Baseline advantages: body-based signature simpler to understand, but fragile. |
| Explanation accuracy | 8 | 8 | 0 | Both accurate. ECC accurately reported "the bundle was sufficient" and described the implementation honestly — **no hallucination** (unlike Scenario 2 ECC). |
| Code style | 7 | 5 | -2 | Baseline: 2 style issues in 2 files. ECC: 7 style issues in 3 files (+250%) — including unused imports, brace position, empty body style. ECC noticeably worse. |
| Execution efficiency | 8 | 9 | +1 | Baseline: 3m 31s. ECC: 2m 29s (29% faster). Both produce comparable outputs. |
| **Average** | **7.4** | **7.9** | **+0.5** | |

---

## Defects Summary

| Severity | Baseline | ECC-Assisted |
|----------|----------|--------------|
| Critical | None | None |
| Major | `json_encode` non-determinism in HMAC payload; empty job `handle()` | No `Queue::assertPushed` in tests (relies on sync queue); dead view file |
| Minor | No `ctype_digit` guard; `$request->all()` in payload; 2 Pint issues | 7 Pint issues; only 2 of 6 prescribed MCP steps; 18 assertions vs baseline's 22 |

---

## Retrieval Quality Notes

The ECC agent made only 2 MCP calls (`retrieve_context_bundle` + `validate_ecc`), identical to Scenario 2. The agent explicitly noted "search_ecc and get_knowledge_unit were not needed; the bundle was sufficient." The implementation is correct and follows industry-standard webhook signing patterns (header-based HMAC, raw body signing, dual-layer replay protection). No explanation hallucination — a clear improvement over Scenario 2.

---

## Verdict

**ECC-assisted wins — solid implementation, no hallucination.**

ECC uses header-based HMAC signing (the industry standard — Stripe, GitHub, Slack all use this pattern), raw body signing via `$request->getContent()` (avoiding `json_encode` non-determinism), dual-layer replay protection (cache + DB), and a `ctype_digit()` timestamp guard. The baseline's `json_encode`-based HMAC is a real bug if the sender serializes keys in a different order.

ECC is weaker on test coverage (18 assertions vs 22, no Queue fakes) and style (7 Pint issues vs 2), but these are fixable. The architectural decisions (header signatures, raw body, dual-layer replay) are objectively superior and follow real-world webhook best practices.
