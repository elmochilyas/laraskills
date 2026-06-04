# Worker Scaling Rules

## Rule 1: Scale Workers on SQS Queue Depth
- **Category**: Performance
- **Rule**: Use SQS ApproximateNumberOfMessagesVisible as the primary metric for worker auto-scaling
- **Reason**: Queue depth directly reflects job backlog and processing demand; scaling on CPU or memory does not correlate with queue processing needs
- **Bad Example**: Scaling workers based on EC2 CPU utilization—CPU stays low while queue depth grows to 10K because workers are waiting on database I/O
- **Good Example**: Target tracking on ApproximateNumberOfMessagesVisible to maintain a target queue depth (e.g., 1000 messages)
- **Exceptions**: CPU-bound jobs (image processing, PDF generation) may benefit from CPU-based worker scaling as a secondary metric
- **Consequences Of Violation**: Workers not scaling when needed (jobs backlog) or scaling when not needed (false CPU spikes)

## Rule 2: Set Minimum Workers to 1
- **Category**: Reliability
- **Rule**: Always configure auto-scaling with min=1 worker to prevent cold-start delays
- **Reason**: Cold start from 0 workers adds 2-5 minutes (EC2) or 30-60 seconds (Fargate) before the first job can be processed; this delay is unacceptable for most applications
- **Bad Example**: Setting min=0 workers; first job of the day waits 5 minutes for EC2 instance boot, Docker pull, and worker initialization
- **Good Example**: Setting min=1 worker; that worker starts processing immediately while ASG scales up additional workers
- **Exceptions**: Development/staging environments where processing latency is not critical
- **Consequences Of Violation**: 2-5 minute delay for every burst of jobs; poor user experience for time-sensitive operations

## Rule 3: Use Step Scaling for Large Backlogs
- **Category**: Performance
- **Rule**: Implement step scaling to add workers proportionally to backlog size
- **Reason**: Small backlogs only need a few extra workers; large backlogs need rapid catch-up; step scaling avoids both under- and over-reaction
- **Bad Example**: Adding the same number of workers (2) regardless of whether backlog is 500 or 50,000 messages
- **Good Example**: Adding 2 workers at depth 500, 4 at depth 2000, 8 at depth 10000, scaling response to demand magnitude
- **Exceptions**: Applications with stable, predictable loads may use simple target tracking instead of step scaling
- **Consequences Of Violation**: Under-scaling for large backlogs (backlog grows faster than workers can process) or over-scaling for small backlogs

## Rule 4: Set Scale-In Cooldown to 300+ Seconds
- **Category**: Reliability
- **Rule**: Configure scale-in cooldown to 300 seconds minimum
- **Reason**: Terminating workers mid-job triggers SQS visibility timeout; wasted processing and delayed job completion; 5-minute cooldown ensures current work completes before removing capacity
- **Bad Example**: 60-second scale-in cooldown; workers terminated in the middle of processing because queue depth temporarily dropped below threshold
- **Good Example**: 300-second cooldown; workers finish in-flight jobs before ASG considers scale-in
- **Exceptions**: Queues with very short jobs (<500ms) may use 120-second cooldown
- **Consequences Of Violation**: Wasted compute from partially processed jobs; increased latency from SQS retries

## Rule 5: Monitor Job Processing Time Per Worker
- **Category**: Performance
- **Rule**: Track average job duration per worker to calculate optimal worker count using formula: workers_needed = jobs_per_second × avg_job_duration_seconds
- **Reason**: Scaling blindly without job duration data leads to under- or over-provisioning; knowing job duration enables accurate capacity planning
- **Bad Example**: Running 5 workers when the workload requires 15 (jobs_per_second=50 × avg_duration=300ms = 15 workers); backlog grows indefinitely
- **Good Example**: Monitoring job duration and adjusting target queue depth or worker count to match processing capacity
- **Exceptions**: Very stable workloads where scaling has been empirically validated over time
- **Consequences Of Violation**: Chronic backlog growth despite adequate worker count on paper, or excess workers despite low throughput

## Rule 6: Use Queue-Specific Scaling Policies
- **Category**: Architecture
- **Rule**: Configure separate scaling policies for priority queues vs batch queues
- **Reason**: High-priority jobs (email, payments) need faster scaling response with lower thresholds; batch jobs (reports, cleanup) can tolerate longer processing times and cooldowns
- **Bad Example**: Using the same scaling policy for both password reset emails and log cleanup—both scale identically
- **Good Example**: High-priority: add workers at backlog=100, cooldown=120s; Batch: add workers at backlog=1000, cooldown=300s
- **Exceptions**: Applications with only one queue type or uniform latency requirements
- **Consequences Of Violation**: High-priority jobs delayed because scaling thresholds are tuned for batch processing latency
