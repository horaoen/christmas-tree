# interaction Specification

## Purpose
TBD - created by archiving change implement-interaction-logic. Update Purpose after archive.
## Requirements
### Requirement: Gesture Control
The system MUST allow users to manipulate the 3D tree using hand gestures.

#### Scenario: Rotation Control
- **WHEN** the user moves their hand horizontally
- **THEN** the tree MUST rotate around its vertical axis in the direction of the hand movement

#### Scenario: Scale Control
- **WHEN** the user shows two hands
- **AND** moves them closer or further apart
- **THEN** the tree MUST scale down or up respectively

### Requirement: Theme Switching
The system MUST allow users to cycle through predefined visual themes for the tree.

#### Scenario: Cycle Theme via Gesture
- **WHEN** a "Fist" gesture is detected and validated
- **THEN** the tree's color palette MUST switch to the next available theme (e.g., from Green/Red to Blue/White).

### Requirement: Effect Toggling
The system MUST allow users to enable or disable environmental effects.

#### Scenario: Toggle Snow via Gesture
- **WHEN** a "Victory" (Peace sign) gesture is detected and validated
- **THEN** the snowfall effect MUST toggle its visibility state (On <-> Off).

