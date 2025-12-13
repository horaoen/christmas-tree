# Project Context

## Purpose
创建一个基于 Web 的 3D 粒子圣诞树展示页面，利用计算机视觉技术实现用户与虚拟场景的交互。
目标是实现一个视觉效果出众的节日主题页面，用户可以通过摄像头手势（如张开、捏合、移动）来控制圣诞树的动态效果。

## Tech Stack
- **前端核心**: HTML5, CSS3, JavaScript (ES6+)
- **3D 渲染引擎**: Three.js (用于构建粒子系统和渲染 3D 场景)
- **计算机视觉/手势识别**: MediaPipe Hands (Google) (用于实时手部追踪和手势识别)
- **构建/开发工具**: Vite (推荐，用于快速开发和构建) 或原生 ES Modules

## Project Conventions

### Code Style
- 使用现代 JavaScript (ES6+) 语法。
- 模块化代码结构，将 3D 逻辑、手势识别逻辑和 UI 控制分离。
- 变量和函数命名采用驼峰式 (camelCase)。
- 注释清晰，特别是在数学计算和 3D 变换逻辑处。

### Architecture Patterns
- **SceneManager**: 负责 Three.js 场景、相机、渲染器的初始化和循环。
- **TreeEntity**: 封装圣诞树的粒子系统生成、更新和动画逻辑。
- **GestureController**: 封装 MediaPipe 的逻辑，处理视频流，并将识别到的手势转换为控制信号（缩放因子、旋转角度、颜色状态）。
- **InteractionLoop**: 主循环，连接手势数据与 3D 场景更新。

### Testing Strategy
- 手动测试：在不同光照条件下测试手势识别的准确性。
- 性能测试：确保在粒子数量较多时维持 60 FPS (特别是在移动设备上如有计划支持)。

### Git Workflow
- Feature Branch Workflow (每个功能如“粒子系统”、“手势识别”在单独分支开发)。

## Domain Context
- **粒子系统**: 圣诞树并非静态模型，而是由大量发光粒子组成的体积/点云。
- **手势映射**:
    - **缩放**: 双手距离或手掌张开程度。
    - **旋转**: 手的水平移动或挥动。
    - **颜色/特效**: 特定手势（如握拳、特定的指尖接触）。

## Important Constraints
- 需要浏览器支持 WebGL 和摄像头权限 (getUserMedia)。
- 需优化粒子数量以平衡视觉效果和性能。

## External Dependencies
- Three.js CDN 或 npm 包
- @mediapipe/tasks-vision 和 @mediapipe/drawing_utils