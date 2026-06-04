# Decision Trees — Queued Actions

## Tree 1: Sync vs Async Decision

**Decision Context**: Whether to execute an action synchronously (in the request lifecycle) or dispatch it to a queue for async execution.

**Decision Criteria**:
- Operation duration (<100ms, 100-500ms, >500ms)
- Time sensitivity
- Consistency requirements
- Retry needs

**Decision Tree**:
```
Is the operation duration >500ms?
├── YES → Queue the action — prevent HTTP response delay
└── NO → Is the operation duration between 100-500ms?
    ├── YES → Is the result needed for the HTTP response?
    │   ├── YES → Execute synchronously — queue overhead > execution time for fast operations
    │   └── NO → Queue the action — remove even moderate work from request lifecycle
    └── NO → Is the operation <100ms?
        ├── YES → Execute synchronously — queue dispatch overhead exceeds execution time
        └── NO → Is the operation durable (needs retry on failure)?
            ├── YES → Queue the action — retry capability is valuable
            └── NO → Execute synchronously
```

**Rationale**: Queue when operation time >500ms or when durability/retry is required. Sync execution for fast operations where result is needed immediately.

**Recommended Default**: Queue for operations >500ms. Sync for operations <100ms. Evaluate case-by-case for 100-500ms range.

**Risks**: Queuing fast operations adds ~1-5ms overhead with no benefit. Sync execution of slow operations degrades API response times.

---

## Tree 2: Action-as-Job vs Separate Job Class

**Decision Context**: Whether to make the action class implement ShouldQueue directly or create a separate job class that wraps the action.

**Decision Criteria**:
- Sync + async execution paths for the same action
- Serialization complexity
- Action reuse across contexts

**Decision Tree**:
```
Does the action need both sync and async execution paths?
├── YES → Use a separate job class — action remains pure, job wraps the action for queued execution
└── NO → Is the action only ever executed asynchronously?
    ├── YES → Action implements ShouldQueue — simplified, single class handles the operation
    └── NO → Is the serialization logic complex and separate from business logic?
        ├── YES → Separate job class — keeps action focused on business logic
        └── NO → Action implements ShouldQueue — pragmatic for action-only-async scenarios
```

**Rationale**: Separate job class gives the most flexibility for mixed sync/async execution. Action-as-job is simpler for purely async operations.

**Recommended Default**: Action implements ShouldQueue for purely async operations. Separate job class for mixed sync/async paths.

**Risks**: Action-as-job for mixed paths forces the action to handle both sync and queued concerns. Separate job class adds a file for simple scenarios.
