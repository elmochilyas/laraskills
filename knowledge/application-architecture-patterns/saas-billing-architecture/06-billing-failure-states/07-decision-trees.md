# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Billing Failure States, Trials, Grace Periods & Downgrades
**Generated:** 2026-06-22

---

# Decision Inventory

* Decision 1: Grace period feature access — full vs restricted vs configurable
* Decision 2: Downgrade strategy — at period end vs immediate with proration
* Decision 3: Trial payment method — required vs optional
* Decision 4: Cancellation flow — self-service portal vs custom UI

---

# Architecture-Level Decision Trees

---

## Decision: Grace Period Feature Access — Full vs Restricted vs Configurable

---

### Decision Context

Determine what feature access to provide during the `past_due` grace period — the window between payment failure and access revocation.

---

### Decision Criteria

* business risk: full access during grace period may allow users to consume features they ultimately don't pay for; restricted access protects revenue
* customer experience: full access is user-friendly and reduces churn; restricted access may frustrate paying users who fix their payment within hours
* product complexity: configurable access requires per-plan or per-feature configuration; full/restricted is simpler
* churn prevention: full access gives users time to fix payment without losing productivity; restricted access adds urgency

---

### Decision Tree

What is the primary cause of payment failures for your customer base?
↓
PRIMARILY TRANSIENT (expired cards, insufficient funds on debit, bank maintenance)
    → Full access during grace period (users will fix the issue within hours/days)
    ↓
    Do these users typically fix payment within 48 hours?
    YES → Full access with 7-14 day grace period (standard industry practice)
    NO → Full access with 14+ day grace period + more aggressive communication

PRIMARILY HARD FAILURES (card reported stolen, account closed, deliberate non-payment)
    → Consider restricted access after an initial full-access window
    ↓
    Days 1-7: full access (transient failures resolve within this window)
    Days 8+: restricted to core features only (hard failures need escalation)
    ↓
    RESTRICTED features: read-only access, data export, core essential features
    HIDDEN features: premium add-ons, usage-heavy features, API access

