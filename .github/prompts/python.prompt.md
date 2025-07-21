---
name: Python Development Guidelines
description: Guidelines for Python development using modern package management with uv
mode: agent

---

# Python Development Guidelines

## Package Management

- **Always use `uv`** for all Python package management operations
  - Use `uv add` to add dependencies
  - Use `uv run` to execute scripts
  - Use `uv sync` to synchronize dependencies
  - Use `uv pip` for pip-compatible operations when needed

- **Avoid legacy package managers**:
  - Do not use `pip` directly
  - Do not use `poetry`
  - Do not use `easy_install`
  - Do not use `conda` unless specifically required for scientific packages

## Project Setup

- **Ensure `pyproject.toml` exists** in the project root directory
  - This is the modern Python project configuration standard
  - Contains project metadata, dependencies, and build configuration

- **If `pyproject.toml` is missing**:
  1. Initialize the project with: `uv init`
  2. This will create a properly configured `pyproject.toml` file
  3. Add project metadata and dependencies as needed

## Best Practices

- Keep dependencies minimal and well-documented
- Use virtual environments managed by `uv`
- Follow PEP 8 style guidelines
- Include type hints for better code clarity
- Document your code with docstrings