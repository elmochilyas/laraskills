# KEDA Scale-to-Zero Workers

## Metadata
- **ID**: KU-45-KEDA-SCALE-TO-ZERO
- **Subdomain**: queue-worker-optimization
- **Domain**: cost-resource-optimization
- **Topic**: KEDA Scale-to-Zero Workers
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
KEDA (Kubernetes Event-Driven Autoscaling) enables scale-to-zero for queue workers — when no queue messages exist, worker pods scale down to zero, incurring zero compute cost. This eliminates the baseline cost of idle queue workers. KEDA integrates with SQS, RabbitMQ, Redis, and 50+ event sources. For Laravel Horizon workers on Kubernetes, KEDA with SQS scaler can reduce worker costs by 60-90% for variable-traffic apps.

## Core Concepts
- **Scale-to-zero**: 0 replicas when no messages in queue
- **Scalers**: SQS, Redis, RabbitMQ, Kafka, 50+ event sources
- **Cooldown period**: Configurable delay before scaling down to prevent thrashing
- **Target metric**: Configurable messages-per-replica (default: 10)
- **Kubernetes-only**: Requires K8s cluster (EKS, AKS, GKE)
- **Polling interval**: How often KEDA checks queue depth

## Best Practices
- **Set cooldown period to 300 seconds**: Prevents scaling thrashing (WHY: rapid scale-in/out increases costs and latency; 300s cooldown ensures brief message bursts don't trigger scale-in during processing)
- **Configure target metric based on processing capacity**: 10 messages/replica for simple jobs, 1-2 for heavy jobs (WHY: target determines how many workers are created per backlog; too high = processing lag; too low = too many workers; match to single-worker throughput)
- **Use SQS scaler for Laravel queue workers**: KEDA's SQS scaler monitors ApproximateNumberOfMessages (WHY: SQS scaler is the most reliable for Laravel apps using SQS queues; it directly scales workers based on queue depth with no additional services needed)
- **Ensure fast worker startup for scale-from-zero**: Worker containers should start in <10 seconds (WHY: KEDA scales from 0 when first message arrives; if startup takes 30 seconds, first message waits 30+ seconds for processing; use minimal base images, pre-warm connection pools)

## Architecture Guidelines
- KEDA requires Kubernetes (EKS, AKS, GKE, or self-managed K8s)
- For ECS/Fargate: use ECS Service Auto Scaling with SQS metric instead of KEDA
- KEDA with SQS scaler for SQS-based queues
- KEDA with Redis scaler for Laravel Horizon (Redis) queues
- Deploy KEDA operator separately from application workloads
- Set min replicas based on acceptable message processing latency

## Related Topics
- SQS Pricing Model (ku-10)
- Fargate Spot Workers (ku-25)
- Auto Scaling Workers (ku-03)

## AI Agent Notes
- Default: 300s cooldown, 10 messages/replica target
- Default: SQS scaler for SQS queues; Redis scaler for Horizon
- Scale-from-zero requires fast container startup (<10s)
- KEDA is Kubernetes-only; use ECS Service Auto Scaling for Fargate
