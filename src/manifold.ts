import { Body } from "./body";
import { AABB, Circle, ShapeType } from "./shape";
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

  normal: Vec2 = new Vec2(0, 1); // 单位向量，碰撞法线，表明两个物体的碰撞方向，在我们的物理引擎中采用相对于 B 的碰撞方向
  penetration: number = 0;
  e: number = 0; // 计算后的恢复系数
  contacts: Array<Vec2> = []; // 碰撞发生的位置

  constructor(a: Body, b: Body) {
    this.a = a;
    this.b = b;
  }

  // 生成碰撞信息
  solve() {
    const func = DISPATCHER.get(this.a.shape.shapeType)?.get(
      this.b.shape.shapeType
    );
    if (func) {
      func(this, this.a, this.b);
    } else {
      throw Error("Invalid shape type");
    }
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

  positionalCorrection() {
    const kSlop = 0.05; // Penetration allowance
    const percent = 0.4; // Penetration percentage to correct
    const correction = Vec2.product(this.normal, (Math.max( this.penetration - kSlop, 0 ) / (this.a.inverse_mass + this.b.inverse_mass)) * percent);
    this.a.position = Vec2.add(this.a.position, Vec2.product(correction, this.a.inverse_mass));
    this.b.position = Vec2.add(this.b.position, Vec2.product(correction, this.b.inverse_mass));
  }

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
function circle2AABB(m: Manifold, a: Body, b: Body) {
  AABB2circle(m, b, a);
}
function AABB2AABB(m: Manifold, a: Body, b: Body) {}
function AABB2circle(m: Manifold, a: Body, b: Body) {
  // 搞清楚具体计算过程: https://code.tutsplus.com/how-to-create-a-custom-2d-physics-engine-the-basics-and-impulse-resolution--gamedev-6331t
  const aabb = a.shape as AABB;
  const circle = b.shape as Circle;
  const n = Vec2.sub(b.position, a.position);
  let closet = n.clone();
  const halfExtend = Vec2.div(Vec2.sub(aabb.max, aabb.min), 2);
  closet = Vec2.clamp(closet, Vec2.minus(halfExtend), halfExtend);

  let inside = false;
  if (closet.equal(n)) {
    // 圆心位于 AABB 内部
    inside = true;
    if (Math.abs(n.x) > Math.abs(n.y)) {
      if (closet.x > 0) {
        closet.x = halfExtend.x;
      } else {
        closet.x = -halfExtend.x;
      }
    } else {
      if (closet.y > 0) {
        closet.y = halfExtend.y;
      } else {
        closet.y = -halfExtend.y;
      }
    }
  }
  const normal = Vec2.sub(n, closet);
  let d = normal.lenSqr();
  const r = circle.getRadius();
  if (d > r * r && !inside) {
    return;
  }
  m.contacts.push(closet);
  d = Math.sqrt(d);
  if (inside) {
    m.normal = Vec2.minus(n);
    m.penetration = r - d;
  } else {
    m.normal = n;
    m.penetration = r - d;
  }
}
