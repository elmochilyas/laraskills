# Injection Guidelines by Class Type

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Injection Guidelines by Class Type provides a prescriptive framework for determining which dependency injection strategy suits each class category in a Laravel application. Controllers, Jobs, Listeners, Domain services, Repositories, DTOs, Models, and Commands each have distinct lifecycle characteristics, testability requirements, and architectural roles that dictate whether constructor injection, method injection, or neither should be used. These guidelines codify community best practices and framework conventions to prevent both over-injection and under-injection, and to enforce the boundary between infrastructure and domain concerns.

## Core Concepts
- **Class type taxonomy:** Every class in a Laravel application fits into a category (Controller, Job, Listener, Domain service, Repository, DTO, Model, Command, Middleware, Provider) with specific injection rules.
- **Lifecycle awareness:** How and when a class is instantiated determines injection strategy. Classes resolved by the container (controllers, jobs, listeners) support constructor injection; classes created with `new` (DTOs, models, value objects) do not.
- **Responsibility boundary:** Domain classes should not receive infrastructure dependencies (Logger, Mailer, Cache). Infrastructure wiring should happen at the application layer (controllers, commands, listeners).
- **DTO purity:** Data Transfer Objects should have no injected dependencies. They are plain PHP objects carrying data between layers.
- **The `new` anti-pattern:** Using `new SomeService()` inside a class that the container should have resolved. This bypasses injection entirely and is a common source of bugs and untestability.

## Mental Models
- **Zoo Keeper Model:** Think of the application as a zoo. Controllers are the zookeepers — they talk to the public and coordinate the animals (services). Domain services are the animals — they do specific jobs but shouldn't be bothered by zookeeper logistics. DTOs are the food bowls — they just carry stuff with no behavior.
- **Injection Zones Map:** The application is divided into zones. Green zone (Controllers, Jobs, Listeners): full injection allowed. Yellow zone (Services, Repositories): inject only domain/infrastructure abstractions. Red zone (Models, DTOs, Events): inject nothing — these classes are data carriers or pure domain objects.
- **Black Box v.s. White Box Model:** Classes the container constructs (white box) can have constructor injection. Classes the developer constructs with `new` (black box) must receive dependencies through other means (method injection, static factories, or direct arguments).

## Internal Mechanics
The framework determines injection support based on how a class is dispatched:

- **Controllers:** Instantiated by `Router` via `Container::make()`. Constructor injection is fully supported. Action methods are also dispatched via `ControllerDispatcher` which calls `Container::call()` for method injection.
- **Jobs:** Instantiated via `Container::make()` when pushed to the queue, and `handle()` is called via `Container::call()`. Both constructor and method injection are supported.
- **Listeners:** Instantiated via `Container::make()` in `Event::dispatch()`. The `handle()` method is called via `Container::call()`. Both injection styles available.
- **Commands (Artisan):** Instantiated via `Container::make()` in `Application::resolveCommand()`. The `handle()` method is called via `Container::call()`. Both injection styles available.
- **Middleware:** Instantiated via `Container::make()` in the middleware pipeline. Only constructor injection applies — `handle()` parameters are the request and next callback.
- **Service Providers:** The `register()` method does NOT support injection (parameters not resolved). The `boot()` method IS called via `Container::call()` and supports method injection.
- **Models, DTOs, Events:** Typically instantiated with `new` or serialization/deserialization. The container is not involved. Constructor injection into these classes is NOT possible unless explicitly resolved with `Container::make()`.

## Patterns

### Controllers
- **Preferred:** Constructor injection for shared dependencies (services, repositories, loggers). Method injection for request-specific dependencies.
- **Avoid:** Injecting `Request` into constructor (binds the controller to a specific request context). Inject more than 4-5 services (extract action classes).
- **Example:** `class UserController { public function __construct(UserService $users, Logger $log) {} public function show(Request $request, User $user) {} }`

### Jobs
- **Preferred:** Constructor injection for services needed in `handle()`. Method injection for the job's payload dependencies.
- **Note:** Constructor parameters must be serializable if the job is queued. Use method injection for non-serializable services.
- **Example:** `class ProcessPodcast implements ShouldQueue { public function __construct(Podcast $podcast) {} public function handle(AudioProcessor $processor) {} }`

### Listeners
- **Preferred:** Method injection for listener-specific dependencies. Constructor injection for shared services across multiple event handlers.
- **Reason:** Listeners often handle only one event type, making method injection a natural fit.
- **Example:** `class SendOrderConfirmation { public function handle(OrderShipped $event, Mailer $mailer) {} }`

