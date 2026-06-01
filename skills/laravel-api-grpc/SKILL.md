# Laravel 13 gRPC — Protocol Buffers & High-Performance Microservices

## When to Use

Use this skill when implementing inter-service communication in Laravel 13 microservices architectures using gRPC. gRPC uses Protocol Buffers for binary serialization and HTTP/2 for transport, offering 5-10x better performance than REST/JSON for internal service communication. Best suited for microservices, internal APIs, high-throughput systems, and real-time systems. NOT for public browser APIs — REST remains simpler for external consumers.

---

## gRPC vs REST Decision Matrix

```text
┌─────────────────────────────┬────────┬────────┐
│ Criteria                    │  gRPC  │  REST  │
├─────────────────────────────┼────────┼────────┤
│ Payload size                │  Small │  Large │
│ Serialization speed         │  10x   │  1x    │
│ Schema enforcement          │  Strict│  Loose │
│ HTTP version                │  HTTP/2│  HTTP  │
│ Browser support             │  No*   │  Yes   │
│ Streaming                   │  Native│  SSE   │
│ Learning curve              │  Medium│  Low   │
│ Debugging                   │  Hard  │  Easy  │
│ Code generation             │  Auto  │  Manual│
│ Multi-language              │  Native│  Ad-hoc│
└─────────────────────────────┴────────┴────────┘
* Requires gRPC-Web or proxy (Envoy)
```

### When to Use gRPC

```text
✓ Internal microservice communication
✓ Real-time streaming (chat, events, logs)
✓ High-throughput systems
✓ Multi-language polyglot environments
✓ Systems requiring strong type safety
✓ Low-latency, high-performance paths
```

### When to Avoid gRPC

```text
✗ Public browser-facing APIs
✗ Simple CRUD applications
✗ Serverless functions (cold start overhead)
✗ When debugging transparency is critical
```

---

## Protocol Buffers

### Defining Proto Files

```protobuf
// proto/user.proto
syntax = "proto3";

package user.v1;

option php_namespace = "App\\Grpc\\User\\V1";
option php_metadata_namespace = "App\\Grpc\\User\\V1\\Metadata";

service UserService {
    rpc GetUser (GetUserRequest) returns (User);
    rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
    rpc CreateUser (CreateUserRequest) returns (User);
    rpc UpdateUser (UpdateUserRequest) returns (User);
    rpc DeleteUser (DeleteUserRequest) returns (google.protobuf.Empty);

    // Server streaming
    rpc StreamUsers (ListUsersRequest) returns (stream User);

    // Bidirectional streaming
    rpc Chat (stream ChatMessage) returns (stream ChatMessage);
}

message User {
    string id = 1;
    string name = 2;
    string email = 3;
    UserRole role = 4;
    google.protobuf.Timestamp created_at = 5;
}

enum UserRole {
    USER_ROLE_UNSPECIFIED = 0;
    USER_ROLE_ADMIN = 1;
    USER_ROLE_EDITOR = 2;
    USER_ROLE_VIEWER = 3;
}

message GetUserRequest {
    string id = 1;
}

message ListUsersRequest {
    int32 page_size = 1;
    string page_token = 2;
    string filter = 3;
}

message ListUsersResponse {
    repeated User users = 1;
    string next_page_token = 2;
    int32 total_size = 3;
}

message CreateUserRequest {
    string name = 1;
    string email = 2;
    UserRole role = 3;
}

message UpdateUserRequest {
    string id = 1;
    string name = 2;
    string email = 3;
    UserRole role = 4;
}

message DeleteUserRequest {
    string id = 1;
}

message ChatMessage {
    string user_id = 1;
    string content = 2;
    int64 timestamp = 3;
}
```

### Proto Field Numbering Rules

```protobuf
message User {
    // Field numbers 1-15: 1 byte in wire format
    // Use for frequently occurring fields
    string id = 1;
    string name = 2;
    string email = 3;

    // Field numbers 16-2047: 2 bytes
    // Use for less frequent fields
    string phone = 20;
    string address = 21;

    // Field numbers 2048+: 5+ bytes
    string metadata = 2048;

    // NEVER reuse deleted field numbers
    reserved 4, 5, 6;    // Reserved field numbers
    reserved "age", "ssn"; // Reserved field names
}
```

