# Knowledge Unit: Budget Management

## Metadata

- **ID:** ku-05
- **Subdomain:** Observability & Monitoring
- **Slug:** budget-management
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Budget management for AI systems involves setting, communicating, and enforcing spending limits across dimensions (user, team, feature, application, environment). Unlike traditional cloud cost management (where budgets are mainly informational), AI budget management must be **enforceable in real-time** â€” an unconstrained agent loop or a prompt injection attack can exhaust a monthly budget in minutes. Budget management builds on cost tracking (ku-01) and token analytics (ku-04) to provide proactive spending controls.

## Core Concepts

- **Budget Window:** The time period over which a budget applies (daily, weekly, monthly, quarterly, annual).
- **Hard Budget:** A strict limit that blocks requests once exceeded. Used for cost-critical paths.
- **Soft Budget:** A limit that triggers alerts but does not block requests. Used for informational tracking.
- **Budget Tier:** Different budget levels per user or tenant (free tier: $5/month, pro tier: $50/month, enterprise: custom).
- **Budget Rollover:** Unused budget from one period carries to the next (or not, depending on policy).
- **Budget Pool:** Shared budget across multiple users or features (e.g., team pool of $500/month).
- **Budget Alert:** Notification when spending reaches configurable thresholds (50%, 80%, 90%, 100%, 110%).
- **Budget Reset:** The process of resetting counters at the end of a budget window.

## Mental Models

- **Budget Window:** The time period over which a budget applies (daily, weekly, monthly, quarterly, annual).
- **Hard Budget:** A strict limit that blocks requests once exceeded. Used for cost-critical paths.
- **Soft Budget:** A limit that triggers alerts but does not block requests. Used for informational tracking.


## Internal Mechanics

The internal mechanics of Budget Management follow established patterns within the Observability & Monitoring domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Implement hard budgets for external-facing APIs.** Enforce limits at the gateway before the LLM call.
- **Alert early and often.** 50%, 80%, 90%, 100%, and 110% of budget are standard alert thresholds.
- **Provide self-service budget views.** Users and teams should see their current spend vs. budget without asking.
- **Support multiple budget windows.** A daily hard budget prevents runaway costs within a single day; a monthly soft budget tracks long-term trends.
- **Budget per dimension, not globally.** A global budget that one user exhausts blocks all users.
- **Automate budget increases.** For approved growth, budgets should be adjustable via config changes, not code deployments.

## Patterns

- **Implement hard budgets for external-facing APIs.** Enforce limits at the gateway before the LLM call.
- **Alert early and often.** 50%, 80%, 90%, 100%, and 110% of budget are standard alert thresholds.
- **Provide self-service budget views.** Users and teams should see their current spend vs. budget without asking.
- **Support multiple budget windows.** A daily hard budget prevents runaway costs within a single day; a monthly soft budget tracks long-term trends.
- **Budget per dimension, not globally.** A global budget that one user exhausts blocks all users.
- **Automate budget increases.** For approved growth, budgets should be adjustable via config changes, not code deployments.

## Architectural Decisions

- Store budget definitions in a **database or config service** (not hardcoded) for runtime updates.
- Enforce budgets in the **gateway middleware** â€” check budget before forwarding the request to the LLM provider.
- Use **Redis counters** for real-time budget tracking (INCR with appropriate TTL for window).
- For monthly budgets, use a **cron job or scheduled task** to reset counters at the start of each month.
- Implement a **budget audit log** â€” track every budget check result (approved, rejected, reason) for compliance.
- For Laravel, use the **scheduler** for budget resets and **Redis** for real-time counters.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Budget check in Redis: <1ms. Acceptable on every request.
- Budget alert evaluation: evaluate alerts asynchronously (queue), not in the request path.
- Budget reset: scheduled task that runs once per window (seconds to complete, depending on user count).
- Budget tier lookup: cache tier configurations in memory with 1-minute TTL.
- For high throughput, use **local budget counters** with periodic Redis sync (eventually consistent, fail-safe on the side of allowing).

