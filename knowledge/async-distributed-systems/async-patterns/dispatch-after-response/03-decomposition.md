# Decomposition: dispatchAfterResponse for Post-Response Execution

## Topic Overview

`dispatchAfterResponse` runs a job synchronously in the same HTTP request lifecycle but after the response has been sent to the client. The job executes while the connection is still open but the client has already received the response body.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k062-dispatch-after-response/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### dispatchAfterResponse for Post-Response Execution
- **Purpose:** `dispatchAfterResponse` runs a job synchronously in the same HTTP request lifecycle but after the response has been sent to the client. The job executes while the connection is still open but the client has already received the response body.
- **Difficulty:** Intermediate
- **Dependencies:** - K063 dispatchIf/dispatchUnless (conditional dispatch alternatives)

## Dependency Graph

This KU depends on: - K063 dispatchIf/dispatchUnless (conditional dispatch alternatives)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Post-response execution**: PHP's fastcgi_finish_request mechanism sends the response while the script continues running. `dispatchAfterResponse` hooks into this behavior. - **Same process, deferre...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent queue/event patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization