# Anti-Patterns: gRPC API Integration with PHP

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit | gRPC API Integration with PHP |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Streaming RPCs from PHP Without Proxy | Architecture | High |
| 2 | No REST Fallback for Environments Without gRPC Extension | Reliability | Critical |
| 3 | Modifying Generated Protobuf Code | Maintenance | Critical |
| 4 | Recreating gRPC Channels Per Request | Performance | High |
| 5 | Not Setting gRPC Deadlines (Timeouts) | Reliability | Critical |

---

## Anti-Pattern 1: Streaming RPCs from PHP Without Proxy

### Category
Architecture

### Description
Implementing client-streaming, server-streaming, or bidirectional-streaming gRPC RPCs directly from PHP without a proxy or gateway, using PHP's synchronous gRPC extension with blocking reads.

### Why It Happens
The PHP gRPC extension supports all gRPC streaming types at the API level. Developers assume that because the extension API provides streaming methods, they are practical for production use.

### Warning Signs
- PHP code uses `$call->responses()` iterator directly for server-streaming
- Client-streaming RPCs are implemented with sequential blocking writes in PHP
- Bidirectional streaming RPCs use synchronous read-write loops in PHP
- Streaming RPCs cause PHP process hangs or timeout during long-running streams
- No Envoy proxy or gateway service between PHP and gRPC service

### Why Harmful
PHP's synchronous execution model means streaming RPCs block the PHP process for the entire stream duration. Server-streaming holds the process open until all responses arrive. Client-streaming and bidirectional streaming require non-blocking I/O that PHP cannot provide without extensions like Swoole or ReactPHP.

### Real-World Consequences
- Server-streaming gRPC call with 10,000 responses holds the PHP worker for 30+ seconds
- Queue worker pool is exhausted by long-running streaming RPCs
- Bidirectional streaming implementation is buggy under high message volume
- PHP-FPM process timeout kills streaming RPCs mid-stream

### Preferred Alternative
Use unary gRPC RPCs from PHP exclusively. For streaming requirements, use an Envoy proxy (for gRPC-web translation) or a dedicated streaming service that PHP communicates with via unary calls or queues.

```php
// Envoy proxy-based gRPC integration
$response = Http::withHeaders(['Content-Type' => 'application/grpc-web'])
    ->withOptions(['stream' => false])
    ->post(env('ENVOY_PROXY_URL').'/myservice.MyRPC', $protobufPayload);
```

### Refactoring Strategy
1. Identify all streaming RPC calls from PHP code
2. Replace streaming RPCs with unary alternatives where possible
3. For required streaming, introduce Envoy proxy or dedicated gateway service
4. Configure Envoy to terminate gRPC (HTTP/2) and bridge to PHP (HTTP/1.1)
5. Remove streaming RPC code from PHP; keep only unary call patterns

### Detection Checklist
- [ ] All PHP gRPC calls use unary RPCs only
- [ ] Streaming is handled by Envoy proxy or dedicated streaming service
- [ ] PHP never blocks on streaming response iterators
- [ ] Envoy sidecar is configured for gRPC-web translation
- [ ] No bidirectional or client-streaming RPCs in PHP code

### Related Rules/Skills/Trees
- Rule: Use unary gRPC from PHP; reserve streaming for dedicated services
- Rule: Streaming RPCs from PHP without proxy
- Skill: Envoy proxy pattern for gRPC-web translation

---

## Anti-Pattern 2: No REST Fallback for Environments Without gRPC Extension

### Category
Reliability

### Description
Requiring the PHP gRPC extension (`ext-grpc`) for all environments without providing a REST API fallback for environments where the extension is not available.

### Why Happens
Teams standardize on gRPC for performance and contract-first benefits. Once the extension is installed in production, development and staging environments are assumed to have it too.

### Warning Signs
- Application crashes with `Class "Grpc\Channel" not found` in some environments
- No configuration option to switch between gRPC and REST transport
- Local development setup script that installs `ext-grpc` but fails silently
- CI pipeline breaks when run on environments without, or with wrong version of, the gRPC extension

### Why Harmful
The PHP gRPC extension requires C extension installation, which is not always possible on shared hosting, some PaaS platforms, or in CI environments running minimal Docker images. Without a REST fallback, the application cannot function in these environments. This blocks onboarding new developers, deploying to certain platforms, and running tests in constrained CI environments.

### Real-World Consequences
- New developer onboarding takes 2 extra days because `ext-grpc` doesn't compile on their M1/M2 Mac
- Heroku deployment fails because `ext-grpc` is not pre-installed and cannot be compiled on dyno
- CI pipeline uses a custom Docker image just to get gRPC working (slower, harder to maintain)
- Production incident: gRPC extension update breaks compatibility; no fallback available

### Preferred Alternative
Provide a REST API fallback for every gRPC integration. Use a transport abstraction that can switch between gRPC and HTTP/REST based on configuration.