### Schema Evolution Rules

```protobuf
// BACKWARD COMPATIBLE changes:
// - Adding new fields (with new numbers)
// - Removing fields (with reserved)
// - Renaming fields (keep number same)
// - Adding new enum values (carefully)
// - Extending message with new optional fields

// BREAKING changes:
// - Changing field numbers
// - Reusing deleted field numbers
// - Changing field types
// - Removing required fields
// - Changing message name
```

---

## gRPC in Laravel — RoadRunner Setup

### Install RoadRunner

```bash
composer require spiral/roadrunner:^2024.0
composer require spiral/roadrunner-grpc:^3.0

# Generate proto code
composer require google/protobuf grpc/grpc

# Install RoadRunner binary
composer require spiral/roadrunner-cli --dev
vendor/bin/rr get
```

### Generate PHP Code from Proto

```bash
protoc --proto_path=proto \
    --php_out=app/Grpc \
    --grpc_out=app/Grpc \
    --plugin=protoc-gen-grpc=/usr/local/bin/grpc_php_plugin \
    proto/user.proto
```

### gRPC Server Configuration

```yaml
# .rr.yaml
version: "3"

grpc:
  listen: "tcp://0.0.0.0:9001"
  proto:
    - "proto/user.proto"
  max_send_msg_size: 50
  max_recv_msg_size: 50

  interceptors:
    - "App\\Grpc\\Interceptors\\LoggingInterceptor"
    - "App\\Grpc\\Interceptors\\MetricsInterceptor"
```

---

## Implementing a gRPC Service

### Service Implementation

```php
namespace App\Grpc\Services;

use App\Grpc\User\V1\UserServiceInterface;
use App\Grpc\User\V1\GetUserRequest;
use App\Grpc\User\V1\User as UserMessage;
use App\Grpc\User\V1\ListUsersRequest;
use App\Grpc\User\V1\ListUsersResponse;
use App\Modules\User\Actions\FindUserAction;
use App\Modules\User\Actions\ListUsersAction;
use Google\Protobuf\Internal\MapField;
use Spiral\RoadRunner\GRPC\ContextInterface;

final class UserGrpcService implements UserServiceInterface
{
    public function __construct(
        private readonly FindUserAction $findUser,
        private readonly ListUsersAction $listUsers,
    ) {}

    public function GetUser(ContextInterface $ctx, GetUserRequest $in): UserMessage
    {
        $user = $this->findUser->execute($in->getId());

        $message = new UserMessage();
        $message->setId((string) $user->id);
        $message->setName($user->name);
        $message->setEmail($user->email);

        return $message;
    }

    public function ListUsers(ContextInterface $ctx, ListUsersRequest $in): ListUsersResponse
    {
        $paginator = $this->listUsers->execute(
            pageSize: $in->getPageSize() ?: 20,
            pageToken: $in->getPageToken(),
        );

        $response = new ListUsersResponse();

        foreach ($paginator->items as $user) {
            $message = new UserMessage();
            $message->setId((string) $user->id);
            $message->setName($user->name);
            $message->setEmail($user->email);
            $response->addUsers($message);
        }

        $response->setNextPageToken($paginator->nextCursor);
        $response->setTotalSize($paginator->total);

        return $response;
    }

    public function StreamUsers(ContextInterface $ctx, ListUsersRequest $in): \Generator
    {
        $users = $this->listUsers->all();

        foreach ($users as $user) {
            $message = new UserMessage();
            $message->setId((string) $user->id);
            $message->setName($user->name);
            $message->setEmail($user->email);

            yield $message;
        }
    }

    public function Chat(ContextInterface $ctx, \Generator $in): \Generator
    {
        foreach ($in as $message) {
            $reply = new ChatMessage();
            $reply->setUserId($message->getUserId());
            $reply->setContent('Echo: ' . $message->getContent());
            $reply->setTimestamp(time());

            yield $reply;
        }
    }
}
```

