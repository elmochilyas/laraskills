# Skill: Configure Timeout Handling for Outbound API Calls

## Purpose
Set appropriate connection and request timeouts on outbound API calls to prevent hung requests from exhausting workers or connections.

## When To Use
- Every outbound API call
- Queue workers making external API calls
- Preventing slow or hung requests from blocking processing

## When NOT To Use
- Local service calls where timeouts are unnecessary
- WebSocket or long-lived connections

## Prerequisites
- HTTP client configuration access (Http facade, Guzzle, Saloon)

## Workflow
1. Set connection timeout (default: 10 seconds) for TCP handshake
2. Set request timeout (default: 30 seconds) for full request/response
3. Configure timeouts per external service based on SLA
4. Use `$client->timeout(30)->connectTimeout(10)` for Http facade
5. For Saloon: configure timeout in Connector's `defaultHeaders()` or `defaultConfig()`
6. Handle timeout exceptions (`ConnectionException`, `TimeoutException`)
7. Log timeout events with duration and request details
8. Alert on repeated timeouts to the same endpoint

## Validation Checklist
- [ ] Connection timeout set (default 10s)
- [ ] Request timeout set (default 30s)
- [ ] Timeouts configured per service based on SLA
- [ ] Timeout exceptions handled gracefully
- [ ] Timeout events logged with details
- [ ] Repeated timeout alerts configured
