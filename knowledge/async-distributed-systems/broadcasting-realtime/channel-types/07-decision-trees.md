# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Broadcasting & Real-Time
**Knowledge Unit:** K032 — Channel Types
**Generated:** 2026-06-03

---

# Decision Inventory

* Public vs Private Channel Selection

---

# Architecture-Level Decision Trees

---

## Public vs Private Channel Selection

---

### Decision Context

Whether to use public channels (no auth) or private channels (auth required) for broadcasting events.

---

### Decision Criteria

* Data sensitivity
* User-specific vs general content
* Authentication requirements
* Presence tracking needs

---

### Decision Tree

Data contains user-specific information?
YES → Use PrivateChannel — authentication required
NO → Need to track connected users (presence, "who's online")?
    YES → Use PresenceChannel — auth + user state tracking
NO → Data is non-sensitive (sports scores, public announcements)?
    YES → Public channel is acceptable
NO → Default?
    YES → Use PrivateChannel — safer default

---

### Rationale

Public channels have no authentication — any subscriber with the channel name receives all events. Private channels require authenticated authorization. Presence channels extend private with connected user state.

---

### Recommended Default

**Default:** Use `PrivateChannel` for user-specific data; `PresenceChannel` for collaborative features; public channels only for truly non-sensitive broadcasts
**Reason:** Private channels prevent unauthorized access to user-specific data. Public channels should be the exception, not the default.

---

### Risks Of Wrong Choice

- Public channel for user data: any subscriber can listen — privacy violation
- Private channel for public data: unnecessary auth complexity
- Presence channel for non-collaborative features: wasted bandwidth for user state

---

### Related Rules

- never-broadcast-sensitive-data-on-public-channels
- keep-broadcast-event-payloads-minimal

---

### Related Skills

- Configure Broadcasting and Real-Time Events
- Configure Channel Authorization and Authentication
