---
paths:
  - "**/*.proto"
  - "**/Grpc/**/*.php"
---

# Laravel 13 gRPC Rules

> Enforced gRPC and Protocol Buffers standards. Violations require refactoring before merge.

## Protocol Buffers

```protobuf
// REQUIRED — always use proto3 syntax
syntax = "proto3";

// REQUIRED — reserved deleted fields
reserved 4, 5;
reserved "old_field";

// REQUIRED — optimize field numbers (1-15 for frequent fields)
string id = 1;       // Frequent → 1 byte
string name = 2;     // Frequent → 1 byte
string metadata = 20; // Rare → 2 bytes
```

## Thin Services

```php
// FORBIDDEN — business logic in gRPC service methods
// REQUIRED — delegate to Actions/Services
class UserGrpcService implements UserServiceInterface {
    public function __construct(private FindUserAction $findUser) {}
}
```

## Error Handling

```php
// REQUIRED — use proper gRPC status codes
// 0=OK, 3=INVALID_ARGUMENT, 5=NOT_FOUND, 13=INTERNAL
```

## Never for Public APIs

```text
gRPC is for internal service communication only.
Public APIs → REST or JSON:API
Browser APIs → REST (or gRPC-Web via proxy)
```

## Security

```php
// REQUIRED in production — TLS enabled
'credentials' => ChannelCredentials::createSsl();

// FORBIDDEN in production — insecure mode
'credentials' => ChannelCredentials::createInsecure();
```

## See Also

- Skill: `laravel-api-grpc`
- Official: [gRPC Docs](https://grpc.io/docs/)
- Rule: `rules/laravel/api-microservices.md`
