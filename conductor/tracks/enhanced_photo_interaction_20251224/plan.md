# Implementation Plan - 增强型相框交互与手势控制

## Phase 1: 手势识别引擎升级 (Gesture Engine Upgrade)
目标：实现 L 形手势检测及垂直位移识别，并分发导航事件。

- [ ] Task: 定义并实现 L 形手势检测逻辑
    - [ ] 子任务: 在 `GestureController.detectPose` 中添加 `l_shape` 识别算法（食指向上，拇指水平）。
    - [ ] 子任务: 编写 `l_shape` 检测的单元测试。
- [ ] Task: 实现基于 L 形手势的垂直位移跟踪
    - [ ] 子任务: 当检测到稳定的 `l_shape` 时，记录 Y 轴起始位置并计算动态位移 delta。
    - [ ] 子任务: 实现位移阈值判断逻辑，触发 `photo_next`（向下划）或 `photo_prev`（向上划）事件。
    - [ ] 子任务: 编写位移触发逻辑的单元测试。
- [ ] Task: Conductor - User Manual Verification 'Phase 1: 手势识别引擎升级' (Protocol in workflow.md)

## Phase 2: 相框导航与自动对齐逻辑 (Ornament Navigation & Alignment)
目标：计算相框在树表面的分布角度，并实现平滑旋转对齐功能。

- [ ] Task: 增强 OrnamentManager 以支持索引导航
    - [ ] 子任务: 在 `OrnamentManager` 中获取所有照片挂件，并按生成顺序或角度进行排序。
    - [ ] 子任务: 为每个相框计算使其正对相机所需的 `targetRotationY`。
- [ ] Task: 实现平滑对齐旋转功能
    - [ ] 子任务: 在 `ChristmasTree` 中实现 `navigateToPhoto(index)` 方法。
    - [ ] 子任务: 优化旋转逻辑，确保在循环切换（如从最后一张到第一张）时选择最短旋转路径。
    - [ ] 子任务: 编写旋转对齐与路径计算的单元测试。
- [ ] Task: Conductor - User Manual Verification 'Phase 2: 相框导航与自动对齐逻辑' (Protocol in workflow.md)

## Phase 3: 系统集成与视觉反馈 (Integration & Feedback)
目标：打通手势与导航逻辑，并根据产品准则添加沉浸式反馈。

- [ ] Task: 集成手势事件与导航逻辑
    - [ ] 子任务: 在应用主循环中监听 `photo_next/prev` 手势事件并驱动 `ChristmasTree` 切换。
- [ ] Task: 添加导航视觉反馈（遵循无文字原则）
    - [ ] 子任务: 当 L 形手势激活时，通过手势追踪点变色或当前相框微弱发光给予用户反馈。
    - [ ] 子任务: 调整旋转插值（Lerp）系数，使导航旋转过程兼顾灵敏度与观赏性。
- [ ] Task: 整体集成测试与质量校验
    - [ ] 子任务: 验证手势在不同摄像头环境下的鲁棒性。
    - [ ] 子任务: 运行测试套件并确保新代码覆盖率 >80%。
- [ ] Task: Conductor - User Manual Verification 'Phase 3: 系统集成与视觉反馈' (Protocol in workflow.md)