### Domain Services
- **Preferred:** Constructor injection for domain abstractions (repositories, domain event dispatchers, other domain services).
- **Avoid:** Injecting infrastructure services (loggers, mailers, HTTP clients). These should be injected at the application layer.
- **Example:** `class OrderService { public function __construct(OrderRepository $orders, DomainEventDispatcher $events) {} }`

### Repositories
- **Preferred:** Constructor injection for the data source (Eloquent model, Query Builder, alternate storage).
- **Avoid:** Injecting services that don't relate to data access. Repositories should be about data, not business logic.
- **Example:** `class EloquentUserRepository { public function __construct(User $model) {} }`

### DTOs
- **Preferred:** No injection. All data via constructor arguments. DTOs should be plain PHP objects.
- **Avoid:** Typing the properties against container-resolved interfaces. DTOs own their data types.
- **Example:** `class CreateUserData { public function __construct(public string $name, public string $email) {} }`

### Eloquent Models
- **Preferred:** No constructor injection. Models are instantiated by Eloquent (hydration, `new`), not the container.
- **Alternatives:** Use Laravel observers or trait-based approach for model events. Use dedicated service classes instead of placing logic on models.
- **Anti-Pattern:** Calling `app()->make()` or facades inside model accessors, mutators, or events. This is the "New Inside Services Anti-Pattern" applied to models.

### Artisan Commands
- **Preferred:** Constructor injection for services needed in `handle()`. The `handle()` method itself also supports method injection.
- **Example:** `class SendEmailsCommand { public function __construct(MailService $mail) {} public function handle() { $this->mail->send(); } }`

### Middleware
- **Preferred:** Constructor injection for configuration and services. The `handle()` signature is fixed (`$request, $next`) and does not support arbitrary injection.
- **Example:** `class ThrottleRequests { public function __construct(Cache $cache) {} public function handle($request, $next) { ... } }`

### Service Providers
- **Preferred:** Inject nothing in `register()` — it is called before most services are available. Use method injection in `boot()` for framework services.
- **Example:** `class AppServiceProvider extends ServiceProvider { public function boot(Router $router, Dispatcher $events) {} }`

## Architectural Decisions
- **Why models cannot use container injection:** Eloquent models are instantiated via `Model::hydrate()` (for query results) and `new Model()` (for new instances). Neither goes through the container. Adding container injection to models would require fundamental changes to Eloquent's ORM hydration pipeline.
- **Why domains should not inject infrastructure:** Injecting a `Logger` or `Mailer` into a domain service ties the domain to a specific infrastructure concern. The domain should define interfaces for these services (e.g., `OrderNotifier`) and have infrastructure implementations injected at the application layer.
- **Why DTOs should be injection-free:** DTOs are serialized across boundaries (queues, responses, command buses). Injected services would break serialization and violate the DTO's purpose as a passive data container.
- **Why method injection for listener `handle()`:** Listeners are typically instantiated for one event type. Requiring constructor injection for every listener would create unnecessary classes with single-use dependencies. Method injection keeps the listener lean.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clear rules reduce design debates | Some classes fall into grey areas | Requires judgment calls on a case-by-case basis |
| Domain/infrastructure separation improves maintainability | More indirection via interfaces and application-layer wiring | Increased up-front design effort |
| Models remain simple and serializable | Logic that belongs on models moves to external service classes | "Anemic models" anti-pattern risk |
| DTO purity ensures serialization works | Data transformation requires separate transformers | Extra files for mapping logic |
| Job serialization is predictable | Queued jobs must separate payload from services via method injection | New developers may confuse constructor/method injection roles |

## Performance Considerations
- **Controller injection per request:** Controllers are re-instantiated on every request. Heavy constructor injection in controllers means resolving 3-5 dependencies per request. Use singleton bindings for reusable services.
- **Job serialization cost:** Constructor-injected dependencies in queued jobs are serialized to the queue. Large injected objects increase queue storage and deserialization time. Use method injection for non-serializable or heavy dependencies.
- **Listener instantiation in event-heavy apps:** If a single event triggers 20 listeners, each is constructed and resolved. Ensure listener dependencies are cheap to resolve or are singletons.
- **Middleware construction per route group:** Middleware is constructed once per route match. Constructor injection in middleware is efficient — the cost is paid once per matched route.

## Production Considerations
- **Enforce guidelines via CI:** Use a custom PHP_CodeSniffer or PHPStan rule to flag injection violations (e.g., `app()` calls in models, constructor injection in DTOs, infrastructure injection in domain services).
- **Document class type conventions in the project README:** Every developer should know the injection rules for each class type. Include examples of correct and incorrect patterns.
- **Review injection style during code review:** Make injection strategy a standard checklist item. A controller using method injection for 5 services (when constructor injection is appropriate) is as problematic as a DTO with 3 injected services.
- **Monitor "new Inside Services" pattern:** Track usage of `new ServiceClass()` in business logic. Flag it in code review. Use container resolution or factory injection instead.

