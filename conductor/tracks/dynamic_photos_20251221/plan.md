# Implementation Plan - 动态人像相册与智能布局

本计划旨在实现圣诞树上的动态人像相册系统，包括 3:4 比例相框的重构和基于算法的自动分布。

## Phase 1: 基础重构与 3:4 相框实现 [checkpoint: b4096a8]
- [x] Task: 重构 `OrnamentManager` 以支持动态比例的相框几何体（从 1:1 改为 3:4） [32cfeb7]
- [x] Task: 编写测试验证相框比例和材质加载的正确性 [61b079d]
- [x] Task: 更新 `OrnamentManager.loadOrnaments` 方法，支持更灵活的配置结构 [b41877e]
- [x] Task: Conductor - User Manual Verification 'Phase 1: 基础重构与 3:4 相框实现' (Protocol in workflow.md)

## Phase 2: 智能分布算法开发
- [ ] Task: 实现树表面坐标转换函数（基于高度 and 角度计算 3D 空间坐标）
- [ ] Task: 开发基于随机排斥（Random Poisson-like）的分布算法，自动计算照片挂载点并避免重叠
- [ ] Task: 实现相框自动朝向算法（使相框法线指向树干外部）
- [ ] Task: 编写单元测试验证分布点的有效性（确保在树体表面范围内且不穿模）
- [ ] Task: Conductor - User Manual Verification 'Phase 2: 智能分布算法开发' (Protocol in workflow.md)

## Phase 3: 内容扩展与集成
- [ ] Task: 更新配置文件并准备多张人像占位图（3:4 比例）
- [ ] Task: 将分布算法集成到 `ChristmasTree` 的初始化流程中，实现照片的自动挂载
- [ ] Task: 优化相册挂件的材质性能，确保多张照片下的流畅度
- [ ] Task: Conductor - User Manual Verification 'Phase 3: 内容扩展与集成' (Protocol in workflow.md)

## Phase 4: 视觉打磨与最终验收
- [ ] Task: 调整相框材质细节（边缘高光、木纹适配）以增强 3D 质感
- [ ] Task: 修复极端分布下的穿模或光照过曝问题
- [ ] Task: 执行最终性能测试和交互验证（确保手势控制依然流畅）
- [ ] Task: Conductor - User Manual Verification 'Phase 4: 视觉打磨与最终验收' (Protocol in workflow.md)
