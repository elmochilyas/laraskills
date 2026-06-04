# Command Handler Patterns — Standardized Knowledge

## Overview

Command handlers encapsulate application-level orchestration into dedicated classes, separating the "what to do" (command) from the "how to orchestrate it" (handler). They receive a command DTO, orchestrate domain logic across models and services, and return a result — keeping controllers thin and domain logic reusable.

## Key Concepts

- **Command DTO** — a plain PHP object with readonly properties, carrying input data
- **Handler** — a class with a single `__invoke()` or `handle()` method
- **Orchestration** — the handler sequences domain method calls, it does not implement business logic
- **Result DTO** — typed return value from the handler
- **Dependency injection** — handlers receive domain services, repositories, and factories via constructor
- **Command bus** — optional middleware pipeline for cross-cutting concerns

## Implementation Details

```php
class RegisterUserCommand
{
    public function __construct(
        public readonly string $email,
        public readonly string $password,
        public readonly string $name,
    ) {}
}

class RegisterUserHandler
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly UserFactory $factory,
    ) {}

    public function handle(RegisterUserCommand $command): User
    {
        $user = $this->factory->create($command->name, $command->email, $command->password);
        $this->users->save($user);
        return $user;
    }
}
```

## Best Practices

- Keep command DTOs as pure data carriers with no behavior
- Handlers orchestrate, domain models decide — never inline business logic in handlers
- Return typed result DTOs or entities from handlers
- Inject domain abstractions (interfaces), not concretions or Eloquent models directly
- Wire handlers in service providers, not in controllers
