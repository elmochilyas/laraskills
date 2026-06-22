# Anti-Patterns: Billing Failure States, Trials, Grace Periods & Downgrades

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | SaaS Billing Architecture |
| Knowledge Unit | Billing Failure States, Trials, Grace Periods & Downgrades |
| Audience | Developers, Product Managers, Billing Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-BFS-01 | Immediate Lockout on Payment Failure | High | Medium | Medium |
| AP-BFS-02 | Treating Canceled as No Access | High | Medium | Medium |
| AP-BFS-03 | Crippled Trial Experience | High | High | Low |
| AP-BFS-04 | Silent Trial Expiration | High | High | Low |
| AP-BFS-05 | Hardcoding Product Policy in Billing Model | High | High | High |

---

## Repository-Wide Anti-Patterns

- **Boolean `is_subscribed` Instead of State Machine**: Using a binary check instead of modeling the full subscription lifecycle (trial, active, past_due, canceled, expired)
- **Billing State Checks in Controllers Instead of Entitlement Layer**: Controllers checking `$team->subscription->stripe_status` to gate features
- **No Cancellation Reason Tracking**: Canceling subscriptions without collecting or logging the reason, losing retention insight

---

## 1. Immediate Lockout on Payment Failure

### Category
Business Continuity · Customer Experience

### Description
Revoking feature access immediately when a subscription enters `past_due` status due to a failed payment, instead of providing a grace period during which the user can fix the payment issue.

### Why It Happens
The payment failed. The instinctive reaction is "no payment, no service." The developer reasons that access should be revoked until payment is restored. This logic makes sense in a vacuum — but most payment failures are transient. The code is simple: `if ($subscription->stripe_status === 'past_due') { revokeAccess(); }`. The business impact of churn from lockout is not immediately visible in the code.

### Warning Signs
- `past_due` status triggers immediate access revocation in webhook handlers
- No grace period configuration exists in the codebase
- No payment failure notification template (because access is revoked, not warned about)
- Support tickets: "My card expired and your system immediately locked me out of my work"
- Higher-than-industry-average churn rate for payment failures

### Why Harmful
Most payment failures are transient: expired cards (user hasn't updated), insufficient funds on debit (paycheck hasn't arrived), bank maintenance (temporary decline), fraud-detection false positive (bank blocked the transaction). Immediately locking out a paying customer for any of these reasons punishes them for a problem they didn't cause. It destroys trust, drives churn, and generates support tickets. The customer who was happily paying for 12 months is now locked out and angry because their card expired.

### Real-World Consequences
- Customer on annual plan, card expires before renewal. Locked out of critical business tools. Spends 2 hours with support. Switches to competitor.
- Batch of payments fails due to bank processing issue. 200 customers locked out simultaneously. Support overwhelmed. Social media backlash.
- Churn analysis: "payment failure churn is 10x normal churn." Investigation reveals immediate lockout as root cause. Revenue impact: $50k/month in preventable churn.
- Industry data: companies with grace periods retain 60-80% of customers who experience payment failures. Companies without grace periods retain 10-30%.

### Preferred Alternative
Default to full feature access during `past_due` for a configurable grace period (7-14 days). Send progressive notifications: payment failure notice (immediate), 3-day warning, 24-hour final warning. Only revoke access after grace period expires. See Rule 2: Default to Allowing Access During Grace Periods.

### Refactoring Strategy
1. Remove immediate access revocation from `invoice.payment_failed` webhook handler
2. Add grace period configuration: `config('billing.grace_period_days', 7)`
3. Implement `isOnGracePeriod()` and `hasGracePeriodExpired()` on Subscription model
4. Update EntitlementService to check grace period status before revoking access
5. Create notification jobs for progressive grace period warnings
6. Schedule revocation at grace period end via delayed job
7. Test: payment fails → access continues → grace ends → access revoked

### Detection Checklist
- [ ] Does `past_due` status trigger immediate access revocation?
- [ ] Is there a grace period configuration value?
- [ ] Are payment failure notifications sent before access is revoked?
- [ ] What is the churn rate for customers who experience payment failures?
- [ ] Do support tickets mention being "immediately locked out"?

