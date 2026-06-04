# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Swoole io_uring Integration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Enabling io_uring for I/O operations | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Enable io_uring in Swoole

---

## Decision Context

io_uring is a Linux kernel async I/O interface. Swoole can use it for file and network I/O, reducing syscall overhead by using submission/ completion queues.

---

## Decision Criteria

* **performance** — reduces syscall overhead for I/O-heavy workloads
* **architectural** — requires Linux 5.1+ (ideally 5.10+)
* **operations** — kernel support must be verified

---

## Decision Tree

Is the app I/O-bound (files, network)?
↓
**NO** — io_uring provides minimal benefit for CPU-bound apps.
**YES** → Evaluate kernel support.

---

Is the Linux kernel version 5.10+?
↓
**YES** — Enable io_uring. Swoole detects and uses it automatically.
**5.1-5.9** — Partial support. Test first.
**<5.1** — Not supported. Use standard epoll.

---

Is this a containerized environment?
↓
**YES** — Verify host kernel supports io_uring. Container inherits host kernel.
**NO** — Direct kernel check.

---

Are high I/O operations expected (>1000 req/s with file/network)?
↓
**YES** — io_uring provides meaningful benefit (~10-20% I/O throughput gain).
**NO** — Benefit may not justify testing.

---

## Recommended Default

**Default:** Enable io_uring on Linux 5.10+ for I/O-heavy apps.
**Reason:** Reduces syscall overhead; Swoole handles detection automatically.

---

## Risks Of Wrong Choice

* io_uring on old kernel: may fail silently, fall back to epoll
* Expecting benefit for CPU-bound apps: no improvement

---

## Related Skills

* Swoole io_uring Integration
