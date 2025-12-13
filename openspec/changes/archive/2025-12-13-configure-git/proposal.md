# Change: Configure Git

## Why
项目初始化时缺少 `.gitignore` 文件，导致 `node_modules` 等不必要的文件被 Git 追踪。我们需要完善 Git 配置以保持仓库整洁。

## What Changes
- 创建 `.gitignore` 文件。
- 配置忽略 `node_modules/`, `dist/`, `.DS_Store` 等常见临时文件。

## Impact
- **Affected Specs**: `infrastructure`
- **Affected Code**: `.gitignore`
