# Phase 11.3 — Retrieval Quality Report

## Was `retrieve_context_bundle` useful?

Yes. The agent successfully used the context bundle to structure the implementation with correct Laravel patterns (API Resource, cursor pagination, Form Requests, Actions, Policy, AuthServiceProvider).

## Was deep mode too large for this task?

Yes. The initial deep bundle was ~31K tokens, which is excessive for a standard CRUD API implementation. A standard mode bundle (~6-10K tokens) would likely have provided sufficient context, with targeted `get_knowledge_unit` calls for specific patterns.

## Did retrieved guidance improve structure?

Yes. ECC-guided improvements over baseline include:
- Dedicated `AuthServiceProvider` instead of mixing policy registration into `AppServiceProvider`
- Configurable `per_page` cursor pagination instead of hardcoded value
- Explicit create payload mapping in action class
- `HasMiddleware` for clean middleware registration on controller
- More complete `ProductPolicy` with `viewAny` and `view` methods

## Which important rule was missed?

The most critical missed guidance: **authentication is not authorization**. The ECC retrieval provided guidance on creating and registering a ProductPolicy but did not emphasize that endpoints must actively enforce policies. The agent created the policy and registered it via AuthServiceProvider but never called `$this->authorize()` on any endpoint.

The ECC security-identity-engineering domain on authentication and authorization should have emphasized endpoint-level policy enforcement as a non-negotiable step.

## Did ECC retrieve or emphasize endpoint-level policy enforcement?

**No.** Despite the Policy being created and registered, no retrieved guidance appears to have emphasized that:
- `$this->authorize(...)` must be called on each write endpoint
- The base Controller must use `AuthorizesRequests` trait (or use the `Illuminate\Routing\Controllers\HasMiddleware` equivalent for authorization)
- `can:` middleware can be used at route level
- Form Request `authorize()` methods should invoke the policy (or the authorization check should be at the controller/route level)

## Were canonical KU IDs easy to use?

**No.** The agent attempted `get_knowledge_unit` with non-canonical IDs:
- `cursor-based-pagination` — likely should be `cursor-pagination` or similar
- `model-serialization` — not a valid KU ID
- `data-backfill-best-practices` — not a valid KU ID

These calls failed silently or returned no results, forcing the agent to rely on the initial context bundle.

## Should MCP search results provide copyable canonical IDs?

**Yes.** `search_ecc` results should expose canonical KU IDs clearly (e.g., in the result metadata) so that agents can directly call `get_knowledge_unit` with the correct ID on the first attempt.

## Should default mode remain standard rather than deep for CRUD?

**Yes.** The default retrieval mode for CRUD implementation tasks should remain `standard`. Deep mode should be reserved for complex cross-domain tasks. The experiment suggests standard mode would have been sufficient and would have reduced context window consumption.

## Targeted Backlog

1. **Add or strengthen ECC guidance on policy enforcement:**
   - Authentication is not authorization.
   - Creating and registering a Policy is insufficient.
   - Endpoints must enforce Policies using:
     - `$this->authorize(...)` in controllers
     - Form Request `authorize()` methods
     - `can:` route middleware
     - or another explicit Laravel authorization mechanism.

2. **Add retrieval benchmark:**
   - Build CRUD API with ProductPolicy and verify endpoint-level policy enforcement.

3. **Add anti-pattern:**
   - `Registered-but-unused-policy` — creating and registering a policy without endpoint enforcement.

4. **Add checklist item:**
   - Verify API endpoints invoke Policy methods, not only auth middleware.

5. **Improve MCP search result metadata:**
   - `search_ecc` results should expose canonical KU IDs clearly for direct `get_knowledge_unit` calls.

6. **Review bundle sizing:**
   - CRUD implementation should default to `standard` mode before `deep` mode.

7. **Add endpoint-level negative policy tests to generated guidance.**
