# Change: Init Project Structure

## Why
我们需要建立项目的基础设施，以便开始开发 3D 粒子圣诞树。这包括配置构建工具、建立代码组织结构以及验证渲染环境。

## What Changes
- 初始化 Vite 项目。
- 安装 Three.js 依赖。
- 建立标准的源码目录结构 (`src/webgl`, `src/gesture`, `src/ui`)。
- 创建一个基础的 WebGL 场景以验证环境配置正确。

## Impact
- **Affected Specs**: `infrastructure`, `rendering`
- **Affected Code**: `package.json`, `vite.config.js`, `src/`
