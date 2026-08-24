# Architecture

The system starts as a modular monolith with explicit module boundaries. This keeps local development and transactions simple while allowing telemetry, identity, reporting, and AI gateway modules to be extracted later.

## Request flow

`HTTP controller -> DTO -> MediatR command/query -> FluentValidation pipeline -> handler -> repository/unit of work -> DTO response`

Mapping and validation are Application concerns. AutoMapper profiles are kept in `Application/Common/Mapping` or the relevant feature slice, while FluentValidation validators are kept with their feature command/query and executed by the shared MediatR behavior. Repository and unit-of-work interfaces are defined in Application; EF Core implementations are defined in Infrastructure.

## Layer boundaries

`Api -> Application -> Domain` is the allowed inward dependency direction. `Infrastructure -> Application/Domain` implements external concerns. The API and Worker are composition roots. ASP.NET Core Web API controllers are the transport boundary. Application has exactly two top-level folders: `Common` and `Features/<Capability>`.

## Current versus later

Current infrastructure is PostgreSQL/TimescaleDB, Redis, Hangfire hosted by the API/Infrastructure boundary, and a separately deployable FastAPI AI service. Later scale-up options include read replicas, object storage, a message broker, and dedicated analytics storage only when measured workload requires them.
