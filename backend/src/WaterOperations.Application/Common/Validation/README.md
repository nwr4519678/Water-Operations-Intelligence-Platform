# Validation

FluentValidation is registered at the Application boundary. Shared validation pipeline behavior belongs in `Common/Behaviors`; request validators belong in `Features/<Feature>/Validators` beside the command or query they validate.
