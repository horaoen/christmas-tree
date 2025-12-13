# Change: Implement Particle Tree

## Why
目前场景中仅显示一个测试用的立方体。我们需要实现项目的核心视觉元素——粒子圣诞树，为后续的手势交互打下基础。

## What Changes
- 移除 `src/webgl/scene.js` 中的测试立方体。
- 创建新的模块 `src/webgl/tree.js` 用于管理圣诞树逻辑。
- 实现粒子生成算法（基于圆锥螺旋线分布）。
- 使用 `THREE.Points` 和自定义材质（或基础材质）渲染粒子系统。
- 在主场景中集成粒子树。

## Impact
- **New Capability**: `tree-model`
- **Affected Code**: `src/webgl/scene.js`, `src/webgl/tree.js`
