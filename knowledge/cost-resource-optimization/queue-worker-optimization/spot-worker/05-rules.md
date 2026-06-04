# Spot Worker Rules

## Rule 1: Use Spot for All Queue Workers
- **Category**: Cost Management
- **Rule**: Always default to Spot instances (EC2 Spot or Fargate Spot) for queue worker fleets
- **Reason**: Queue workers are inherently fault-tolerant—SQS visibility timeout ensures interrupted jobs are automatically retried; Spot saves 60-90% on compute cost
- **Bad Example**: Running 10 queue workers on On-Demand instances at $500/month when Spot would cost $150/month for identical processing capacity
- **Good Example**: Configuring worker ASG with Spot instances and mixed instances policy; jobs automatically retry on interruption
- **Exceptions**: Workers that cannot tolerate any interruption (real-time processing with sub-second SLAs)
- **Consequences Of Violation**: Paying 3-10x more for queue compute than necessary

## Rule 2: Implement Graceful Shutdown Handler
- **Category**: Reliability
- **Rule**: Always implement SIGTERM handling in Spot workers to finish the current job before exit
- **Reason**: Spot instances receive a 2-minute termination warning; catching SIGTERM allows the worker to complete the in-flight job and delete it from SQS, preventing unnecessary retries
- **Bad Example**: Worker interrupted mid-job; SQS visibility timeout triggers retry, wasting the partial processing done so far
- **Good Example**: Worker catches SIGTERM via `pcntl_signal(SIGTERM, fn() => $worker->stop())`, finishes current job, deletes from SQS, exits cleanly
- **Exceptions**: Very short jobs (<1 second) that complete before SIGTERM handler executes
- **Consequences Of Violation**: Wasted compute on partially processed jobs; increased job latency due to re-processing

## Rule 3: Use Mixed Instances Policy (70% Spot, 30% On-Demand)
- **Category**: Reliability
- **Rule**: Configure worker Auto Scaling Groups with a mixed instances policy: 70% Spot, 30% On-Demand
- **Reason**: Spot handles the bulk of processing cost-effectively; On-Demand provides guaranteed baseline capacity when Spot is scarce or prices spike
- **Bad Example**: Running 100% Spot with no On-Demand fallback; when Spot capacity is unavailable, no workers exist to process jobs
- **Good Example**: ASG with mixed policy: On-Demand base = 30% of desired capacity, Spot = remaining 70%; if Spot is unavailable, On-Demand handles the load
- **Exceptions**: Development environments where reliability is not critical may use 100% Spot
- **Consequences Of Violation**: Complete processing outage during Spot capacity shortages; or 100% On-Demand cost if avoiding risk entirely

## Rule 4: Diversify Instance Types and Availability Zones
- **Category**: Reliability
- **Rule**: Use 3+ instance types across 2+ Availability Zones in the Spot worker fleet
- **Reason**: Spot capacity is per-instance-type per-AZ; diversification dramatically reduces interruption risk by providing fallback options
- **Bad Example**: Using only m7g.large in us-east-1a; if that pool has no Spot capacity, 100% of workers are affected
- **Good Example**: Using m7g.large, m7i.large, and m6g.large across us-east-1a and us-east-1b; interruption of one type/AZ has minimal impact
- **Exceptions**: Very small worker fleets (<5 instances) where diversification adds management complexity
- **Consequences Of Violation**: High Spot interruption rates (20%+ per day) causing frequent job reprocessing and throughput degradation

## Rule 5: Chunk Long-Running Jobs for Interruption Safety
- **Category**: Design
- **Rule**: Chunk long-running jobs (>5 minutes) into smaller atomic units with checkpointing
- **Reason**: Interruption of a 30-minute job wastes 30 minutes of compute; chunking into 1-minute units limits wasted compute to 1 minute per interruption
- **Bad Example**: A single job processing 100,000 records sequentially; interruption at record 95,000 wastes 95% of processing
- **Good Example**: The same job processing in 1,000-record chunks; each chunk completes independently, and interruption only wastes the current chunk
- **Exceptions**: Jobs that cannot be meaningfully split due to transactional requirements
- **Consequences Of Violation**: Significant compute waste on Spot interruptions for long-running jobs

## Rule 6: Monitor Spot Interruption Rate
- **Category**: Performance
- **Rule**: Track Spot instance lifecycle events and alert when interruption rate exceeds 10% per day
- **Reason**: High interruption rate indicates Spot capacity pressure; proactive diversification or increased On-Demand % prevents throughput degradation
- **Bad Example**: Spot interruption rate climbs to 30% but goes unnoticed; worker throughput drops by 30% as jobs are constantly interrupted and retried
- **Good Example**: CloudWatch alarm on Spot interruption events; at 10%/day, automatically increase On-Demand base or add instance type diversity
- **Exceptions**: Short-lived Spot capacity crunches during AWS events may temporarily spike; evaluate trend over 1-hour periods
- **Consequences Of Violation**: Unnoticed throughput degradation; jobs take longer to complete as interruptions increase
