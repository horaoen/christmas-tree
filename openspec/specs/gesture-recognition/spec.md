# gesture-recognition Specification

## Purpose
TBD - created by archiving change integrate-mediapipe. Update Purpose after archive.
## Requirements
### Requirement: Hand Tracking
The system MUST capture video from the user's webcam and track hand movements in real-time.

#### Scenario: Webcam Access
- **WHEN** the application starts
- **THEN** it MUST request permission to use the camera
- **AND** if granted, start streaming video

#### Scenario: Landmark Detection
- **WHEN** a hand is visible in the camera feed
- **THEN** the system MUST identify 21 3D landmarks per hand
- **AND** display a visual representation (skeleton) on the screen for feedback

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

