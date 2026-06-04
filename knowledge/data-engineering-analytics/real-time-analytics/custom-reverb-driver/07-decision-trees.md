# Decision Trees: Custom Reverb Broadcasting Driver Development

## Decision: Redis vs Custom Driver

**Q: Is Redis already deployed and meeting performance requirements?**
- Yes → Use Reverb's built-in Redis driver (simplest, best supported)
- No → Consider custom driver

**Q: Does the organization have existing message broker infrastructure (NATS, RabbitMQ)?**
- Yes → Custom driver to leverage existing investment
- No → Redis is the default choice

## Decision: Transport Selection

**Q: What is the primary requirement?**
- Maximum throughput / lowest latency → NATS
- Rich routing and queueing → RabbitMQ
- Cloud-native, fully managed → SQS or Google Pub/Sub
- Single-server, no cross-process → In-process IPC
