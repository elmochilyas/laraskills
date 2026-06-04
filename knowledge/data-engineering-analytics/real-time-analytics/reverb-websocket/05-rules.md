# Rules: Laravel Reverb WebSocket Broadcasting

## Rule RW-01: Private Channels for Auth Data
Analytics data MUST use private channels. Public channels must not carry sensitive analytics data.

## Rule RW-02: Channel Authorization Required
All private channel subscriptions MUST pass through the `broadcast/auth` endpoint with authorization logic.

## Rule RW-03: Plan Horizontal Scaling
Reverb deployments MUST have a horizontal scaling plan for production. Single-instance deployments must document the capacity ceiling.

## Rule RW-04: Control Broadcast Data
Broadcast event data MUST use DTOs or resource classes. Raw Eloquent models must not be broadcast.

## Rule RW-05: Monitor Connection Count
Active WebSocket connections MUST be monitored with alerts. Connection limits must be documented.

## Rule RW-06: Rate Limit Broadcasts
Broadcast event rate limits MUST be configured. Unbounded broadcasts can overwhelm the WebSocket server.

## Rule RW-07: TLS Termination
Reverb MUST be deployed behind a reverse proxy with TLS. Unencrypted WebSocket connections are not permitted.

## Rule RW-08: Document Channel Structure
Channel naming conventions MUST be documented. Consistent naming enables authorization automation.

## Rule RW-09: Echo Client Configuration
Laravel Echo MUST be configured with proper auth endpoint and broadcaster settings. Default settings may not match production deployment.

## Rule RW-10: Test Broadcasting
Broadcasting tests MUST verify event delivery on correct channels and authorization enforcement.