### Register Service

```php
// config/grpc.php
use App\Grpc\Services\UserGrpcService;
use App\Grpc\User\V1\UserServiceInterface;

return [
    'services' => [
        UserServiceInterface::class => UserGrpcService::class,
    ],

    'interceptors' => [
        \App\Grpc\Interceptors\LoggingInterceptor::class,
        \App\Grpc\Interceptors\ValidationInterceptor::class,
        \App\Grpc\Interceptors\MetricsInterceptor::class,
    ],
];
```

---

## gRPC Client (Laravel Consumer)

```php
namespace App\Infrastructure\Grpc;

use App\Grpc\User\V1\UserServiceClient;
use App\Grpc\User\V1\GetUserRequest;
use App\Grpc\User\V1\CreateUserRequest;
use App\Grpc\User\V1\UserRole;
use Grpc\ChannelCredentials;

class UserGrpcClient
{
    private UserServiceClient $client;

    public function __construct()
    {
        $this->client = new UserServiceClient(
            'user-service:9001',
            [
                'credentials' => ChannelCredentials::createInsecure(),
            ]
        );
    }

    public function findUser(string $id): array
    {
        $request = new GetUserRequest();
        $request->setId($id);

        [$response, $status] = $this->client->GetUser($request)->wait();

        if ($status->code !== 0) {
            throw new \RuntimeException("gRPC error: {$status->details}");
        }

        return [
            'id' => $response->getId(),
            'name' => $response->getName(),
            'email' => $response->getEmail(),
        ];
    }

    public function createUser(string $name, string $email): array
    {
        $request = new CreateUserRequest();
        $request->setName($name);
        $request->setEmail($email);
        $request->setRole(UserRole::USER_ROLE_VIEWER);

        [$response, $status] = $this->client->CreateUser($request)->wait();

        if ($status->code !== 0) {
            throw new \RuntimeException("gRPC error: {$status->details}");
        }

        return [
            'id' => $response->getId(),
            'name' => $response->getName(),
            'email' => $response->getEmail(),
        ];
    }
}
```

---

## gRPC Interceptors

### Logging Interceptor

```php
namespace App\Grpc\Interceptors;

use Spiral\RoadRunner\GRPC\ContextInterface;
use Spiral\RoadRunner\GRPC\InterceptorInterface;
use Spiral\RoadRunner\GRPC\ServiceInterface;

final class LoggingInterceptor implements InterceptorInterface
{
    public function __construct(
        private readonly \Psr\Log\LoggerInterface $logger,
    ) {}

    public function intercept(
        string $service,
        string $method,
        \Closure $handler,
        ContextInterface $ctx,
        ?string $input,
    ): string {
        $start = microtime(true);

        $this->logger->info('gRPC call started', [
            'service' => $service,
            'method' => $method,
        ]);

        try {
            $result = $handler->handle($service, $method, $ctx, $input);

            $this->logger->info('gRPC call completed', [
                'service' => $service,
                'method' => $method,
                'duration_ms' => (microtime(true) - $start) * 1000,
            ]);

            return $result;
        } catch (\Throwable $e) {
            $this->logger->error('gRPC call failed', [
                'service' => $service,
                'method' => $method,
                'error' => $e->getMessage(),
                'duration_ms' => (microtime(true) - $start) * 1000,
            ]);

            throw $e;
        }
    }
}
```

### Metrics Interceptor

```php
namespace App\Grpc\Interceptors;

use Spiral\RoadRunner\GRPC\ContextInterface;
use Spiral\RoadRunner\GRPC\InterceptorInterface;
use Illuminate\Support\Facades\Cache;

final class MetricsInterceptor implements InterceptorInterface
{
    public function intercept(
        string $service,
        string $method,
        \Closure $handler,
        ContextInterface $ctx,
        ?string $input,
    ): string {
        $start = microtime(true);

        $result = $handler->handle($service, $method, $ctx, $input);

        $duration = (microtime(true) - $start) * 1000;

        Cache::tags(['grpc'])->put(
            "metrics:{$service}:{$method}",
            ['count' => 1, 'total_ms' => $duration],
            60,
        );

        return $result;
    }
}
```

