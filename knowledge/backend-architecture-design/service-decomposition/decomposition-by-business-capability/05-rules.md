## Rule 1: Decompose by business capability, not by technical function
---
## Category
Architecture
---
## Rule
Identify business capabilities (e.g., "order management", "payment processing", "customer support") and decompose the system along those lines. Never decompose by technical layer (controllers, services, models).
---
## Reason
Technical decomposition cuts across business capabilities, scattering a single capability's code across many modules and creating high coupling.
---
## Bad Example
```
split(
  Controllers/,   // all controllers together
  Services/,      // all services together
  Models/         // all models together
)
```
---
## Good Example
```
split(
  OrderManagement/,
  PaymentProcessing/,
  CustomerSupport/
)
```
---
## Exceptions
Shared infrastructure (ServiceProviders, middleware, base classes) that is genuinely cross-cutting.
---
## Consequences Of Violation
Scattered capability code, high coupling, hard to extract capabilities.
---
## Rule 2: Each business capability owns its full vertical stack
---
## Category
Architecture
---
## Rule
Each capability module should contain everything it needs: controllers, use cases, domain models, persistence, and events. No capability should depend on another capability's internal code.
---
## Reason
Vertical ownership makes each capability independently developable, testable, and extractable.
---
## Bad Example
```
OrderManagement/
  Controllers/  // depends on Shared/Models for Order entity
  UseCases/
Shared/
  Models/Order.php
  Repositories/OrderRepository.php
```
---
## Good Example
```
OrderManagement/
  Controllers/
  Domain/Order.php
  Persistence/OrderRepository.php
  Events/
```
---
## Exceptions
Shared kernel (value objects, base classes) that are intentionally shared across capabilities.
---
## Consequences Of Violation
Cross-capability coupling, shared model changes break multiple capabilities.
---
## Rule 3: Align team boundaries with capability boundaries (Conway's Law)
---
## Category
Architecture
---
## Rule
Organize autonomous teams around business capabilities: one team owns one capability end-to-end.
---
## Reason
Teams organized around capabilities produce decoupled, maintainable systems; teams organized around technical layers produce tightly-coupled systems.
---
## Bad Example
```
Frontend Team + Backend Team + Database Team = Order feature takes 3 teams
```
---
## Good Example
```
Order Management Team (owns frontend + backend + persistence)
Payment Team (owns payment frontend + backend + persistence)
```
---
## Exceptions
Small teams (2–5 devs) where one team handles multiple capabilities; capabilities are still separated in code.
---
## Consequences Of Violation
Coordination overhead, slow delivery, architectural coupling.
---
## Rule 4: Start with coarse-grained capabilities and split as they grow
---
## Category
Architecture
---
## Rule
Begin with broad capability boundaries and split into finer-grained capabilities only when a capability becomes too large for one team to manage.
---
## Reason
Premature fine-grained decomposition creates unnecessary complexity and cross-capability communication overhead.
---
## Bad Example
```
Initial decomposition: 15 micro-capabilities (UserRegistration, UserLogin, UserPasswordReset...)
All 15 need to communicate. Complexity explodes.
```
---
## Good Example
```
Initial: UserManagement (coarse)
Later split: UserAuthentication, UserProfile, UserAdmin (when team size/scale demands)
```
---
## Exceptions
When the domain is well-understood and the decomposition is obvious from Event Storming.
---
## Consequences Of Violation
Too many small capabilities, high communication overhead, distributed monolith.
---
## Rule 5: Define explicit capability interfaces (ports) for cross-capability communication
---
## Category
Architecture
---
## Rule
Capabilities communicate through well-defined interfaces (ports/events), never through direct internal access to another capability's code.
---
## Reason
Direct access creates tight coupling between capabilities, making independent development and extraction impossible.
---
## Bad Example
```php
// OrderManagement directly accesses PaymentProcessing's internal service
use App\PaymentProcessing\Services\PaymentService;
```
---
## Good Example
```php
// PaymentProcessing exposes a port
namespace App\PaymentProcessing\Ports;

interface PaymentGateway
{
    public function charge(Money $amount): ChargeResult;
}

// OrderManagement depends only on the port
namespace App\OrderManagement;

class OrderService
{
    public function __construct(
        private PaymentGateway $payments // port
    ) {}
}
```
---
## Exceptions
When both capabilities are in the same module and will never be separated (co-located teams).
---
## Consequences Of Violation
Internal coupling between capabilities, impossible to extract as services.