```php
interface PaymentServiceClient {
    public function processPayment(PaymentRequest $request): PaymentResponse;
}

class GrpcPaymentClient implements PaymentServiceClient {
    public function processPayment(PaymentRequest $request): PaymentResponse {
        // gRPC call using ext-grpc
    }
}

class RestPaymentClient implements PaymentServiceClient {
    public function processPayment(PaymentRequest $request): PaymentResponse {
        // REST HTTP call
        return Http::post(config('services.payment.rest_url'), $request->toArray());
    }
}

// Config-based selection
$client = app(extension_loaded('grpc') ? GrpcPaymentClient::class : RestPaymentClient::class);
```

### Refactoring Strategy
1. Define a transport interface for each gRPC service consumed
2. Implement both gRPC and REST client classes per interface
3. Create a factory that selects transport based on environment configuration
4. Test both transports with integration test suites
5. Document transport selection and fallback configuration

### Detection Checklist
- [ ] REST fallback exists for every gRPC integration
- [ ] Transport selection is configurable per environment
- [ ] Both transports pass the same integration tests
- [ ] gRPC extension availability does not block development or CI
- [ ] Transport fallback is documented in deployment configuration

### Related Rules/Skills/Trees
- Rule: Keep REST fallback for environments without gRPC extension
- Rule: No REST fallback for environments without gRPC extension
- Related KU: Laravel Http Facade API (REST alternative to gRPC)

---

## Anti-Pattern 3: Modifying Generated Protobuf Code

### Category
Maintenance

### Description
Hand-editing the PHP classes generated by `protoc --php_out=./` from `.proto` files, modifying generated code instead of changing the source `.proto` definition.

### Why Happens
Minor changes are needed (adding a helper method, changing a getter return type, adding a default value). The `.proto` file generation process feels heavyweight, so developers make quick edits to the generated code.

### Warning Signs
- Generated PHP files show git diff beyond the initial generation commit
- Added methods, modified getters, or changed docblocks in generated protobuf classes
- Regenerating protobuf code breaks the application (regenerated files lack custom changes)
- `.proto` file is out of sync with the generated code in the repository
- No automation for protobuf code generation

### Why Harmful
Modifying generated code creates an invisible drift between the canonical `.proto` definition and the actual implementation. Regeneration overwrites all custom changes. The `.proto` file is the API contract; if it differs from the code, other services consuming the same protobuf schema will not work correctly.

### Real-World Consequences
- `.proto` file is updated with new fields but generated code was manually modified; regeneration overwrites critical bugfixes
- Protocol buffer serialization fails because hand-edited PHP classes don't match the protobuf wire format
- Team wastes days debugging "impossible" bugs caused by hand-edited generated code
- New developer regenerates protobuf classes and breaks production (custom changes lost)

### Preferred Alternative
Never modify generated protobuf code. Put all custom logic (helpers, validation, enrichment) in wrapper service classes that use the generated client.

```php
// Bad: modifying generated code
// File: generated/PaymentRequest.php (EDITED BY HAND)
class PaymentRequest extends \Google\Protobuf\Internal\Message {
    // Added custom method - WILL BE LOST ON REGENERATION
    public function getFormattedAmount(): string {
        return '$' . number_format($this->getAmountInCents() / 100, 2);
    }
}

// Good: wrapper service class
class PaymentRequestWrapper {
    public function __construct(private PaymentRequest $request) {}
    
    public function getFormattedAmount(): string {
        return '$' . number_format($this->request->getAmountInCents() / 100, 2);
    }
}
```

### Refactoring Strategy
1. Audit all generated protobuf files for hand-edits
2. Move custom logic from generated files to wrapper service classes
3. Restore generated files to pristine `protoc` output (revert changes)
4. Add CI step that verifies generated files match `protoc` output
5. Re-run `protoc` generation and verify application still works

### Detection Checklist
- [ ] Generated protobuf files are never hand-edited
- [ ] Custom logic lives in wrapper service classes, not generated code
- [ ] CI pipeline verifies generated files match protoc output
- [ ] `.proto` file is the sole source of truth for schema
- [ ] Regenerating protobuf code does not break the application

### Related Rules/Skills/Trees
- Rule: Compile .proto files in CI; commit generated stubs to repository
- Rule: Modifying generated protobuf code (lost on regeneration)
- Skill: Generated PHP stubs in separate package for versioning

---

## Anti-Pattern 4: Recreating gRPC Channels Per Request

### Category
Performance

### Description
Creating a new gRPC channel for every RPC call instead of reusing channels across requests, losing the benefits of HTTP/2 connection multiplexing.

### Why Happens
The simplest gRPC client code creates a channel and makes a call in the same scope. Developers apply the same pattern as HTTP clients (new request = new connection) without understanding gRPC's connection model.

### Warning Signs
- Channel creation inside the same method as the RPC call
- No singleton or connection pool for gRPC channels
- High connection count in gRPC service logs (thousands of short-lived connections)
- Increased latency during peak traffic (new mTLS handshake per call)
- PHP process memory grows with each channel creation

### Why Harmful
gRPC channels maintain persistent HTTP/2 connections. Each new channel requires a TCP handshake (1-3 RTT) and TLS negotiation (1-2 RTT). Creating channels per request adds 20-50ms of latency to every call and creates connection churn on the gRPC server. HTTP/2 multiplexing benefits (multiple RPCs sharing one connection) are lost entirely.