What is the dollar value of features consumed during grace period?
LOW (features don't have per-use cost) → Full access (no revenue risk from free usage)
HIGH (API credits, compute time, storage bandwidth) → Restricted or metered access
    Track consumption during grace period; deduct from next paid invoice

---

### Rationale

Full access during the grace period is the correct default for most SaaS products. The overwhelming majority of payment failures are transient and resolve within days. Locking users out immediately punishes them for a bank-side issue and drives churn. If specific features have hard per-use costs, those can be metered and recovered on the next successful payment rather than blocked.

---

### Recommended Default

**Default:** Full feature access during grace period (7-14 days) with progressive communication (payment failure notification → 3-day warning → 24-hour final warning). Configurable per plan: some plans may restrict to core features, but the default is full access.

**Reason:** Maximizes user retention while minimizing churn. Communication drives urgency without punitive lockout. Configuration allows the product team to adjust per-plan without code changes.

---

### Risks Of Wrong Choice

Immediate lockout: user's card expires, they get locked out of critical work tools, they switch to a competitor instead of updating their card. Full access indefinitely: user never updates payment because nothing changes, 30 days later the subscription is finally canceled, 30 days of unpaid usage. No communication: user doesn't know payment failed, gets locked out suddenly, files a chargeback for the previous month thinking they were charged for the lockout month.

---

### Related Rules

- Rule 2: Default to Allowing Access During Grace Periods
- Rule 1: Billing State and Entitlement Are Separate — The Billing State Machine Informs Entitlement, It Doesn't Dictate It

---

### Related Skills

- Handle Billing Failure States, Trials, Grace Periods & Downgrades
- Implement Plan, Feature & Entitlement Model

---

## Decision: Downgrade Strategy — At Period End vs Immediate with Proration

---

### Decision Context

Choose whether plan downgrades take effect immediately (with prorated credit) or at the end of the current billing period (no credit, no immediate change).

---

### Decision Criteria

* customer experience: immediate downgrade with credit is customer-friendly (they save money now); period-end downgrade is simpler to understand (no proration math)
* accounting complexity: proration generates credits and complex invoice line items; period-end is straightforward
* revenue impact: immediate with credit returns unused portion; period-end retains full payment
* operational: immediate requires Stripe to calculate and apply proration; period-end is a simple scheduled change

---

### Decision Tree

Does the customer expect to save money immediately on downgrade?
↓
YES → Is the revenue from the remaining period significant enough to justify proration complexity?
    YES → Offer immediate downgrade with proration as an option
    NO → Default to period-end; mention "your new plan takes effect on [date]"

Are you on a monthly or annual billing cycle?
MONTHLY → Period-end is a short wait (days to weeks); immediate has modest revenue impact
ANNUAL → Period-end could mean months of waiting; immediate with proration may be necessary for customer satisfaction
    BUT: annual proration credits can be large ($500+). Consider offering pro-rated credit as account credit, not refund.

What is the competitive landscape?
Competitors offer immediate downgrade → Match or exceed the experience
Competitors default to period-end → Period-end is acceptable
First-to-market / no direct competitors → Default to period-end with immediate as opt-in

---

### Rationale

Downgrade-at-period-end is the safer default for most SaaS products. It avoids proration accounting complexity, refund processing costs, and negative invoice line items. The customer knows exactly when the change takes effect. Immediate downgrade with proration should be offered as an option (or the default) in markets where customers expect it, but period-end is the lower-operational-overhead choice.

---

### Recommended Default

**Default:** Downgrade scheduled at period end. Customer sees "your plan will change to Starter on [period end date]." Optional: offer immediate downgrade with prorated account credit (not refund) as an opt-in on the downgrade confirmation page.

**Reason:** Minimizes accounting complexity and refund processing. Most customers on monthly plans wait days, not months. The opt-in provides flexibility without the operational default being complex.

---

### Risks Of Wrong Choice

Immediate with refund: cranky downgrade experience (negative invoice, waiting for refund to bank, confusing line items). Period-end for annual: customer downgrades month 2 of a 12-month plan, waits 10 months for the change, cancels instead and loses all access. No opt-in: customer wants immediate downgrade, can't get it, files a chargeback for the remaining period.

---

### Related Rules

- Rule 3: Canceled Subscriptions Retain Access Until Period End — Never Revoke Immediately

---

### Related Skills

- Handle Billing Failure States, Trials, Grace Periods & Downgrades
- Implement Cashier + BillingGateway Wrapper Pattern

---

## Decision: Trial Payment Method — Required vs Optional

---

### Decision Context

Determine whether users must provide a payment method to start a trial, or can start without one and add it later before the trial ends.

---

### Decision Criteria

* conversion rate: optional payment method increases trial signups (lower friction); required payment method pre-qualifies users with intent to pay
* billing recovery: required payment method enables automatic conversion at trial end; optional requires user action to convert
* fraud prevention: required payment method provides identity verification; optional allows easier abuse
* product maturity: new products may benefit from frictionless trials to build user base; mature products may optimize for qualified trials

---

### Decision Tree

What is your trial-to-paid conversion goal?
↓
MAXIMIZE TRIAL SIGNUPS → Payment method optional (frictionless onboarding)
    ↓
    Is fraud or abuse a concern (e.g., crypto mining on free trials)?
    YES → Add soft verification: email domain check, phone verification, usage caps
    NO → Frictionless trial with aggressive conversion notifications

MAXIMIZE CONVERSION QUALITY → Payment method required
    ↓
    Do you want automatic conversion at trial end?
    YES → Payment method required (Stripe charges automatically)
    NO → Payment method optional (user must manually subscribe, but higher intent signal)

What stage is the product?
EARLY (seeking product-market fit) → Optional (remove every barrier to trial)
GROWTH (scaling user base) → Optional or required depending on conversion data
MATURE (optimizing revenue) → Required (pre-qualifies users, reduces churn from payment failures)

---

### Rationale

The majority of SaaS products should require a payment method for trials. It pre-qualifies users, enables automatic conversion, reduces fraud, and aligns incentives. The "frictionless trial" argument is valid for new products seeking any user feedback, but as the product matures, payment qualification becomes more valuable than raw signup numbers. Businesses with high customer acquisition costs (enterprise sales) always require payment method; consumer SaaS may benefit from optional.

---

### Recommended Default

**Default:** Payment method required for trial. Automatic conversion at trial end. Clear communication: "Your card will be charged $X on [date]. Cancel anytime before then."

**Reason:** Maximizes trial-to-paid conversion by removing the manual re-subscription step. Pre-qualifies users. Reduces support tickets from "my trial ended and I lost access." Users who won't provide a payment method have low conversion probability anyway.

---

### Risks Of Wrong Choice

Required for new product: high friction kills trial signups, fewer users to learn from, slower product-market fit validation. Optional for mature product: 40% of trials never convert because users forget to add payment, significant revenue left on the table, abuse vector for resource-heavy features. Optional with caps: caps are hard to calibrate — too generous invites abuse, too restrictive prevents evaluation.

---

### Related Rules

- Rule 4: Trials Should Provide Full Feature Access
- Rule 5: Notify Users Before Trial Expiration — Multiple Touchpoints

---

### Related Skills

- Handle Billing Failure States, Trials, Grace Periods & Downgrades

---

## Decision: Cancellation Flow — Self-Service Portal vs Custom UI

---

### Decision Context

Choose whether to direct users to Stripe's hosted Customer Portal for subscription management (plan changes, cancellation, payment method updates) or build a custom billing management UI.

---

### Decision Criteria

* development cost: Stripe Customer Portal is zero-code; custom UI requires design, development, and maintenance
* flexibility: Customer Portal handles standard flows; custom UI supports custom flows (downgrade surveys, retention offers, custom plan transitions)
* user experience: Customer Portal is Stripe-branded (configurable but limited); custom UI is fully branded
* maintenance: Customer Portal updates automatically with Stripe changes; custom UI requires maintenance for Stripe API changes

---

### Decision Tree

Do your billing flows involve any of these: downgrade surveys, retention offers, custom plan transitions, non-standard pricing, multi-product subscriptions?
↓
YES → Custom UI required for that specific flow
    BUT: can the standard flows (view invoices, update payment method) still use Customer Portal?
    YES → Hybrid: Customer Portal for standard, custom pages for special flows
    NO → Full custom billing management

NO → Are all your plans within a single Stripe product family (standard upgrades/downgrades)?
    YES → Stripe Customer Portal handles everything you need
    ↓
    Is the portal branding sufficient for your brand requirements?
    YES → Use Customer Portal exclusively
    NO → Custom UI required for brand control

Are you early in development (pre-launch, MVP)?
YES → Use Stripe Customer Portal (ship faster, iterate later)
NO → Evaluate which custom flows are truly necessary vs nice-to-have

---

### Rationale

Stripe's Customer Portal is excellent for standard billing flows and should be the default. It handles payment method management, invoice history, plan switching, and cancellation — all with zero code. Only invest in custom billing management pages when you have specific requirements the portal doesn't support: downgrade surveys, retention offers at cancellation, custom plan transitions, or white-label branding requirements.

---

### Recommended Default

**Default:** Stripe Customer Portal for all standard billing management. Custom UI only for specific flows the portal doesn't support (downgrade surveys, retention offers). Hybrid approach: portal link for "Manage Billing," custom page for "Change Plan" (with survey) that redirects to portal for payment method updates.

**Reason:** Minimizes development and maintenance cost. Portal handles 80%+ of billing management needs. Custom UI is reserved for flows that differentiate your product or improve retention.

---

### Risks Of Wrong Choice

Full custom UI for standard flows: weeks of development replicating what Stripe gives for free, ongoing maintenance burden, risk of non-compliance with Stripe's recommended cancellation flows. Portal for everything: no opportunity to collect cancellation reasons, no retention offers, no downgrade surveys, lower insight into why customers leave. Hybrid without clear boundaries: users confused about which page to use for which action.