## Common Mistakes
- **Injecting `Request` into controller constructor:** The request is specific to a single action. Injecting it into the constructor binds the entire controller to a single request context, breaking reusability.
- **Injecting services into Eloquent model constructor:** Eloquent models cannot use container injection; the injected services are `null` when the model is hydrated from the database.
- **Injecting `Container` into domain services:** This is a service locator disguised as proper injection. Accept only the specific services needed.
- **`new` inside Services Anti-Pattern:** Creating dependencies with `new` inside a service class (e.g., `$logger = new Logger()`) bypasses the container entirely. The class is hard-coded and untestable.
- **DTOs with injected factories:** A DTO that receives a factory via constructor injection is no longer a DTO — it has behavior and infrastructure dependencies, breaking serialization and testability.
- **Using method injection everywhere:** Method injection in every method with the same dependency repeats the method signature and adds cognitive load. Use constructor injection for dependencies used in multiple methods.

## Failure Modes
- **Eloquent model `null` dependencies:** A model with constructor-injected services is resolved via `Container::make()` in some code paths and via `new Model()` in others. The `new` path produces a model with `null` dependencies, causing "Call to member function on null" errors.
- **DTO serialization failure:** A DTO with injected services fails to serialize when passed to a queued job. The error is a serialization exception (`SerializationException` or PHP `Exception` about serialization of closures).
- **Queued job resolution failure:** A job's constructor-injected service cannot be serialized/deserialized on the queue worker. The `handle()` method receives a partially-deserialized object.
- **Infrastructure dependency in domain infection:** A domain service that receives a `Logger` internally creates a hard coupling to the logging infrastructure. Changing the logging library requires changes in the domain layer.

## Ecosystem Usage
- **Laravel core:** Follows similar guidelines. Controllers in the framework code (e.g., `Illuminate\Routing\RedirectController`) have minimal constructor dependencies. Domain-style classes (e.g., `UrlGenerator`) inject only abstractions. Models have no injection.
- **Laravel Nova:** Nova's resource classes do not use constructor injection — they receive data via method calls. Nova's services (like `ResourceDispatcher`) use constructor injection for framework services.
- **Spatie packages:** `spatie/laravel-medialibrary` provides dedicated action classes (e.g., `AddMedia`) rather than placing logic on the model. These action classes use constructor injection for services, following the "thin controller, dedicated action" pattern.
- **Enterprise Laravel patterns:** Large Laravel codebases commonly use Action classes (also called "Use Cases" or "Interactors") that receive injected services and domain-specific interfaces. These action classes are the primary consumers of constructor injection, keeping controllers thin and models clean.

## Related Knowledge Units

### Prerequisites
- **Constructor Injection** — the primary mechanism recommended for most class types
- **Method Injection** — the alternative for class types that should avoid constructor injection
- **Service Locator Anti-Pattern** — explains why `app()` calls in models and DTOs are harmful

### Related Topics
- **Over-Injection Anti-Pattern** — provides thresholds and refactoring guidance for over-injected classes
- **Auto-Resolution Strategy** — understanding how the container resolves injected dependencies
- **Interface Binding Resolution** — how to wire abstractions to concretes for injected interfaces

### Advanced Follow-up Topics
- **Testing with the Container** — testing strategies for each class type's injection style
- **HTTP Kernel Internals** — how controllers, middleware, and service providers are dispatched
- **Console Kernel Internals** — how artisan commands and scheduled tasks handle injection

## Research Notes
- The "New Inside Services Anti-Pattern" is a term coined in the PHP community (first documented by Matthias Noback in "A Year with Symfony" and later adopted by the Laravel community). It refers to the practice of using `new` to instantiate dependencies inside service classes instead of injecting them.
- Laravel's own documentation recommends "fat models, thin controllers" for simple CRUD applications and "action classes" for complex business logic. The injection guidelines here align with the action class approach.
- In 2023, Laravel introduced the `Make` facade and the `Container::getFactory()` method for resolving dependencies in contexts where constructor injection is not available (e.g., models). These are experimental and intended to bridge the gap between injection and `new`.
- The "anemic domain model" debate is relevant: if all business logic is extracted to service classes (to keep models injection-free), the models become passive data holders. Pure DDD advocates prefer rich domain models. The injection guidelines here prioritize serializability and framework compatibility over domain purity.
- PHP 8.1 readonly properties and the `#[\SensitiveParameter]` attribute have implications for injection patterns. Readonly constructor promotion is now the recommended style for injected properties: `public function __construct(readonly Logger $log) {}`.