## Production Considerations

- **Budget manipulation:** Ensure budget counters cannot be decremented by attackers (server-side only, never accept client-reported spend).
- **Budget exhaustion DoS:** An attacker could intentionally exhaust a shared budget to deny service to others. Use per-user budgets over pooled budgets where possible.
- **Budget policy integrity:** Only authorized admins should modify budget configurations.
- **Graceful degradation:** If the budget service is unavailable, decide whether to allow (risk of overspend) or deny (risk of false rejection) requests.
- **Cost attribution integrity:** Ensure budget consumption is attributed to the correct dimension (prevent tenant A's usage being charged to tenant B's budget).

## Common Mistakes

- Only implementing soft budgets â€” no enforcement, just alerts. Without hard budgets, overspend still happens.
- Setting budgets too high â€” not constraining costs. "Budget" should be a meaningful limit, not a rubber stamp.
- Ignoring daily windows â€” a monthly budget of $3000 can be exhausted in 3 hours by a runaway agent.
- Shared budgets without per-user limits â€” one user exhausts the team budget.
- Not resetting budgets correctly â€” counters persist across windows, causing premature budget exhaustion.
- No budget for embedding/vector costs â€” focusing only on LLM inference while embeddings and vector DB queries add significant cost.

## Failure Modes

- **Budget as Surprise:** Users discover they've been blocked when they hit the limit. Notify at 80% and 90%.
- **Hard Budgets Everywhere:** Hard budgets on every dimension create a frustrating experience. Use hard budgets for cost-critical paths, soft budgets for informational tracking.
- **No Emergency Override:** When a legitimate need exceeds the budget, there should be a manual override process.
- **Stale Budgets:** Budgets set once and never reviewed. Budgets should be reviewed and adjusted quarterly.
- **One Budget to Rule Them All:** A single global budget for all AI spend. Different features, teams, and environments need separate budgets.

## Ecosystem Usage

### Budget Enforcement Middleware
```php
class BudgetEnforcementMiddleware {
    public function __construct(
        private Redis $redis,
        private BudgetRepository $budgets,
    ) {}

    public function handle(Request $request, Closure $next): Response {
        $user = $request->user();
        $budget = $this->budgets->getActiveBudget($user->tier());

        if ($budget === null) {
            return $next($request); // no budget configured
        }

        $key = "budget:{$budget->id}:" . date('Y-m');
        $currentSpend = (float) $this->redis->get($key) ?: 0;

        // Estimate cost before LLM call
        $estimatedCost = $this->estimateCost($request);
        if ($currentSpend + $estimatedCost > $budget->hardLimit) {
            $this->budgets->logBlocked($user->id, $budget->id, $currentSpend);
            return response()->json([
                'error' => 'Monthly budget exceeded.',
                'budget' => $budget->hardLimit,
                'spent' => $currentSpend,
                'resets_at' => $budget->resetsAt(),
            ], 429);
        }

        return $next($request);
    }
}
```

### Budget Configuration
```php
$budgets = [
    'free_tier' => new Budget(
        hardLimit: 5.00,          // $5/month
        softLimit: 4.00,          // alert at $4
        window: BudgetWindow::Monthly,
        alerts: [50, 80, 90, 100],
    ),
    'pro_tier' => new Budget(
        hardLimit: 50.00,
        softLimit: 40.00,
        window: BudgetWindow::Monthly,
        alerts: [50, 80, 90, 100],
    ),
];
```

## Related Knowledge Units

- ku-01 (Cost Tracking & Allocation): Data that feeds into budget tracking.
- ku-02 (Cost Optimization Strategies): Optimization helps stay within budget.
- ku-03 (Observability & Alerting): Budget alerts in the observability system.
- ku-04 (Token Usage Analytics): Token budgets as a complement to cost budgets.
- ai-safety-security/ku-05: Rate limiting complements budget enforcement.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

