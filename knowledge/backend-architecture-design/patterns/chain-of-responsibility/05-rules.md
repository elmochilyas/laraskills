## Rule 1: Chain of Responsibility passes a request along a chain of handlers
---
## Category
Architecture
---
## Rule
Each handler in the chain decides whether to process the request or pass it to the next handler.
---
## Reason
Chain of Responsibility decouples the sender from the receiver, allowing multiple handlers a chance to process without the sender knowing which handler will handle it.
---
## Bad Example
```php
class OrderHandler
{
    public function handle(Order $order): void
    {
        if ($order->total->amount() > 1000) {
            $this->sendForApproval($order);
        } elseif ($order->isExpress()) {
            $this->processExpress($order);
        } else {
            $this->processStandard($order);
        }
    }
}
```
---
## Good Example
```php
interface OrderHandler
{
    public function setNext(OrderHandler $handler): OrderHandler;
    public function handle(Order $order): ?OrderResult;
}

class ApprovalRequiredHandler implements OrderHandler
{
    private ?OrderHandler $next = null;

    public function setNext(OrderHandler $handler): OrderHandler
    {
        $this->next = $handler;
        return $handler;
    }

    public function handle(Order $order): ?OrderResult
    {
        if ($order->total->amount() > 1000) {
            return $this->sendForApproval($order);
        }
        return $this->next?->handle($order);
    }
}
```
---
## Exceptions
When the handler chain is short and static (a simple if-else is clearer).
---
## Consequences Of Violation
Large conditional blocks, OCP violation, handling logic coupled.
---
## Rule 2: The chain can be configured dynamically at runtime
---
## Category
Architecture
---
## Rule
Build the handler chain dynamically (e.g., from configuration or middleware list) rather than hard-coding the chain inside a handler.
---
## Reason
Dynamic configuration allows adding/removing handlers without modifying code.
---
## Bad Example
```php
$handler = new ApprovalHandler();
$handler->setNext(new ExpressHandler());
$handler->setNext(new StandardHandler());
// Chain hard-coded
```
---
## Good Example
```php
$handlers = config('order.handlers'); // ['approval', 'express', 'standard']
$chain = ChainBuilder::build($handlers);
$chain->handle($order);
```
---
## Exceptions
When the chain is fixed and never changes (static configuration is acceptable).
---
## Consequences Of Violation
Chain changes require code changes, not configurable.
---
## Rule 3: Each handler should either handle or pass—not both for the same request
---
## Category
Architecture
---
## Rule
A handler either processes the request (and stops the chain) or passes it to the next handler. It should not do both.
---
## Reason
Combining handling and passing creates unpredictable behavior and breaks the chain's contract.
---
## Bad Example
```php
class LoggingHandler
{
    public function handle(Request $request): ?Response
    {
        Log::info('Request: ' . $request->url());
        $this->next->handle($request); // both logs AND passes
        return null; // who handled it?
    }
}
```
---
## Good Example
```php
class LoggingMiddleware
{
    public function handle(Request $request, callable $next): Response
    {
        Log::info('Request: ' . $request->url());
        return $next($request); // always passes to next
    }
}
// Or: handler either handles or passes (not both)
```
---
## Exceptions
Middleware that decorates the request/response without making handling decisions.
---
## Consequences Of Violation
Unpredictable chain behavior, multiple handlers processing same request.
