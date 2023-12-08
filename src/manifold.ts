import { Body } from "./body";
import { Circle, ShapeType } from "./shape";
import { Vec2 } from "./vec2";

type DispatchFunction = (m: Manifold, a: Body, b: Body) => void;
const DISPATCHER: Map<ShapeType, Map<ShapeType, DispatchFunction>> = new Map([
  [
    ShapeType.Circle,
    new Map([
      [ShapeType.Circle, circle2circle],
      [ShapeType.AABB, circle2AABB],
    ]),
  ],
  [
    ShapeType.AABB,
    new Map([
      [ShapeType.Circle, AABB2circle],
      [ShapeType.AABB, AABB2AABB],
    ]),
  ],
]);

export class Manifold {
  a: Body;
  b: Body;

  normal: Vec2; // 单位向量，碰撞法线，表明两个物体的碰撞方向，在我们的物理引擎中采用相对于 B 的碰撞方向
  penetration: number;
  e: number; // 计算后的恢复系数
  contacts: Array<Vec2> = []; // 碰撞发生的位置

  constructor(a: Body, b: Body) {
    this.a = a;
    this.b = b;
  }

  // 生成碰撞信息
  solve() {
    DISPATCHER[this.a.shape.getType()][this.b.shape.getType()](this, this.a, this.b);
  }

  // 计算一些冲量求解的过程中需要的数据
  initialize() {
    this.e = Math.min(this.a.restitution, this.b.restitution);
  }

  applyImpulse() {
    if (Math.abs(this.a.inverse_mass + this.b.inverse_mass) < 0.00001) {
      // 两个物体的质量都无穷大
      this.infiniteMassCorrection();
      return;
    }
    // for (const contanct of this.contacts) {
    // 相对速度在碰撞法线方向的分量
    const rv = Vec2.dot(
      Vec2.sub(this.b.velocity, this.a.velocity),
      this.normal
    );
    if (rv > 0) {
      // 物体有分离的趋势
      return;
    }
    const inv_mass_sum = this.a.inverse_mass + this.b.inverse_mass;
    // 计算冲量
    let j = -(1.0 + this.e) * rv;
    j /= inv_mass_sum;

    const impulse = Vec2.product(this.normal, j);
    this.a.applyImpulse(Vec2.minus(impulse));
    this.b.applyImpulse(impulse);
    // }
  }

  positionalCorrection() {}

  private infiniteMassCorrection() {
    this.a.velocity = new Vec2(0, 0);
    this.b.velocity = new Vec2(0, 0);
  }
}

function circle2circle(m: Manifold, a: Body, b: Body) {
  const circleA = a.shape as Circle;
  const circleB = b.shape as Circle;
  const n = Vec2.sub(b.position, a.position);
  const r = circleA.getRadius() + circleB.getRadius();
  const dist_sqr = n.lenSqr();
  if (dist_sqr >= r) {
    // 无碰撞发生
    return;
  }
  const dist = Math.sqrt(dist_sqr);
  if (dist === 0) {
    // 两个圆处于同一位置
    m.penetration = circleA.getRadius();
    m.normal = new Vec2(1, 0);
    m.contacts.push(a.position);
  } else {
    m.penetration = r - dist;
    m.normal = Vec2.div(n, dist);
    // 相对于 A 来说的碰撞点位置
    m.contacts.push(
      Vec2.add(Vec2.product(m.normal, circleA.getRadius()), a.position)
    );
  }
}
function circle2AABB(m: Manifold, a: Body, b: Body) {}
function AABB2AABB(m: Manifold, a: Body, b: Body) {}
function AABB2circle(m: Manifold, a: Body, b: Body) {}
