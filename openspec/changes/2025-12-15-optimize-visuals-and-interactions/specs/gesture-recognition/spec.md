# gesture-recognition Specification Delta

## ADDED Requirements

### Requirement: Static Pose Detection
The system MUST recognize specific static hand configurations (poses) in addition to movement.

#### Scenario: Fist Detection
- **WHEN** all fingertips are detected to be in close proximity to the palm center or folded below the knuckles
- **THEN** the system MUST recognize this as a "Fist" pose.

#### Scenario: Victory Sign Detection
- **WHEN** the Index and Middle fingers are extended
- **AND** the Ring and Pinky fingers are folded/curled
- **THEN** the system MUST recognize this as a "Victory" pose.

### Requirement: Gesture Debouncing
The system MUST prevent accidental rapid-fire triggering of gesture-based actions.

#### Scenario: Cooldown Period
- **WHEN** a pose triggers an action
- **THEN** the system MUST ignore the same pose for a short duration (e.g., 500ms)
- **SO THAT** the action does not toggle repeatedly during a single gesture attempt.
