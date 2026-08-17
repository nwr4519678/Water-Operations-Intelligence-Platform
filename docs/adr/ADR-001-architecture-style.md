# ADR-001: Modular monolith first

## Decision

Use a modular monolith for the .NET platform and a separately deployable Python AI service.

## Rationale

The product needs strong transactional consistency and a small-team developer experience. Explicit Application and Infrastructure boundaries preserve an extraction path without paying the operational cost of microservices prematurely.
