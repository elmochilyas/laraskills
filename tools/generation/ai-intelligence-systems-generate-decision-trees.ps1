$domain = "C:\Users\Pc\Desktop\laravel skills from every thing claude code\research\workspaces\ai-intelligence-systems"
$subdomains = Get-ChildItem -LiteralPath $domain -Directory -Name | Where-Object { $_ -notmatch '^_' }

$total = 0
$created = 0
$skipped = 0

foreach ($sd in $subdomains) {
    $sdPath = Join-Path $domain $sd
    
    if (Test-Path (Join-Path $sdPath "04-standardized-knowledge.md") -PathType Leaf) {
        $kus = @(@{Name=$sd; Path=$sdPath})
    } else {
        $kuDirs = Get-ChildItem -LiteralPath $sdPath -Directory -Name -ErrorAction SilentlyContinue
        $kus = $kuDirs | ForEach-Object { @{Name=$_; Path=(Join-Path $sdPath $_)} }
    }
    
    foreach ($ku in $kus) {
        $total++
        $kuPath = $ku.Path
        $kuName = $ku.Name
        
        $has04 = Test-Path (Join-Path $kuPath "04-standardized-knowledge.md")
        $has05 = Test-Path (Join-Path $kuPath "05-rules.md")
        $has06 = Test-Path (Join-Path $kuPath "06-skills.md")
        $has07 = Test-Path (Join-Path $kuPath "07-decision-trees.md")
        
        if ($has04 -and $has05 -and $has06 -and -not $has07) {
            try {
                $knowledge = Get-Content -LiteralPath (Join-Path $kuPath "04-standardized-knowledge.md") -Raw -ErrorAction Stop
                $rules = Get-Content -LiteralPath (Join-Path $kuPath "05-rules.md") -Raw -ErrorAction Stop
                $skills = Get-Content -LiteralPath (Join-Path $kuPath "06-skills.md") -Raw -ErrorAction Stop
            } catch {
                $skipped++; continue
            }
            
            # Title
            $title = ""
            if ($knowledge -match 'title:\s*"(.+)"') { $title = $matches[1] }
            if ([string]::IsNullOrWhiteSpace($title) -and $knowledge -match '# (.+)') { $title = $matches[1] }
            if ([string]::IsNullOrWhiteSpace($title)) { $title = $kuName }
            
            # Subdomain display name - manual title casing
            $sdDisplay = $sd -replace '^\d+-', ''
            $sdDisplay = $sdDisplay -replace '-', ' '
            switch -wildcard ($sdDisplay) {
                'ai*' { $sdDisplay = 'AI' + $sdDisplay.Substring(2); break }
                'rag*' { $sdDisplay = 'RAG' + $sdDisplay.Substring(3); break }
                'llm*' { $sdDisplay = 'LLM' + $sdDisplay.Substring(3); break }
                default {
                    $words = $sdDisplay -split ' '
                    $cased = @()
                    foreach ($w in $words) {
                        if ($w -eq 'ai') { $cased += 'AI' }
                        elseif ($w -eq 'llm') { $cased += 'LLM' }
                        elseif ($w -eq 'sdk') { $cased += 'SDK' }
                        elseif ($w -eq 'sse') { $cased += 'SSE' }
                        elseif ($w -eq 'pii') { $cased += 'PII' }
                        elseif ($w -eq 'owasp') { $cased += 'OWASP' }
                        else { $cased += (Get-Culture).TextInfo.ToTitleCase($w.ToLower()) }
                    }
                    $sdDisplay = $cased -join ' '
                }
            }
            
            # Extract rules more robustly
            $ruleNames = @()
            # Try format: ## X\n---\n## Category
            $lines = $rules -split "`n"
            $skipPattern = '^(Category|Rule|Reason|Exceptions|Consequences|Bad Example|Good Example|Rules for)'
            foreach ($line in $lines) {
                if ($line -match '^##\s+(.+?)\s*$') {
                    $rn = $matches[1].Trim()
                    if ($rn.Length -gt 5 -and $rn -notmatch $skipPattern) {
                        $ruleNames += $rn
                    }
                }
                if ($line -match '^###\s+R\d+:\s+(.+?)\s*-\s*') {
                    $rn = $matches[1].Trim()
                    if ($rn.Length -gt 5) { $ruleNames += $rn }
                }
            }
            if ($ruleNames.Count -eq 0) {
                # Fallback - extract any substantive ## headings
                foreach ($line in $lines) {
                    if ($line -match '^##\s+(.+)') { $rn = $matches[1].Trim(); if ($rn.Length -gt 10) { $ruleNames += $rn } }
                }
            }
            if ($ruleNames.Count -eq 0) { $ruleNames = @("Configure $title Correctly", "Handle Errors and Edge Cases") }
            
            # Extract skills
            $skillNames = @()
            $parts = $skills -split '# Skill: '
            foreach ($part in $parts) {
                if ($part -match '^([^`#]+)') {
                    $sn = $matches[1].Trim()
                    if ($sn.Length -gt 3) { $skillNames += $sn }
                }
            }
            if ($skillNames.Count -eq 0) { $skillNames = @("Implement $title", "Test $title") }
            
            # Domain detection
            $hasFailover   = $knowledge -match '(?i)(failover|circuit.breaker|fallback|degrad)'
            $hasStreaming  = $knowledge -match '(?i)(stream|sse|websocket|chunk|buffering)'
            $hasSecurity   = $knowledge -match '(?i)(security|pii|sanitiz|injection|validation|xss|compliance)'
            $hasProvider   = $knowledge -match '(?i)(provider|openai|anthropic|gemini|ollama|mistral)'
            $hasVector     = $knowledge -match '(?i)(vector|embedding|pgvector|qdrant|pinecone|hnsw)'
            $hasRag        = $knowledge -match '(?i)(rag|retrieval|chunking|citation|rerank|context)'
            $hasAgent      = $knowledge -match '(?i)(agent|tool.call|workflow|orchestrat)'
            $hasPrompt     = $knowledge -match '(?i)(prompt|few.shot|chain.of.thought|system.prompt)'
            $hasObserv     = $knowledge -match '(?i)(observ|monitor|logging|tracing|otel|telemetry|metric)'
            $hasMiddleware = $knowledge -match '(?i)(gateway|middleware|proxy|router)'
            $hasCost       = $knowledge -match '(?i)(cost|token|budget|pricing|metering|billing)'
            $hasLocal      = $knowledge -match '(?i)(local|ollama|lm.studio|quantiz|docker.sail)'
            $hasEcosystem  = $knowledge -match '(?i)(package|community|ecosystem|plugin|library)'
            
            # Build 4 trees with domain-specific content
            $trees = @()
            
            # Tree 1: Implementation/Architecture (domain-specific)
            if ($hasVector) {
                $tree1 = @{
                    Name = "$title - Vector Database Selection"
                    Context = "Choosing the appropriate vector database and indexing strategy for $title."
                    Criteria = @("Performance", "Architectural", "Maintainability")
                    Tree = @"
What is the expected vector storage scale?
<100K vectors - Use pgvector with existing PostgreSQL (zero ops overhead)
100K-10M vectors - Use Qdrant or Pinecone for dedicated performance
>10M vectors - Use distributed setup with HNSW tuning and partitioning

Is existing PostgreSQL infrastructure available?
YES - Start with pgvector by default; add dedicated DB only when scaling demands it
NO - Choose Qdrant (self-hosted) or Pinecone (managed) based on ops capacity
"@
                    Default = "pgvector for small-to-medium scale; Qdrant for larger workloads"
                    DefaultReason = "Minimize operational complexity while maintaining performance"
                    Risk = "Wrong vector DB selection causes unnecessary infrastructure cost or poor query performance"
                }
            } elseif ($hasRag) {
                $tree1 = @{
                    Name = "$title - RAG Architecture Selection"
                    Context = "Designing the retrieval-augmented generation pipeline for $title."
                    Criteria = @("Architectural", "Performance", "Maintainability")
                    Tree = @"
What type of content is being retrieved?
DOCUMENTS - Implement chunking strategy with overlap and metadata preservation
CODE - Implement semantic code search with embedding generation
STRUCTURED DATA - Implement hybrid search (keyword + semantic)

Is answer quality (grounding/citations) required?
YES - Implement citation tracking with source metadata and grounded answer formatting
NO - Simple retrieval without source attribution
"@
                    Default = "Document chunking with semantic search and citation tracking"
                    DefaultReason = "Best balance of retrieval quality and implementation complexity"
                    Risk = "Poor RAG design leads to hallucinated answers and untrustworthy AI responses"
                }
            } elseif ($hasAgent) {
                $tree1 = @{
                    Name = "$title - Agent Architecture Selection"
                    Context = "Choosing the appropriate agent architecture for $title."
                    Criteria = @("Architectural", "Maintainability")
                    Tree = @"
Is the workflow sequential or branching?
SEQUENTIAL - Use linear agent chain with defined step order
BRANCHING - Use graph-based workflow with conditional routing

Does the agent need persistent state across invocations?
YES - Implement durable agent runtime with queued execution and state persistence
NO - Use stateless agent with single-turn invocation
"@
                    Default = "Durable agent runtime for production systems; stateless for simple tasks"
                    DefaultReason = "Persistence enables reliable multi-turn interactions"
                    Risk = "Wrong agent pattern causes state management issues and unreliable execution"
                }
            } elseif ($hasPrompt) {
                $tree1 = @{
                    Name = "$title - Prompt Strategy Selection"
                    Context = "Selecting the appropriate prompting technique for $title."
                    Criteria = @("Architectural", "Performance", "Maintainability")
                    Tree = @"
Does the task require reasoning steps?
YES - Implement chain-of-thought prompting with structured reasoning output
NO - Use direct instruction prompting with output schema

Is the prompt response format critical?
YES - Implement structured output schemas with JSON validation
NO - Use free-text response with post-processing

Does the prompt need versioning?
YES - Implement prompt versioning with A/B testing infrastructure
NO - Single prompt template with parameter substitution
"@
                    Default = "Structured output schemas with prompt versioning"
                    DefaultReason = "Ensures consistent, parseable responses and enables iterative improvement"
                    Risk = "Poor prompt design leads to inconsistent AI outputs and debugging difficulties"
                }
            } elseif ($hasStreaming) {
                $tree1 = @{
                    Name = "$title - Streaming Transport Selection"
                    Context = "Choosing the appropriate streaming transport for $title."
                    Criteria = @("Performance", "Architectural")
                    Tree = @"
Is the stream unidirectional or bidirectional?
UNIDIRECTIONAL - Use SSE (simple, HTTP-native, proxy-friendly)
BIDIRECTIONAL - Use WebSocket/Reverb for real-time bidirectional communication

Is Livewire used in the frontend?
YES - Use wire:stream for seamless Livewire integration
NO - Use SSE or WebSocket based on directionality requirements

Is nginx proxying the traffic?
YES - Configure proxy_buffering off, proxy_cache off, X-Accel-Buffering: no
NO - Standard streaming configuration sufficient
"@
                    Default = "SSE with nginx proxy configuration for most Laravel applications"
                    DefaultReason = "Simplicity and broad compatibility with existing infrastructure"
                    Risk = "Improper streaming setup causes response buffering and defeats real-time UX"
                }
            } elseif ($hasSecurity) {
                $tree1 = @{
                    Name = "$title - Defense Strategy Selection"
                    Context = "Selecting the appropriate security measures for $title."
                    Criteria = @("Security", "Architectural")
                    Tree = @"
What is the primary threat vector?
PROMPT INJECTION - Implement structured input parsing, delimiters, and output validation
PII LEAKAGE - Implement pseudonymization and data sanitization before LLM calls
CONTENT POLICY - Implement moderation and output guarding layers

Is the application user-facing with untrusted input?
YES - Implement defense-in-depth: input validation, prompt hardening, output guarding
NO - API-facing with trusted input requires fewer mitigation layers
"@
                    Default = "Defense-in-depth with input validation and output guarding"
                    DefaultReason = "Multiple layers provide resilience against evolving attack patterns"
                    Risk = "Insufficient security exposes the application to prompt injection and data leakage"
                }
            } elseif ($hasObserv) {
                $tree1 = @{
                    Name = "$title - Observability Strategy Selection"
                    Context = "Choosing the appropriate observability approach for $title."
                    Criteria = @("Performance", "Maintainability")
                    Tree = @"
What level of observability is required?
BASIC - Logging request/response with timing and error tracking
ADVANCED - OpenTelemetry distributed tracing with AI-specific span attributes
COMPREHENSIVE - Full observability stack: metrics, traces, logs, and alerting

Is AI-specific instrumentation needed?
YES - Use AI SDK semantic conventions for token counts, model names, latency
NO - Standard HTTP instrumentation covers visibility needs
"@
                    Default = "OpenTelemetry with AI-specific instrumentation for production"
                    DefaultReason = "Provides actionable insights for debugging and performance optimization"
                    Risk = "Insufficient observability makes AI debugging extremely difficult"
                }
            } elseif ($hasMiddleware) {
                $tree1 = @{
                    Name = "$title - Gateway/Middleware Selection"
                    Context = "Choosing the appropriate AI gateway strategy for $title."
                    Criteria = @("Architectural", "Performance", "Security")
                    Tree = @"
What is the primary gateway function?
ROUTING - Implement provider/model routing with load balancing
TRANSFORMATION - Implement request/response transformation pipeline
ACCESS CONTROL - Implement API key management and rate limiting

Is low latency critical?
YES - Use lightweight proxy with direct passthrough
NO - Use feature-rich gateway with full middleware pipeline
"@
                    Default = "Lightweight proxy with routing and rate limiting for most use cases"
                    DefaultReason = "Adds necessary control without excessive latency overhead"
                    Risk = "Over-engineered gateway adds latency without proportional benefit"
                }
            } elseif ($hasCost) {
                $tree1 = @{
                    Name = "$title - Cost Management Strategy"
                    Context = "Designing the cost management approach for $title."
                    Criteria = @("Performance", "Security", "Architectural")
                    Tree = @"
What is the primary cost management goal?
TRACKING - Implement usage metering and cost attribution
ENFORCEMENT - Implement budget limits with soft/hard caps
OPTIMIZATION - Implement model tiering and provider routing

Is real-time enforcement required?
YES - Pre-flight cost estimation with atomic budget checks via Redis
NO - Post-hoc aggregation with periodic reconciliation
"@
                    Default = "Usage metering with pre-flight budget checks and model tiering"
                    DefaultReason = "Prevents cost overruns while maintaining service quality"
                    Risk = "Uncontrolled AI costs lead to budget overruns and billing surprises"
                }
            } elseif ($hasLocal) {
                $tree1 = @{
                    Name = "$title - Local LLM Strategy"
                    Context = "Choosing the appropriate local LLM deployment for $title."
                    Criteria = @("Performance", "Security", "Architectural")
                    Tree = @"
Is the use case development-only or production?
DEVELOPMENT - Use Ollama for lightweight local model serving
PRODUCTION OFFLINE - Use Docker-based infrastructure with quantized models

Does the application need dev/prod parity?
YES - Implement dev-to-prod switching strategy with environment-based provider selection
NO - Use different models for dev and prod (cheaper in dev)
"@
                    Default = "Ollama for development; Docker Sail with quantized models for production"
                    DefaultReason = "Balances ease of use with production readiness"
                    Risk = "Dev/prod model mismatch causes unexpected behavior in production"
                }
            } elseif ($hasEcosystem) {
                $tree1 = @{
                    Name = "$title - Package/Integration Selection"
                    Context = "Choosing the appropriate ecosystem packages for $title."
                    Criteria = @("Maintainability", "Architectural", "Security")
                    Tree = @"
Is the package well-maintained and stable?
YES - Use for production with dependency version pinning
NO - Consider alternatives or implement in-house

Does the package integrate with existing Laravel conventions?
YES - Use native package with config files, facades, service providers
NO - Write adapter layer to conform to Laravel patterns
"@
                    Default = "Well-maintained packages with Laravel-native integrations"
                    DefaultReason = "Reduces maintenance burden and follows framework conventions"
                    Risk = "Poor package selection leads to maintenance issues and security vulnerabilities"
                }
            } elseif ($hasFailover) {
                $tree1 = @{
                    Name = "$title - Failover Strategy Selection"
                    Context = "Designing the failover and reliability strategy for $title."
                    Criteria = @("Performance", "Architectural", "Security")
                    Tree = @"
What is the required availability SLA?
HIGH (99.9%+) - Multi-provider failover with circuit breaker and health checks
MEDIUM (99%) - Retry with exponential backoff and single provider
LOW (<99%) - Simple error handling

Are provider errors well-understood?
YES - Classify every error as retryable/non-retryable with specific exception types
NO - Start with generic handling, refine as patterns emerge
"@
                    Default = "Exponential backoff with circuit breaker for multi-provider production setups"
                    DefaultReason = "Balances reliability with implementation complexity"
                    Risk = "Inadequate failover causes complete AI outage during provider downtime"
                }
            } else {
                $tree1 = @{
                    Name = "$title - Implementation Approach"
                    Context = "Selecting the appropriate implementation strategy for $title in the Laravel AI ecosystem."
                    Criteria = @("Architectural", "Maintainability")
                    Tree = @"
Is the implementation for production or prototype?
PRODUCTION - Design for long-term maintainability with abstraction layers and tests
PROTOTYPE - Use simplest working approach, refine later

Will this need to scale or evolve?
YES - Implement with extensibility patterns (interfaces, decorators, traits)
NO - Direct implementation without abstraction overhead
"@
                    Default = "Production-ready with abstraction for future flexibility"
                    DefaultReason = "Balances simplicity with extensibility"
                    Risk = "Short-term shortcuts create long-term maintenance challenges"
                }
            }
            $trees += $tree1
            
            # Tree 2: Security (context-dependent)
            if ($hasSecurity) {
                $trees += @{
                    Name = "$title - Defense-in-Depth Configuration"
                    Context = "Implementing layered security for $title."
                    Criteria = @("Security", "Maintainability")
                    Tree = @"
What data sensitivity level applies?
PUBLIC - Basic input sanitization and output encoding
INTERNAL - Input validation, output guarding, access controls
SENSITIVE/PII - Full defense-in-depth: pseudonymization, audit logging, compliance controls

Are compliance frameworks required (GDPR, HIPAA, SOC2)?
YES - Implement data residency, pseudonymization, and audit trails
NO - Standard security without compliance-specific overhead
"@
                    Default = "Input validation with output guarding for standard deployments"
                    DefaultReason = "Covers the most common threat vectors without over-engineering"
                    Risk = "Inadequate security posture leads to data breaches and compliance violations"
                }
            } else {
                $trees += @{
                    Name = "$title - Security Configuration"
                    Context = "Securing $title against common vulnerabilities."
                    Criteria = @("Security", "Maintainability")
                    Tree = @"
Does the application process untrusted input?
YES - Implement input validation, output sanitization, and proper error handling
NO - Standard security posture with credential management

Are API keys/credentials involved?
YES - Use environment variables, never commit secrets, rotate regularly
NO - Standard security hardening
"@
                    Default = "Input validation and credential management via environment variables"
                    DefaultReason = "Baseline protection for most AI applications"
                    Risk = "Insufficient security exposes credentials and allows injection attacks"
                }
            }
            
            # Tree 3: Performance
            if ($hasVector -or $hasRag) {
                $trees += @{
                    Name = "$title - Performance & Scaling"
                    Context = "Optimizing $title for production-scale workloads."
                    Criteria = @("Performance", "Architectural")
                    Tree = @"
What is the primary performance bottleneck?
INDEXING - Optimize index construction with appropriate batch sizes and parallel processing
QUERY - Tune search parameters (ef_search, top_k) and implement caching
STORAGE - Implement data lifecycle management and vector pruning

Is latency or throughput the primary concern?
LATENCY - Reduce response time with caching, index optimization, and connection pooling
THROUGHPUT - Scale horizontally with partitioning and concurrent processing
"@
                    Default = "Cache query results; optimize indexes for latency-sensitive paths"
                    DefaultReason = "Caching provides the most immediate performance improvement"
                    Risk = "Performance bottlenecks cause timeouts and poor user experience at scale"
                }
            } elseif ($hasStreaming) {
                $trees += @{
                    Name = "$title - Streaming Performance Optimization"
                    Context = "Optimizing streaming performance for $title."
                    Criteria = @("Performance", "Architectural")
                    Tree = @"
What is the primary latency concern?
TIME-TO-FIRST-TOKEN - Optimize provider connection, minimize proxy hops, use direct connections
INTER-TOKEN LATENCY - Optimize PHP output buffering, nginx buffering, transport choice

Is the stream behind a reverse proxy?
YES - Disable proxy buffering, configure keep-alive, set appropriate timeouts
NO - Standard PHP streaming with ob_implicit_flush and output buffering disabled
"@
                    Default = "Disable nginx buffering and PHP output buffering for real-time streams"
                    DefaultReason = "Prevents the two most common causes of stream latency"
                    Risk = "Improper streaming configuration causes bursty delivery and defeats streaming benefits"
                }
            } elseif ($hasCost) {
                $trees += @{
                    Name = "$title - Cost Optimization Strategy"
                    Context = "Optimizing AI costs for $title."
                    Criteria = @("Performance", "Architectural")
                    Tree = @"
Is cost or quality the priority?
COST - Use cheapest viable model, cache aggressively, implement model tiering
QUALITY - Use most capable model, optimize for accuracy, accept higher cost
BALANCED - Tiered approach: capable for critical paths, cheap for non-critical

Does usage spike unpredictably?
YES - Implement real-time budget checks with progressive model downgrade
NO - Periodic cost review with fixed monthly budget allocation
"@
                    Default = "Tiered approach with cheapest model for non-critical paths"
                    DefaultReason = "Optimizes cost where quality is less critical"
                    Risk = "Uncontrolled usage spikes cause unexpected budget overruns"
                }
            } else {
                $trees += @{
                    Name = "$title - Performance Optimization"
                    Context = "Optimizing $title for production workloads."
                    Criteria = @("Performance", "Architectural")
                    Tree = @"
Is the application user-facing (latency-sensitive)?
YES - Implement caching, connection pooling, and async processing
NO - Standard request/response with timeout configuration

Is high throughput required?
YES - Implement queue-based processing and concurrent request handling
NO - Synchronous processing with standard request lifecycle
"@
                    Default = "Cache frequently accessed data; optimize based on measured bottlenecks"
                    DefaultReason = "Data-driven optimization prevents premature complexity"
                    Risk = "Ignoring performance until production can cause cascading failures under load"
                }
            }
            
            # Tree 4: Reliability
            if ($hasFailover) {
                $trees += @{
                    Name = "$title - Reliability & Failover Configuration"
                    Context = "Ensuring $title operates reliably under provider failures."
                    Criteria = @("Performance", "Security", "Maintainability")
                    Tree = @"
How many providers are in the failover chain?
ONE - Implement retry with exponential backoff and jitter against single provider
TWO OR MORE - Implement sequential failover with circuit breaker, verify feature parity

Is the circuit breaker distributed or local?
DISTRIBUTED - Use Redis-backed shared state so all instances respect open circuit
LOCAL - In-memory state sufficient for single-instance deployments

Are health checks needed?
YES - Implement periodic probes (30-60s) to detect provider recovery
NO - Rely on request success/failure for circuit state
"@
                    Default = "Multi-provider failover chain with Redis-backed circuit breaker"
                    DefaultReason = "Maximum reliability with fast failure detection across instances"
                    Risk = "Inadequate failover causes complete AI outage during provider downtime"
                }
            } elseif ($hasStreaming) {
                $trees += @{
                    Name = "$title - Streaming Reliability"
                    Context = "Ensuring $title handles stream interruptions gracefully."
                    Criteria = @("Performance", "Maintainability")
                    Tree = @"
Are stream interruptions expected?
YES - Implement reconnection with last-event-id tracking and idempotent responses
NO - Standard stream lifecycle with error display

Is the application behind a load balancer?
YES - Configure sticky sessions or use shared state for stream continuity
NO - Direct server-to-client streaming without session affinity concerns
"@
                    Default = "SSE with reconnection support and proxy timeout configuration"
                    DefaultReason = "Handles common failure modes in production deployments"
                    Risk = "Stream interruptions cause incomplete responses and poor UX"
                }
            } else {
                $trees += @{
                    Name = "$title - Error Handling & Reliability"
                    Context = "Ensuring $title handles errors gracefully in production."
                    Criteria = @("Performance", "Maintainability")
                    Tree = @"
Are transient failures (timeouts, rate limits) expected?
YES - Implement retry with exponential backoff and jitter
NO - Simple error propagation with user-facing error messages

Is error observability important?
YES - Log errors with context (provider, status, attempt count); set up alerting
NO - Basic error logging for debugging
"@
                    Default = "Retry with exponential backoff and structured error logging"
                    DefaultReason = "Handles transient failures without over-engineering"
                    Risk = "Poor error handling causes cascading failures and degraded user experience"
                }
            }
            
            # Build markdown
            $decisionList = $trees | ForEach-Object { "- $($_.Name)" }
            
            # Limit rules to 4 max, deduplicate
            $uniqueRules = @()
            foreach ($rn in $ruleNames) {
                if ($rn -notin $uniqueRules -and $uniqueRules.Count -lt 4) { $uniqueRules += $rn }
            }
            $rulesSection = $uniqueRules | ForEach-Object { "- `"$_`"" }
            
            # Limit skills to 3 max
            $skillsSection = @()
            foreach ($sn in $skillNames) {
                if ($skillsSection.Count -lt 3) { $skillsSection += "- `"$sn`"" }
            }
            
            $treeSections = @()
            $treeIdx = 0
            foreach ($t in $trees) {
                $treeIdx++
                $criteriaList = ($t.Criteria | ForEach-Object { "* $_" }) -join "`n"
                
                # Rotate through rules
                $startRule = (($treeIdx - 1) * 1) % [Math]::Max(1, $uniqueRules.Count)
                $rr = @()
                for ($i = 0; $i -lt [Math]::Min(2, $uniqueRules.Count); $i++) {
                    $idx = ($startRule + $i) % $uniqueRules.Count
                    $rr += "- `"$($uniqueRules[$idx])`""
                }
                if ($rr.Count -eq 0) { $rr = @("- See 05-rules.md") }
                
                # Rotate through skills
                $startSkill = (($treeIdx - 1) * 1) % [Math]::Max(1, $skillNames.Count)
                $rs = @()
                for ($i = 0; $i -lt [Math]::Min(2, $skillNames.Count); $i++) {
                    $idx = ($startSkill + $i) % $skillNames.Count
                    $rs += "- `"$($skillNames[$idx])`""
                }
                if ($rs.Count -eq 0) { $rs = @("- See 06-skills.md") }
                
                $treeSections += @"

---

## $($t.Name)

---

## Decision Context

$($t.Context)

---

## Decision Criteria

$criteriaList

---

## Decision Tree

$($t.Tree)

---

## Rationale

$($t.Default). $($t.DefaultReason).

---

## Recommended Default

**Default:** $($t.Default)
**Reason:** $($t.DefaultReason)

---

## Risks Of Wrong Choice

$($t.Risk)

---

## Related Rules

$($rr -join "`n")

---

## Related Skills

$($rs -join "`n")
"@
            }
            
            $content = @"
# Metadata

**Domain:** AI & Intelligence Systems
**Subdomain:** $sdDisplay
**Knowledge Unit:** $title
**Generated:** 2026-06-03

---

# Decision Inventory

$($decisionList -join "`n")

---

# Architecture-Level Decision Trees

$($treeSections -join "`n")

---
"@
            
            Set-Content -LiteralPath (Join-Path $kuPath "07-decision-trees.md") -Value $content -Encoding UTF8
            $created++
            Write-Output "CREATED: $sd/$kuName => $title"
        } elseif ($has07) {
            $skipped++
        } else {
            $skipped++
        }
    }
}

Write-Output "`n========================================"
Write-Output "Total KUs: $total"
Write-Output "Decision trees created: $created"
Write-Output "Skipped: $skipped"
Write-Output "========================================"
