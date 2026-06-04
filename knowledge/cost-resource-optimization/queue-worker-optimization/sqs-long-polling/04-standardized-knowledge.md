# SQS Long Polling

## Metadata
- **ID**: KU-12-SQS-LONG-POLLING
- **Subdomain**: queue-worker-optimization
- **Domain**: cost-resource-optimization
- **Topic**: SQS Long Polling
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
SQS long polling (ReceiveMessageWaitTimeSeconds up to 20s) reduces empty receive costs by eliminating unnecessary polling cycles. Without long polling (short polling), ReceiveMessage returns immediately even if the queue is empty, incurring a billable request. Long polling waits up to 20 seconds for a message to arrive, dramatically reducing the number of empty ReceiveMessage calls.

## Core Concepts
- **Long polling**: Wait up to 20 seconds for messages before returning
- **Short polling**: Returns immediately (including empty responses)
- **Default**: Short polling (no wait time)
- **Savings**: Reduces empty receives by >95% for idle queues
- **Setting**: Queue-level (ReceiveMessageWaitTimeSeconds) or per-request

## When To Use
- All SQS queues (no downside to enabling long polling)
- Idle or low-traffic queues (dramatic cost reduction)
- Combined with batching for maximum SQS cost savings (>90% total)

## When NOT To Use
- Real-time processing where 20-second wait is unacceptable
- Applications requiring immediate notification of empty queues

## Best Practices
- **Set ReceiveMessageWaitTimeSeconds to 20 on all queues**: Maximum wait time = maximum savings (WHY: long polling only affects empty responses; messages are still delivered immediately when available; no latency impact on message processing; just eliminates wasteful polling of empty queues)
- **Combine long polling with batching**: Use both for >95% SQS cost reduction (WHY: batching reduces total request count by 90%; long polling eliminates empty receives; together, they reduce SQS costs by 95-99% for most workloads)
- **Lambda ESM uses long polling by default**: No additional configuration needed for Lambda consumers (WHY: AWS Lambda event source mapping automatically uses long polling with 20s wait time; only EC2/ECS/Fargate workers need explicit configuration)
- **Configure at queue level, not per-request**: Set queue attribute to enforce consistent behavior (WHY: per-request WaitTimeSeconds override is possible but queue-level setting ensures all consumers benefit consistently; prevents consumer-specific configuration drift)

## Related Topics
- SQS Pricing Model (ku-10)
- SQS Batching Savings (ku-11)
- SQS Idle Lambda Polling (ku-13)

## AI Agent Notes
- Default: enable long polling (20s) on ALL SQS queues
- Lambda ESM uses long polling by default; EC2/Fargate workers need explicit config
- No downside to enabling long polling
- Combine with batching for 95-99% SQS cost reduction
