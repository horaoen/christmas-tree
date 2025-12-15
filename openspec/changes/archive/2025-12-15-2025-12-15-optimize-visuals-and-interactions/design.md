# Design: 视觉与交互逻辑设计

## 渲染策略 (Rendering Strategy)

### 树体粒子 (基于 Shader)
为了在无需每一帧都在 CPU 遍历数千个粒子的情况下实现高性能的“闪烁”效果：
- **材质**: 从 `THREE.PointsMaterial` 切换为 `THREE.ShaderMaterial`。
- **属性 (Attributes)**:
    - `position` (标准位置)
    - `color` (标准颜色)
    - `size` (基础大小)
    - `phase` (随机浮点数 0-2PI，用于产生异步的闪烁相位)
- **Uniforms**:
    - `uTime`: 用于动画的全局时间变量。
    - `uTexture`: 粒子纹理贴图 (光晕/火花)。
- **顶点着色器 (Vertex Shader)**: 基于 `sin(uTime + phase)` 计算最终的点大小 (Point Size)。
- **片元着色器 (Fragment Shader)**: 应用纹理并结合顶点颜色。

### 雪花系统 (Snow System)
- **结构**: 一个独立的 `THREE.Points` 对象。
- **逻辑**: 简单的基于 CPU 的更新循环（或者如果粒子数巨大则使用 GPU，但对于简单的飘落重置逻辑，CPU 处理少量雪花足够）。
    - 更新循环: `y -= speed`。如果 `y < bottom`，重置为 `y = top` 并随机化 X/Z。

## 手势识别逻辑 (Gesture Recognition Logic)

### 手势定义
我们将扩展 `GestureController` 以分析手部关键点 (Landmarks) 来识别离散的姿势 (Pose)，而不仅仅是连续的移动。

1.  **握拳 (Fist)**:
    - 条件: 所有 4 个手指尖 (食指、中指、无名指、小指) 都紧贴手掌 (MCP 关节) 或者 指尖到手腕的距离显著短于伸展状态。
    - 鲁棒性检查: `tip.y > pip.y` (相对于手部方向) 或简单地判断手指是否“折叠”。
2.  **V字手/剪刀手 (Victory)**:
    - 条件: 食指和中指伸展。无名指和小指折叠。
    - 触发: 切换下雪特效状态 (需要防抖)。

### 状态管理
- **防抖 (Debouncing)**: 为了防止状态在短时间内快速反复切换，我们需要在识别到触发后设置一个冷却时间 (例如 500ms 或 "保持手势" 的确认时间)。

## 架构更新
- **`TreeEntity`**: 需要增加 `setColorTheme(themeName)` 和 `update(time)` 方法。
- **`SceneManager`**: 负责管理 `SnowSystem` 实例的生命周期。
- **`GestureController`**: 发出事件 `onGestureDetected('fist')`, `onGestureDetected('victory')`。