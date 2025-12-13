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

