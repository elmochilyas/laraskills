# Auto Scaling Workers Rules

## Rule 1: Scale on backlogPerWorker, Not Queue Depth Alone
- **Category**: Performance
- **Rule**: Scale workers based on backlog per worker (queue depth / active workers), not raw queue depth
- **Reason**: 1000 messages with 10 workers = 100 backlog each (fine); 1000 messages with 2 workers = 500 backlog each (need more); backlogPerWorker normalizes scaling for current capacity
- **Bad Example**: Adding 2 workers at depth=1000 regardless of current workers; if 10 workers are already active, adding more over-provisions
- **Good Example**: Scaling when backlogPerWorker exceeds threshold (e.g., >100); adding workers proportionally to backlog above target
- **Exceptions**: Simple applications with stable worker counts may use approximate queue depth targets
- **Consequences Of Violation**: Over-provisioning when many workers already active, or under-provisioning when few workers are active

## Rule 2: Use Mixed Instances Policy (Spot + On-Demand)
- **Category**: Cost Management
- **Rule**: Configure worker ASG with mixed instances policy: 70% Spot, 30% On-Demand
- **Reason**: Workers are fault-tolerant (interruption = SQS retry); Spot saves 70% on compute; On-Demand base ensures capacity if Spot is unavailable
- **Bad Example**: Running workers on 100% On-Demand and paying 3x more for fault-tolerant queue processing
- **Good Example**: ASG with mixed policy: On-Demand base = 30%, Spot = 70%; interruption just triggers SQS retry on another instance
- **Exceptions**: Compliance requirements or instance types not available on Spot
- **Consequences Of Violation**: 3x higher compute costs for worker fleet, or complete outage during Spot capacity shortages

## Rule 3: Set Graceful Shutdown Lifecycle Hook
- **Category**: Reliability
- **Rule**: Configure a lifecycle hook with 60-second timeout for graceful worker shutdown on scale-in
- **Reason**: Scale-in terminates workers mid-job; lifecycle hook sends SIGTERM, worker finishes current job, deletes from SQS, then exits; prevents invisible retries
- **Bad Example**: Workers terminated mid-job during scale-in; SQS visibility timeout causes retries, wasting processing time and delaying completion
- **Good Example**: Lifecycle hook sends SIGTERM; worker catches signal, finishes current message, deletes from SQS, reports complete, exits
- **Exceptions**: Workers with very short jobs (<1 second) where mid-job termination waste is negligible
- **Consequences Of Violation**: Wasted compute from partially processed jobs; increased latency from retries

## Rule 4: Use Per-Queue Scaling Policies
- **Category**: Architecture
- **Rule**: Configure separate scaling policies for each priority queue with different thresholds
- **Reason**: Different queues have different latency requirements; high-priority queues need faster scaling response (backlog=10 triggers add) vs batch queues (backlog=1000 triggers add)
- **Bad Example**: Using a single scaling policy for all queues—email queue and report queue scale identically
- **Good Example**: High-priority adds workers at backlog=10; default adds at backlog=100; batch adds at backlog=1000
- **Exceptions**: Applications with only one queue type or uniform latency requirements
- **Consequences Of Violation**: High-priority jobs delayed because scaling thresholds are tuned for batch processing; or batch processing gets expensive priority treatment

## Rule 5: Set Scale-In Cooldown to 300+ Seconds
- **Category**: Performance
- **Rule**: Configure scale-in cooldown to 300 seconds minimum to prevent rapid scaling oscillation
- **Reason**: Terminating workers mid-job triggers SQS visibility timeout and wasted processing; 5-minute cooldown ensures current work completes before considering scale-in
- **Bad Example**: 60-second scale-in cooldown causes workers to be terminated while still processing the backlog that triggered scale-out
- **Good Example**: 300-second scale-in cooldown allows all in-flight jobs to complete before removing capacity
- **Exceptions**: Queues with very short job durations (<1 second) may use shorter cooldown (120s minimum)
- **Consequences Of Violation**: Workers terminated with inflight jobs; SQS retries cause wasted compute and increased latency

## Rule 6: Set Minimum Workers to 1
- **Category**: Reliability
- **Rule**: Always keep at least 1 worker running (min=1) in auto-scaling configurations
- **Reason**: Prevents cold-start delay; queue processing starts instantly instead of waiting 2-5 minutes for instance boot; $30/month for 1 always-on worker is worth the latency savings
- **Bad Example**: Setting min=0 workers; first job of the day waits 5 minutes for an instance to boot, register with SQS, and start polling
- **Good Example**: Setting min=1 worker; that worker handles initial jobs while ASG scales up additional workers for the backlog
- **Exceptions**: Development environments where minutes of delay is acceptable
- **Consequences Of Violation**: 2-5 minute processing delay for every burst of jobs; poor user experience for time-sensitive operations
