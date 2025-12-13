# Change: Implement Interaction Logic

## Why
现在我们有了粒子圣诞树和手势识别能力，需要将它们连接起来。用户应该能够通过手势控制树的旋转和缩放，增强互动体验。

## What Changes
- 创建 `src/gesture/gesture-controller.js`，负责分析手部骨骼数据并计算控制参数。
- 定义手势映射：
    - **单手移动**: 控制旋转（X轴位移 -> Y轴旋转）。
    - **双手距离**: 控制缩放（两手间距变化 -> 树的大小）。
- 修改 `src/main.js`，将 `GestureController` 的输出应用到 `ChristmasTree` 实例。
- 优化 `ChristmasTree` 类，支持外部设置旋转和缩放目标值（平滑过渡）。

## Impact
- **New Capability**: `interaction`
- **Affected Code**: `src/gesture/gesture-controller.js`, `src/webgl/tree.js`, `src/main.js`