### Related Rules/Skills/Trees
- Rule 2: Default to Allowing Access During Grace Periods
- Rule 1: Billing State and Entitlement Are Separate
- Handle Billing Failure States, Trials, Grace Periods & Downgrades (06-skills.md)
- Grace Period Feature Access — Full vs Restricted vs Configurable (07-decision-trees.md)

---

## 2. Treating Canceled as No Access

### Category
Business Integrity · Customer Experience

### Description
Revoking feature access immediately when a subscription enters `canceled` status, instead of recognizing that "canceled" with `cancel_at_period_end = true` means the customer has paid for access until the period end.

### Why It Happens
The word "canceled" implies "no longer active." The developer maps Stripe's `canceled` status to "no access" in the entitlement layer. They don't distinguish between "canceled with future expiration" (access still valid) and "expired" (access should be revoked). The `cancel_at_period_end` flag is overlooked or not understood.

### Warning Signs
- `$subscription->stripe_status === 'canceled'` triggers access revocation
- No distinction between `canceled` and `expired` in the Subscription model
- `cancel_at_period_end` column exists in the database but is never checked in access logic
- Customers report: "I canceled but my access was revoked immediately — I already paid for this month"
- Chargeback or consumer protection complaints about payment for service not delivered

### Why Harmful
When a customer cancels, they cancel renewal — not their current access. They've already paid for the period from `current_period_start` to `current_period_end`. Revoking access immediately means taking money for a service you don't deliver. In many jurisdictions, this is a consumer protection violation. It also eliminates any opportunity for the customer to reconsider, export their data, or be won back.

### Real-World Consequences
- Customer cancels annual plan month 3 of 12. Access revoked immediately. Customer paid for 12 months, received 3. Demands refund for remaining 9 months. Chargeback initiated.
- Regulatory complaint: "Company charged my card for annual subscription and revoked access when I canceled." Consumer protection agency investigation.
- Negative reviews: "They take your money and lock you out immediately if you cancel."
- Lost win-back opportunity: customer who experiences a graceful wind-down (access until period end with "we're sorry to see you go" messaging) is more likely to return than one locked out abruptly.

### Preferred Alternative
Canceled with `cancel_at_period_end = true`: full access until the period end. Only after the period ends does the subscription become `expired` and access is revoked. Schedule the `ProcessSubscriptionExpiry` job at `current_period_end` to handle post-expiration cleanup.

### Refactoring Strategy
1. Add `isExpired()` method that checks: canceled + (ended_at is past OR current_period_end is past)
2. Update `hasAccess()` to return true for canceled-but-not-expired subscriptions
3. Update entitlement layer to grant access during canceled-but-not-expired state
4. Schedule `ProcessSubscriptionExpiry` job at `current_period_end` for post-expiration cleanup
5. Add "Your access will continue until [date]" messaging in cancellation confirmation
6. Test: cancel → access continues → period ends → access revoked

### Detection Checklist
- [ ] Does `canceled` status trigger immediate access revocation?
- [ ] Is there a distinction between `canceled` and `expired` in the access logic?
- [ ] Is `cancel_at_period_end` checked before revoking access?
- [ ] Is there a delayed job scheduled for post-expiration cleanup?
- [ ] Does the cancellation confirmation display the access end date?

### Related Rules/Skills/Trees
- Rule 3: Canceled Subscriptions Retain Access Until Period End — Never Revoke Immediately
- Handle Billing Failure States, Trials, Grace Periods & Downgrades (06-skills.md)

---

## 3. Crippled Trial Experience

### Category
Business · Conversion

### Description
Limiting feature access during the trial period to a subset of the plan's full capabilities, preventing users from evaluating the complete product value.

### Why It Happens
The product team worries about "giving away too much for free" or wants to upsell during the trial ("unlock this feature by upgrading to paid"). The developer implements this by filtering plan features during trial in the entitlement service. The assumption is that showing less value during trial will drive more conversions — but the opposite is true.

### Warning Signs
- `if ($subscription->isOnTrial()) { return $this->filterToBasicFeatures($features); }` in entitlement code
- Trial users see feature-gating messages: "Upgrade to Pro to unlock this feature" (while already on Pro trial)
- Sales demos struggle because trial accounts can't show premium features
- Product team discusses "trial feature limitations" rather than "trial experience optimization"
- Lower-than-industry-average trial-to-paid conversion rate

