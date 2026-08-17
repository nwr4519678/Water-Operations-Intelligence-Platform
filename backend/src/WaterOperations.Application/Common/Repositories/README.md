# Repository contracts

Repository and unit-of-work interfaces belong in `Common/Abstractions`. Their EF Core implementations belong in Infrastructure/Persistence. Application code never references EF Core directly.
