# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Hexagonal/Ports and Adapters architecture concept
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Hexagonal Architecture (Alistair Cockburn, 2005), also called Ports and Adapters, models the application as a "hexagon" (core) with symmetric ports on each side for inbound and outbound communication. Ports are interfaces defined by the core; Adapters are implementations that connect the core to external systems. Unlike Clean Architecture's concentric layers, Hexagonal Architecture treats all external systems symmetrically—databases, web frameworks, message queues, and external APIs are all "outside" and connect through ports. This symmetry is its defining insight: the core doesn't know or care whether input comes from HTTP, a CLI command, or a queue message.

---

# Core Concepts

**Port (interface):** A boundary defined by the core application. Input ports define how the outside world triggers the application (use cases). Output ports define how the application interacts with the outside world (repositories, event buses).

**Adapter (implementation):** Concrete code that connects a port to a specific technology. A `WebController` is an inbound adapter for HTTP. An `EloquentUserRepository` is an outbound adapter for MySQL via Eloquent.

**The Hexagon (core):** The application's business logic. Contains use cases, domain entities, and port interfaces. Has zero dependencies on external systems.

The symmetrical treatment means the database is not "lower" than the web interface—both are equally external.

---

# Mental Models

**The "Hexagon Shape" model:** The six sides (arbitrary number) represent different types of ports. Each side can have multiple ports. The hexagon shape emphasizes that external connections are symmetric.

**The "Electrical Socket" model:** Ports are wall sockets. Adapters are plugs. The appliance (core) defines the socket shape; the plug must match. Any adapter that fits works.

**The "Inversely Injected" model:** The core defines what it needs (interfaces). The outside provides implementations via dependency injection. The core never imports anything external.

---

# Internal Mechanics

```
Hexagonal Core (business logic)
├── Inbound Ports: CreateInvoiceUseCase, GetInvoiceQuery
│   └── Inbound Adapters: WebController, CliCommand, QueueConsumer
├── Outbound Ports: InvoiceRepository, EventBus
│   └── Outbound Adapters: EloquentInvoiceRepository, LaravelEventBus
└── Domain: Invoice entity, Money value object, InvoiceCreated event
```

In Laravel, inbound adapters are Controllers, Commands, and Queue Listeners. Outbound adapters are Repository implementations, Mail implementations, and external API clients.

---

# Patterns

**Primary (driving) adapters:** Initiate interaction with the core. Controllers (HTTP), Console Commands (CLI), Queue Workers (async). These call inbound ports.

**Secondary (driven) adapters:** React to requests from the core. Repositories (database), Mailers (email), API Clients (external services). These implement outbound ports.

**Adapter symmetry:** A use case should work identically whether called via HTTP, CLI, or queue. This is validated by testing the use case through multiple adapter configurations.

---

# Architectural Decisions

**Use Hexagonal Architecture when:** The application has multiple delivery mechanisms (HTTP + CLI + Queue), needs framework-independence for core logic, or requires the flexibility to swap infrastructure components.

**Choose Hexagonal over Clean when:** The symmetrical treatment of external systems matches your mental model better, or you want to emphasize that all infrastructure is equally interchangeable.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| All external systems are swappable | Every external interaction needs a port+adapter | Many small interface files for basic operations |
| Core is purely business logic | Adapter code is mostly glue | 40-60% of codebase is adapters, not business logic |
| Test core without infrastructure | New developers must learn ports/adapter mental model | Onboarding takes 2-3x longer |
| Multiple delivery mechanisms cheap | Initial setup for each port is manual | Creating a new port requires interface + test adapter |

---

# Performance Considerations

Adapter indirection adds overhead per external call. In high-throughput scenarios, the number of virtual calls (interface dispatch, method delegation) can be measurable. Profile before optimizing.

---

# Production Considerations

Adapter contract testing is critical. Each outbound port should have at least two implementations (production + test) that are verified against the same contract test suite.

---

# Common Mistakes

**Fat ports:** Port interfaces that contain too many methods. Each port should represent a single concern (Repository port has CRUD methods, but separation of read vs. write is worth considering).

**Leaky port definitions:** Port methods that accept or return framework-specific types (e.g., `Illuminate\Http\Request` in a port method). Ports must only use core-defined types.

---

# Failure Modes

**Port proliferation:** Too many fine-grained ports creating indirection without clear benefit. Each port should justify its existence with a concrete variation point.

**Adapter explosion:** Every infrastructure choice creates a new adapter. Sometimes sharing an adapter (one Repository interface with one Eloquent implementation) is sufficient.

---

# Ecosystem Usage

The `buckpal` repository is the canonical reference. Several Laravel implementations exist including `MahmoudRedaShaban/handel_Hexagonal_Architecture_with_laravel` and `lauchoit/laravel-hex-mod` which scaffold the hexagonal structure.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| LAP-01 Three-layer architecture | LAP-04 Dependency Rule | LAP-09 Framework independence |
| LAP-02 Clean Architecture | LAP-07 Infrastructure layer | LAP-10 Domain entity mapping |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche�most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
