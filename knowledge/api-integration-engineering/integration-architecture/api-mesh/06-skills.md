# Skill: Design an API Mesh for Service-to-Service Communication

## Purpose
Design and implement an API mesh layer between services that handles routing, transformation, authentication, and resilience for inter-service communication.

## When To Use
- Multiple services communicating via APIs
- Complex service-to-service integration patterns
- Need for centralized integration logic (routing, auth, transformation)
- Decoupling services from direct API dependencies

## When NOT To Use
- Simple point-to-point integrations
- Service mesh at infrastructure level (Istio, Linkerd)

## Prerequisites
- Understanding of microservices patterns
- Service discovery mechanism

## Workflow
1. Identify services and their API dependencies
2. Define integration layer per service
3. Implement service discovery for dynamic endpoints
4. Add routing logic based on service name
5. Apply authentication and authorization per service pair
6. Add request/response transformation
7. Implement resilience: circuit breaker, retry, timeout
8. Add centralized monitoring and logging

## Validation Checklist
- [ ] Service dependencies mapped
- [ ] Integration layer defined per service
- [ ] Service discovery implemented
- [ ] Auth configured per service pair
- [ ] Request/response transformations defined
- [ ] Resilience patterns applied
- [ ] Centralized monitoring in place
