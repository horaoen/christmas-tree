# Design: Particle Tree Generation

## Context
我们需要用粒子（点）来构建一个 3D 圣诞树。直接使用静态模型不如程序化生成灵活，后者更容易实现后续的动态特效。

## Decisions
- **Decision**: 使用圆锥螺旋算法生成粒子坐标。
- **Rationale**: 螺旋线能自然地模拟树的层次感，且可以通过参数（如高度、半径、圈数）轻松调整形态。
- **Algorithm**:
  - $y$: 从 0 到 $height$ 线性分布。
  - $radius$: 随着 $y$ 增加而减小（形成圆锥）。
  - $angle$: 随着 $y$ 增加而增加（形成螺旋）。
  - $x = radius * cos(angle)$
  - $z = radius * sin(angle)$

## Open Questions
- 粒子颜色是否需要随机变化？暂时使用单一颜色或简单的渐变，后续在交互阶段增强。