### Why Harmful
A trial's purpose is to demonstrate the full value of the product. If the most compelling features are hidden during trial, users never experience the reason to pay. Premium features often close deals — showing a restricted version undermines the sales proposition. The product is competing against competitors who offer full-featured trials, and losing.

### Real-World Consequences
- Enterprise features (SSO, audit logs, API access) hidden during trial → IT decision-maker can't evaluate compliance requirements → trial ends without conversion
- 14-day trial with only basic features → user doesn't see the premium dashboards, reports, or automation that differentiate the product → concludes "this is just like [cheaper competitor]" → churns
- Sales team frustrated: "I can't demo the real product to prospects on a trial"
- Conversion rate analysis: trial-to-paid conversion is 8% (industry average for full-featured SaaS trials is 15-25%)

### Preferred Alternative
Full feature access during trial. The user should experience everything they'd get on the paid plan. The "upsell" is "keep using these features by subscribing" — not "subscribe to see what these features look like." If specific features have hard costs (API credits, compute), provide a generous trial allocation.

### Refactoring Strategy
1. Remove feature filtering during trial from the entitlement service
2. If cost-bearing features need limits, set generous trial quotas (e.g., 1000 API calls instead of 100)
3. Add trial-expiration messaging: "Your Pro trial includes these features. Subscribe to keep using them."
4. Track conversion rate before and after the change
5. A/B test if the product team insists: full-feature trial vs limited trial

### Detection Checklist
- [ ] Are features filtered or restricted during trial in the entitlement layer?
- [ ] Can a trial user access all features of their chosen plan?
- [ ] What is the trial-to-paid conversion rate? (Benchmark: 15-25% for full-featured SaaS trials)
- [ ] Can sales demos show the full product on a trial account?
- [ ] Are there feature-gating messages that appear only during trial?

### Related Rules/Skills/Trees
- Rule 4: Trials Should Provide Full Feature Access
- Handle Billing Failure States, Trials, Grace Periods & Downgrades (06-skills.md)

---

## 4. Silent Trial Expiration

### Category
Business · User Experience

### Description
Allowing trial periods to expire without notifying the user in advance, resulting in surprise charges (if auto-conversion) or surprise access loss (if manual conversion).

### Why It Happens
The trial period is set in Stripe (e.g., 14 days) and the subscription transitions automatically. The developer handles the Stripe webhook that fires at trial end but doesn't build proactive notifications. The trial "just works" — until it doesn't. The notification system is deprioritized because "the trial works without it."

### Warning Signs
- No scheduled job for trial ending notifications
- No notification templates for "trial ending soon" or "trial expired"
- Users report: "I had no idea my trial was ending and suddenly I was charged"
- Chargebacks with reason "subscription canceled" occurring at trial-end dates
- No "days remaining in trial" display in the application UI

### Why Harmful
A user who is surprised by a charge files a chargeback. A user who is surprised by access loss leaves a negative review. Both outcomes are preventable with timely communication. Chargebacks damage your merchant reputation with Stripe. Negative reviews deter future customers. The cost of building a notification schedule is orders of magnitude lower than the cost of chargebacks and reputation damage.

### Real-World Consequences
- User signs up for 14-day trial, forgets about it. Card charged $99 on day 15. User disputes charge (chargeback). Stripe charges $15 chargeback fee. Merchant reputation score decreases.
- User is on trial, building workflows. Trial expires without warning. Access revoked. Workflows lost. User leaves 1-star review: "They delete your data without warning."
- 30% of trial-to-paid conversions result in chargebacks within 30 days because users were surprised by the charge.
- Support team spends 20% of time handling "I didn't know my trial was ending" tickets.

### Preferred Alternative
Send multi-touchpoint trial notifications: 7 days before end, 3 days before end, 1 day before end, on the day of expiration. Display remaining trial days in the application UI. For auto-conversion trials: clearly communicate "Your card will be charged $X on [date]." For manual-conversion trials: clearly communicate "Add a payment method by [date] to keep access."

