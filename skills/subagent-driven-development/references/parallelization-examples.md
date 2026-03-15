# Parallelization Examples (Optional)

Use when a task feels splittable but the boundaries are fuzzy.

## Split by Layer

- Lock controller/service/repo boundaries first.
- Give each agent one layer.
- Keep one agent on integration tests.

## Split by Surface

- UI components
- State/data layer
- API/client layer
- Tests per surface

Works only if props, API shapes, and ownership are explicit.

## Split by Failure Cluster

- One agent per bug/root cause.
- One agent for regression tests if shared files stay minimal.
- One integrator to merge and rerun checks.

## Do Not Split

- Same file set.
- Same public interface still in flux.
- High-churn refactors where each task will collide.