---

## Testing gRPC Services

```php
test('grpc get user returns correct data', function () {
    $user = User::factory()->create([
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);

    $client = new UserServiceClient(
        'localhost:9001',
        ['credentials' => ChannelCredentials::createInsecure()]
    );

    $request = new GetUserRequest();
    $request->setId((string) $user->id);

    [$response, $status] = $client->GetUser($request)->wait();

    expect($status->code)->toBe(0);
    expect($response->getName())->toBe('John Doe');
    expect($response->getEmail())->toBe('john@example.com');
});

test('grpc list users paginates correctly', function () {
    User::factory()->count(25)->create();

    $client = new UserServiceClient(
        'localhost:9001',
        ['credentials' => ChannelCredentials::createInsecure()]
    );

    $request = new ListUsersRequest();
    $request->setPageSize(10);

    [$response, $status] = $client->ListUsers($request)->wait();

    expect($status->code)->toBe(0);
    expect(count($response->getUsers()))->toBe(10);
    expect($response->getTotalSize())->toBe(25);
});
```

---

## gRPC Best Practices

### Error Handling

```php
// Standard gRPC status codes
0   OK
1   CANCELLED
2   UNKNOWN
3   INVALID_ARGUMENT
4   DEADLINE_EXCEEDED
5   NOT_FOUND
6   ALREADY_EXISTS
7   PERMISSION_DENIED
8   RESOURCE_EXHAUSTED
9   FAILED_PRECONDITION
10  ABORTED
11  OUT_OF_RANGE
12  UNIMPLEMENTED
13  INTERNAL
14  UNAVAILABLE
15  DATA_LOSS
16  UNAUTHENTICATED
```

### Timeouts & Deadlines

```php
// Client-side deadline
[$response, $status] = $client->GetUser($request, ['timeout' => 5])->wait();

// Server-side context deadline propagation
public function GetUser(ContextInterface $ctx, GetUserRequest $in): UserMessage
{
    // Context carries deadline from caller
    // gRPC automatically cancels if deadline exceeded
}
```

### Health Checking

```protobuf
// proto/health.proto
package grpc.health.v1;

service Health {
    rpc Check(HealthCheckRequest) returns (HealthCheckResponse);
    rpc Watch(HealthCheckRequest) returns (stream HealthCheckResponse);
}

message HealthCheckRequest {
    string service = 1;
}

message HealthCheckResponse {
    enum ServingStatus {
        UNKNOWN = 0;
        SERVING = 1;
        NOT_SERVING = 2;
    }
    ServingStatus status = 1;
}
```

---

## gRPC Enterprise Checklist

- [ ] `.proto` files version-controlled and shared across services
- [ ] Proto field numbers follow 1-15 optimization for frequent fields
- [ ] Deleted fields are reserved, never reused
- [ ] Code generation runs as part of build pipeline
- [ ] Services delegate to Actions/Services (thin handlers)
- [ ] Timeouts/deadlines configured on all client calls
- [ ] Error handling returns proper gRPC status codes
- [ ] Interceptors for logging, metrics, auth
- [ ] Health check endpoint implemented
- [ ] TLS enabled in production
- [ ] Load balancing configured (gRPC supports HTTP/2 multiplexing)
- [ ] Streaming used where appropriate, not as default
- [ ] Service contracts versioned (package per version)
- [ ] Tests cover both server and client paths

---

## References

- See skill: `laravel-api-rest` for REST alternatives
- See skill: `laravel-api-jsonapi` for JSON:API alternatives
- See skill: `laravel-api-graphql` for GraphQL alternatives
- See skill: `laravel-api-microservices` for service boundaries and event-driven communication
- See official: [gRPC Documentation](https://grpc.io/docs/)
- See official: [Protocol Buffers](https://protobuf.dev/)
- See official: [RoadRunner gRPC](https://roadrunner.dev/docs/grpc)
- See rule: `rules/laravel/api-grpc.md` for enforced gRPC rules
