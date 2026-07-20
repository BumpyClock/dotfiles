# Go

**Load when:** repo contains Go code. Match the toolchain version in `go.mod`; check it before using newer language features.

## Idioms

- Manage goroutine lifecycles: graceful shutdown, no leaks; channels for coordination (fan-in/out, pipelines, worker pools), mutexes for shared state.
- Profile before optimizing (pprof, trace, benchmarks); add caching/pooling only when measurements justify.
- Structured logging with slog; lint with golangci-lint or staticcheck.
- Table-driven tests; benchmarks when performance is a requirement.
- `database/sql` with pooling and timeouts; transactions around multi-step writes.

## Security

- Validate inputs at trust boundaries; TLS defaults from crypto/tls, not hand-rolled config.
- Secrets from environment or secret manager, never source.
- Keep dependencies scanned (`govulncheck`).
