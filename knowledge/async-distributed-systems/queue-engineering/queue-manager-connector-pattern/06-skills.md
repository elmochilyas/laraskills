# Skill: Create and Register a Custom Queue Driver Connector

## Purpose
Build a custom queue driver by implementing the Queue contract and registering it via a service provider, enabling non-standard queue backends (RabbitMQ, Kafka, Google Pub/Sub).

## When To Use
When using non-built-in queue backends; when needing driver-specific behavior (e.g., custom SQS message attributes); when extending existing drivers with cross-cutting behavior.

## When NOT To Use
Standard Laravel drivers (Redis, SQS, database) meet your needs; only need different queue names (use existing connection with multiple queues).

## Prerequisites
- Understanding of Manager pattern and ConnectorInterface
- Queue backend SDK/library
- Service provider registration knowledge

## Inputs
- Custom backend connection details
- Queue contract method implementations
- Driver name for configuration

## Workflow
1. Create Connector implementing `ConnectorInterface::connect(array $config): Queue`
2. Create Queue class implementing the full `Illuminate\Contracts\Queue\Queue` contract
3. Implement all required methods: `push()`, `pop()`, `delete()`, `release()`, `size()`
4. Register in service provider `boot()`: `Queue::extend('custom', function () { ... })`
5. Add connection config in `config/queue.php`
6. Connect lazily: defer TCP/HTTP connections inside `connect()`, not in constructor
7. Test with a development queue before production

## Validation Checklist
- [ ] Custom connector returns a full Queue contract implementation
- [ ] All Queue contract methods implemented (push, pop, delete, release, size)
- [ ] Driver registered in service provider boot(), not in routes
- [ ] Connection configured in config/queue.php
- [ ] Lazy connection established (not in constructor)
- [ ] Tested with dispatch and worker processing

## Common Failures
- Partial Queue implementation — runtime error on first push/pop
- Registration in routes instead of service provider — driver not loaded when queue resolves
- Eager connection in constructor — backend established even if unused

## Decision Points
- Register via Queue::extend() in service provider boot
- For complex drivers: create a dedicated ServiceProvider class

## Performance Considerations
- Connection resolution is one-time per connection name — negligible overhead
- Custom connectors should defer actual backend connections
- One connection serves many queues — don't create per-queue connections

## Security Considerations
- Store backend credentials in config, not hardcoded
- Use environment variables for connection details
- Validate input config in connect() to fail fast on misconfiguration

## Related Rules
- Rule 1: custom-connectors-must-return-full-contract
- Rule 2: register-drivers-in-service-provider
- Rule 3: lazy-connect-in-custom-drivers
- Rule 4: one-connection-not-per-queue

## Related Skills
- Configure Queue Driver Architecture
- Configure Queue Connections vs Queues

## Success Criteria
Custom queue driver is registered, connects to the backend only when used, all Queue contract methods work correctly, and jobs can be dispatched and processed through the custom driver.
