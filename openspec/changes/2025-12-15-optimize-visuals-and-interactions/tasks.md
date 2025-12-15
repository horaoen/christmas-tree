# Tasks: 视觉优化与交互实现

1.  **准备资源**:
    -   创建或获取一个简单的粒子纹理图片 (如圆形光晕 `sparkle.png`)。
2.  **更新渲染系统 (Rendering)**:
    -   修改 `TreeEntity` 以使用 `ShaderMaterial`。
    -   编写顶点着色器 (Vertex Shader) 实现大小脉动动画。
    -   编写片元着色器 (Fragment Shader) 应用纹理。
    -   实现 `SnowSystem` 类并集成到 `SceneManager` 中。
3.  **增强手势识别 (Gesture)**:
    -   在 `GestureController` 中实现 `detectPose(landmarks)` 方法。
    -   添加“握拳”检测逻辑。
    -   添加“V字手”检测逻辑。
    -   添加事件防抖机制。
4.  **关联交互逻辑 (Interaction)**:
    -   在主循环或事件监听中处理 'fist' 事件 -> 调用 `TreeEntity.nextTheme()`。
    -   在主循环或事件监听中处理 'victory' 事件 -> 调用 `SnowSystem.toggle()`。
5.  **验证与测试**:
    -   验证树的粒子是否闪烁。
    -   验证雪花是否正常飘落。
    -   测试手势触发的准确性和响应速度。