### Real-World Consequences
- gRPC call latency is 30ms instead of 5ms due to per-request channel creation
- gRPC server sees 10,000 connection opens per minute instead of 10
- TLS certificate verification runs on every call instead of once per channel lifetime
- Bash latency for burst traffic is 5x higher than sustained load
- Connection limits on gRPC server are reached during traffic spikes

### Preferred Alternative
Create gRPC channels as singletons or in a connection pool, reused across requests. In Laravel, bind the channel in the service container as a singleton.

```php
// Service provider
class GrpcServiceProvider extends ServiceProvider {
    public function register(): void {
        $this->app->singleton(Grpc\Channel::class, function ($app) {
            return new Grpc\Channel(
                config('services.grpc.host'),
                ['credentials' => Grpc\ChannelCredentials::createSsl()]
            );
        });
    }
}

// Client uses singleton channel
class PaymentServiceClient {
    public function __construct(private Grpc\Channel $channel) {}
    
    public function processPayment(PaymentRequest $request): PaymentResponse {
        $client = new PaymentServiceGrpcClient($this->channel);
        [$response, $status] = $client->ProcessPayment($request)->wait();
        return $response;
    }
}
```

### Refactoring Strategy
1. Register gRPC channels as singletons in Laravel service container
2. Remove channel creation from individual client classes
3. Verify channel reuse works across requests (same connection in logs)
4. Add channel health monitoring (gRPC health checking protocol)
5. Integrate channel with Laravel's cache invalidation (reconnect on failure)

### Detection Checklist
- [ ] gRPC channels are reused across requests (singleton or connection pool)
- [ ] No channel creation inside RPC call methods
- [ ] Connection count in gRPC server logs is stable (not per-request)
- [ ] Channel health is monitored separately from REST health
- [ ] Channel reconnection on failure is handled gracefully

### Related Rules/Skills/Trees
- Rule: One gRPC channel per target service, reused across requests
- Rule: Recreating gRPC channels per request (losing connection reuse)
- Decision Tree: Channel reuse strategy (singleton vs pool based on concurrency)

---

## Anti-Pattern 5: Not Setting gRPC Deadlines (Timeouts)

### Category
Reliability

### Description
Making gRPC calls without setting a deadline (timeout), allowing connections to hang indefinitely if the gRPC service is unresponsive.

### Why Happens
The gRPC client methods work without deadlines; they wait indefinitely. Developers apply HTTP-style timeout assumptions without realizing gRPC requires explicit deadline configuration.

### Warning Signs
- No call to `$client->setDeadline()` or `$ctx = $ctx->withDeadline()` before gRPC calls
- gRPC calls hang forever during service outages
- PHP-FPM process pool exhaustion from hung gRPC connections
- No monitoring for gRPC call duration
- Default deadline (infinite) is used in production

### Why Harmful
Without deadlines, a single unresponsive gRPC service can exhaust all PHP workers. An upstream service crash, network partition, or process hang causes all queued gRPC calls to block indefinitely. This creates a self-inflicted denial of service.

### Real-World Consequences
- Payment service crashes; all gRPC calls to it hang forever
- PHP-FPM pool of 50 workers exhausted within seconds; application completely down
- Recovery requires restarting PHP-FPM, killing all hung connections
- Incident duration: 45 minutes (15 minutes for crash + 30 minutes before forced restart)
- No automated recovery because deadlock detection has no timeout signal

### Preferred Alternative
Set explicit deadlines on every gRPC call. Match the deadline to the expected response time plus reasonable buffer.

```php
class PaymentServiceClient {
    public function processPayment(PaymentRequest $request): PaymentResponse {
        $client = new PaymentServiceGrpcClient($this->channel);
        
        // Set deadline: 30 seconds
        $client->setDeadline(30);
        
        [$response, $status] = $client->ProcessPayment($request)->wait();
        
        if ($status->code !== Grpc\STATUS_OK) {
            throw new GrpcException($status->details, $status->code);
        }
        
        return $response;
    }
}
```

### Refactoring Strategy
1. Audit all gRPC call sites for deadline configuration
2. Add deadline setter before every RPC call
3. Match deadlines to expected service response times (unary: 10-30s, streaming: longer)
4. Add gRPC status code handling for `DEADLINE_EXCEEDED` (graceful fallback)
5. Implement deadline monitoring: alert on calls approaching deadline

### Detection Checklist
- [ ] Every gRPC call has an explicit deadline set
- [ ] Deadlines are matched to expected service response times
- [ ] `DEADLINE_EXCEEDED` status is handled (fallback or retry)
- [ ] Deadline monitoring alerts on calls approaching limit
- [ ] No infinite-wait gRPC calls exist in production code

### Related Rules/Skills/Trees
- Rule: gRPC deadlines (timeouts) set on all calls to prevent hangs
- Rule: Not setting gRPC deadlines (connections hang forever)
- Related KU: Laravel Http Facade API (HTTP vs gRPC timeout patterns)
