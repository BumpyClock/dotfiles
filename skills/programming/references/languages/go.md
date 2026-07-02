# Go

**Load when:** repo contains Go code. Match the toolchain version in `go.mod`; check it before using newer language features.

## Idioms

- Favor standard library and simple composition over heavy frameworks.
- Design with context cancellation and explicit error handling; wrap errors with context.
- Handle errors explicitly; reserve panic for unrecoverable programmer errors, not application logic.
- Manage goroutine lifecycles: graceful shutdown, no leaks; channels for coordination (fan-in/out, pipelines, worker pools), mutexes for shared state.
- Profile before optimizing (pprof, trace, benchmarks); add caching/pooling only when measurements justify.
- Structured logging with slog; lint with golangci-lint or staticcheck.
- Table-driven tests; benchmarks when performance is a requirement.

## Design rules

- Document exported interfaces, types, and functions when their behavior is not obvious.
- Prefer small interfaces and composition over inheritance-shaped abstractions; define interfaces at the consumer.
- Avoid reflection on internals unless a framework, encoding boundary, or interoperability layer requires it.
- Prefer explicit zero-value, ok-value, or error contracts over ambiguous `nil`-based APIs; avoid passing `nil` dependencies unless the API is designed for it.
- Prefer pure package-level helpers over stateful utility types.
- `database/sql` with pooling and timeouts; transactions around multi-step writes.

## Security

- Validate inputs at trust boundaries; TLS defaults from crypto/tls, not hand-rolled config.
- Secrets from environment or secret manager, never source.
- Keep dependencies scanned (`govulncheck`).
