# Rule 1: enable-global-after-commit-default
Set `queue.after_commit = true` globally — negligible performance cost, eliminates transaction-visibility races.

# Rule 2: use-explicit-after-commit-false-for-immediate-dispatch
When the global default is `true`, use `afterCommit(false)` to explicitly opt out.

# Rule 3: test-rollback-scenarios
Verify jobs are discarded when a transaction rolls back to prevent duplicate processing.

# Rule 4: monitor-dispatch-delays
Track the gap between dispatch registration and queue push to catch long-transaction issues.

# Rule 5: understand-nested-transaction-semantics
In nested transactions, only the outermost commit triggers `afterCommit` dispatches.
