## MODIFIED Requirements

### Requirement: Project Infrastructure
The project MUST utilize a modern build tool and follow a modular directory structure.

#### Scenario: Build Setup
- **WHEN** the developer runs the build command
- **THEN** Vite MUST bundle the application successfully without errors

#### Scenario: Directory Structure
- **WHEN** examining the source code
- **THEN** it MUST contain dedicated directories for `webgl`, `gesture`, and `ui` logic

#### Scenario: Version Control Ignores
- **WHEN** checking git status
- **THEN** dependency folders (node_modules) and build artifacts (dist) MUST NOT be tracked