### Refactoring Strategy
1. Create `NotifyTrialEnding` scheduled job (runs daily)
2. Implement notification schedule: 7d, 3d, 1d before trial end, on expiration day
3. Add "X days remaining in your trial" widget to the application dashboard
4. Ensure trial signup confirmation email states the end date and what happens at expiration
5. Track chargeback rate for trial conversions before and after implementing notifications

### Detection Checklist
- [ ] Are trial ending notifications sent before the trial expires?
- [ ] Is trial remaining time displayed in the application UI?
- [ ] Does the trial signup flow communicate the end date and what happens after?
- [ ] What is the chargeback rate for trial-to-paid conversions?
- [ ] Do support tickets mention surprise charges or surprise access loss?

### Related Rules/Skills/Trees
- Rule 5: Notify Users Before Trial Expiration — Multiple Touchpoints
- Handle Billing Failure States, Trials, Grace Periods & Downgrades (06-skills.md)

---

## 5. Hardcoding Product Policy in Billing Model

### Category
Architecture · Product Agility

### Description
Embedding product decisions (grace period length, trial feature access, communication timing) directly in the Subscription model or billing code instead of in the configurable entitlement layer or configuration files.

### Why It Happens
During initial development, it's natural to put "past_due = no access" or "trial = full features" directly in the code. These feel like technical decisions. As the product evolves, the product manager wants to A/B test a 14-day grace period instead of 7 days, or offer limited trial access to one market and full access to another. The code needs refactoring because product policy is hardcoded.

### Warning Signs
- Product policy values (grace period days, trial days, feature lists per state) are constants in PHP classes
- Product manager asks "can we try a 14-day grace period for enterprise customers?" → answer involves a code change and deploy
- A/B testing billing behavior requires environment variables or feature flags that were retrofitted
- EntitlementService contains hardcoded rules like `if ($subscription->isOnGracePeriod()) { return $coreFeatures; }`

### Why Harmful
The product team cannot iterate on billing experience without engineering involvement. A simple A/B test on grace period length requires a code change, deploy, and potentially a rollback if it doesn't work. Different markets or plans cannot have different policies because the code assumes uniform behavior. The separation between "billing state" and "product behavior" is lost — the billing model becomes a product configuration file.

### Real-World Consequences
- Product manager: "Let's test full access vs core-only during grace period." Engineering estimate: 2 weeks (refactor entitlement service, add configuration, deploy, set up A/B). Competitor ships the test in 2 days.
- Enterprise customer wants a 30-day grace period (standard for their procurement process). Hardcoded at 7 days. Requires a custom branch.
- Marketing wants a special "holiday trial extension" from 14 to 30 days. Requires code change, deploy during code freeze. Opportunity missed.
- New pricing page offers "annual plans get 30-day grace period." Code says 7 days for everyone. Either the feature is delayed or the pricing page lies.

### Preferred Alternative
Product policy is configuration, not code. Grace period length, trial access level, notification timing — all configurable per plan, per market, or globally via `config()` or a database-driven settings table. The billing state machine reports facts. The entitlement layer applies policy. The policy comes from configuration that the product team can change.

### Refactoring Strategy
1. Extract all hardcoded product policy values into `config('billing.*')` keys
2. Create a `BillingPolicy` service that reads configuration and answers policy questions
3. Update EntitlementService to delegate policy decisions to BillingPolicy
4. Make BillingPolicy database-driven if per-plan or per-market policies are needed
5. Document: "Product team can change these values without a code deploy"

### Detection Checklist
- [ ] Are product policy values (grace period, trial days, feature restrictions) hardcoded in PHP?
- [ ] Can the product team change grace period length without a code deploy?
- [ ] Can different plans have different grace period or trial policies?
- [ ] Is A/B testing billing behavior possible without code changes?
- [ ] Is the billing state machine free of product policy decisions?

### Related Rules/Skills/Trees
- Rule 1: Billing State and Entitlement Are Separate — The Billing State Machine Informs Entitlement, It Doesn't Dictate It
- Handle Billing Failure States, Trials, Grace Periods & Downgrades (06-skills.md)
- Implement Plan, Feature & Entitlement Model (06-skills.md)
