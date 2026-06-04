# SQS Idle Lambda Polling Cost

## Metadata
- **ID**: KU-13-SQS-IDLE-POLLING
- **Subdomain**: queue-worker-optimization
- **Domain**: cost-resource-optimization
- **Topic**: SQS Idle Lambda Polling
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
An idle SQS queue with Lambda event source mapping generates approximately 1.7 million ReceiveMessage requests per month simply from polling. Lambda polls 5 SQS partitions concurrently with short polling, generating constant requests even when no messages exist. For an idle queue, this costs ~$0.68/month in SQS requests alone, plus Lambda invocation costs for empty responses. With many idle queues, this hidden cost adds up.

## Core Concepts
- **Polling rate**: ~1.7M requests/month for idle queue
- **Cost at idle**: ~$0.68/month for idle SQS requests
- **Above free tier**: Beyond 1M requests, cost = ~$0.68 per idle queue per month
- **Multiple queues**: 50 idle queues = ~$34/month in wasted polling
- **Mitigation**: Long polling, KEDA scale-to-zero, Lambda event filtering

## When To Use
- Monitoring idle queue costs for event-driven architectures
- Estimating true SQS costs before choosing between SQS and alternatives
- Cost allocation: attributing idle polling costs to specific queues

## When NOT To Use
- Ignoring idle polling costs in queue architecture decisions
- Assuming Lambda ESM has zero cost for idle queues
- Short polling for all queues without evaluation

## Best Practices
- **Always use long polling (20s) on SQS queues**: Lambda ESM uses long polling by default, but custom workers need explicit configuration (WHY: long polling reduces empty receives by 95%; from 1.7M to ~85K requests/month; cost drops from $0.68 to $0.03 per idle queue)
- **Use KEDA scale-to-zero for Kubernetes workers**: Scale Lambda consumers to zero when queue is empty (WHY: KEDA monitors queue depth and removes Lambda event source mapping when empty; eliminates idle polling entirely; workers start on demand when messages arrive)
- **Increase batch window for Lambda ESM**: Configure batch_window to 60-300 seconds (WHY: reduces polling frequency; fewer empty receive calls since Lambda accumulates messages over window; adds latency but saves costs for idle/near-idle queues)
- **Remove unused queue mappings**: Periodically audit SQS event source mappings (WHY: queues for disabled features, deprecated services, or test environments still generate idle polling; removing the Lambda mapping eliminates the cost; automate with resource tagging)

## Related Topics
- SQS Pricing Model (ku-10)
- SQS Batching Savings (ku-11)
- SQS Long Polling (ku-12)
- KEDA Scale-to-Zero Workers (ku-45)

## AI Agent Notes
- Default: enable long polling (20s) on all SQS queues
- Default: use Lambda ESM default (it uses long polling)
- Remove unused queue mappings to eliminate idle costs
- 50 idle queues = $34/month in unnecessary polling
