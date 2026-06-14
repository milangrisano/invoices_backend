# NestJS CLI Commands Reference

Use the NestJS CLI (`@nestjs/cli`) to maintain standard file patterns and generate code. If the CLI is installed globally or locally, prefer using it over manual file creation to ensure consistency and automatic registration in parent modules.

## Standard Code Generation

Always run NestJS CLI commands from the project root. The NestJS CLI automatically handles:
1. Creating the folder and files (`.ts` and `.spec.ts` for tests).
2. Registering the created component in the closest parent module.

| Command | Shorthand | Description |
|---|---|---|
| `nest generate module <name>` | `nest g mo <name>` | Creates a new module |
| `nest generate controller <name>` | `nest g co <name>` | Creates a controller |
| `nest generate service <name>` | `nest g s <name>` | Creates a provider service |
| `nest generate guard <name>` | `nest g gu <name>` | Creates an authentication/authorization guard |
| `nest generate interceptor <name>` | `nest g itc <name>` | Creates an interceptor (response/request mapping) |
| `nest generate pipe <name>` | `nest g pi <name>` | Creates a custom validation/transformation pipe |
| `nest generate filter <name>` | `nest g f <name>` | Creates an exception filter |
| `nest generate resource <name>` | `nest g resource <name>` | Generates a complete CRUD resource (Module, Controller, Service, DTO, Entity) |

### Best Practices for Generation

- **Flat structure flag (`--no-spec`)**: If tests are not desired for a highly trivial file, append `--no-spec`. However, for high-quality production code, always generate tests (default).
- **Subdirectories**: To place a component in a specific subdirectory, specify the path:
  `nest g co auth/guards/jwt` (creates the controller under `src/auth/guards/jwt`).
