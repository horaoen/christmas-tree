# Design: Gesture Interaction

## Context
我们需要从原始的 21 个骨骼点中提取有意义的意图。

## Decisions
- **Decision**: 使用“归一化”的坐标系统。
- **Rationale**: MediaPipe 输出的坐标已经是归一化的 (0-1)，直接使用即可。
- **Mapping**:
  - **Rotation**: 取所有可见手掌重心的平均 X 坐标。X < 0.5 向左转，X > 0.5 向右转。或者使用相对位移（上一帧与当前帧的差）。这里采用**相对位移**，因为更自然，类似触摸屏拖动。
  - **Scale**: 如果检测到两只手，计算两手重心（或食指根部）的欧几里得距离。距离越大，缩放越大。

## Smoothness
直接应用每一帧的计算结果会导致抖动。我们需要使用 `THREE.MathUtils.lerp` 来平滑过渡。
`currentValue = lerp(currentValue, targetValue, 0.1)`
