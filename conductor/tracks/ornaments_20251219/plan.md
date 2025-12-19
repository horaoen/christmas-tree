# Plan: 预设装饰挂件与交互展示

## Phase 1: 准备与架构设计 [checkpoint: adc7edc]
- [x] Task: 创建资源目录 `images/ornaments/` 并放入占位图片。 (0040f38)
- [x] Task: 在 `src/webgl/tree.js` 中定义 `OrnamentManager` 类雏形，负责挂件的加载与管理。 (6b0ed83)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: 准备与架构设计' (Protocol in workflow.md)

## Phase 2: 挂件生成与渲染
- [x] Task: 实现挂件配置加载逻辑，支持多张图片。 (7863588)
- [x] Task: 编写挂件 3D 物体创建函数，将图片纹理应用到 Mesh 上。 (1ea5d72)
- [x] Task: 将生成的挂件物体添加到 `ChristmasTree` 的 3D 分组中，确保其随树旋转。 (cc9f785)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: 挂件生成与渲染' (Protocol in workflow.md)

## Phase 3: 交互逻辑实现
- [ ] Task: 集成 `THREE.Raycaster` 到 `src/main.js` 的事件监听循环中。
- [ ] Task: 实现拾取反馈（如鼠标悬停时挂件高亮）。
- [ ] Task: 编写挂件放大的补间动画逻辑，实现“选中展示”效果。
- [ ] Task: 实现“点击背景返回”或“再次点击返回”的逻辑。
- [ ] Task: Conductor - User Manual Verification 'Phase 3: 交互逻辑实现' (Protocol in workflow.md)

## Phase 4: 抛光与测试
- [ ] Task: 调整挂件在树上的分布位置，确保视觉美感（避免重叠）。
- [ ] Task: 优化粉白主题下的挂件材质表现，确保符合产品准则中的“光影质感”。
- [ ] Task: 验证 80% 代码覆盖率要求（针对管理逻辑）。
- [ ] Task: Conductor - User Manual Verification 'Phase 4: 抛光与测试' (Protocol in workflow.md)
