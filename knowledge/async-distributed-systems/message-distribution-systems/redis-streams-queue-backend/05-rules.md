# Rule 1: use-consumer-groups-for-stream-processing
Always use `XREADGROUP` with a consumer group, not `XREAD` alone.

# Rule 2: trim-streams-with-maxlength
Set `MAXLENGTH ~ N` on all streams to prevent unbounded memory growth.

# Rule 3: implement-dead-consumer-detection
Periodically `XCLAIM` entries from idle consumers (>1 hour) to prevent PEL growth.

# Rule 4: enable-aof-for-durable-streams
Enable AOF persistence when Redis streams are used for queued messages.

# Rule 5: separate-redis-instance-for-queues
Use a separate Redis instance for queue streams vs cache to avoid eviction.
