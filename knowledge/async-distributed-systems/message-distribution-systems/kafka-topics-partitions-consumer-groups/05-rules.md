# Rule 1: set-partition-count-for-max-parallelism
Set partition count = max expected consumer group size × 2 for scaling headroom.

# Rule 2: use-meaningful-message-keys
Key messages by entity ID (user, order) to ensure per-partition ordering guarantees.

# Rule 3: commit-offsets-after-processing
Commit offsets after job side effects complete to ensure at-least-once semantics.

# Rule 4: monitor-consumer-lag
Track consumer lag as the primary Kafka health metric for capacity planning.

# Rule 5: set-auto-offset-reset-intentionally
Configure `auto.offset.reset` deliberately — `earliest` for replay, `latest` to skip history.
