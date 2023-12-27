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
    // const kSlop = 0.05; // Penetration allowance
    // const percent = 0.4; // Penetration percentage to correct
    // const correction = Vec2.product(this.normal, (Math.max(this.penetration - kSlop, 0) / (this.a.inverse_mass + this.b.inverse_mass)) * percent);
    // this.a.position = Vec2.add(this.a.position, Vec2.product(correction, this.a.inverse_mass));
    // this.b.position = Vec2.add(this.b.position, Vec2.product(correction, this.b.inverse_mass));
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
  if (dist_sqr >= r * r) {
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
  m.normal = Vec2.minus(m.normal);
}
function AABB2AABB(m: Manifold, a: Body, b: Body) {
  const firstAABB = a.shape as AABB;
  const secondAABB = b.shape as AABB;

  const n = Vec2.sub(b.position, a.position);
  let aExtent = (firstAABB.max.x - firstAABB.min.x) / 2;
  let bExtent = (secondAABB.max.x - secondAABB.min.x) / 2;
  const xOverlap = aExtent + bExtent - Math.abs(n.x);
  if (xOverlap > 0) {
    aExtent = (firstAABB.max.y - firstAABB.min.y) / 2;
    bExtent = (secondAABB.max.y - secondAABB.min.y) / 2;
    const yOverlap = aExtent + bExtent - Math.abs(n.y);
    if (yOverlap > 0) {
      // 重叠小的方向是碰撞发生的方向
      if (xOverlap < yOverlap) {
        if (n.x < 0) {
          m.normal = new Vec2(-1, 0);
        } else {
          m.normal = new Vec2(1, 0);
        }
        m.penetration = xOverlap;
      } else {
        if (n.y < 0) {
          m.normal = new Vec2(0, -1);
        } else {
          m.normal = new Vec2(0, 1);
        }
        m.penetration = yOverlap;
      }
      m.contacts.push(new Vec2(0, 0));
    }
  }
}
function AABB2circle(m: Manifold, a: Body, b: Body) {
  // https://www.zhihu.com/question/24251545
  // FIXME: 当小球的速度过快，在一次计算的时间内冲入到 AABB 的内部时会出现normal出错的bug
  const aabb = a.shape as AABB;
  const circle = b.shape as Circle;
  let difference = Vec2.sub(b.position, a.position);
  const halfExtend = Vec2.div(Vec2.sub(aabb.max, aabb.min), 2);

  const clamped = Vec2.clamp(difference, Vec2.minus(halfExtend), halfExtend);
  const closet = Vec2.add(a.position, clamped);
  difference = Vec2.sub(closet, b.position);
  if (difference.lenSqr() < circle.getRadius() * circle.getRadius()) {
    m.contacts.push(closet);
    if (Vec2.equal(b.position, closet)) {
      console.error("Equal sub");
    }
    m.normal = Vec2.sub(b.position, closet);
    m.normal.normalize();
    m.penetration = 0;
  }

  // let inside = false;
  // if (closet.equal(n)) {
  //   // 圆心位于 AABB 内部
  //   inside = true;
  //   if (Math.abs(n.x) > Math.abs(n.y)) {
  //     if (closet.x > 0) {
  //       closet.x = halfExtend.x;
  //     } else {
  //       closet.x = -halfExtend.x;
  //     }
  //   } else {
  //     if (closet.y > 0) {
  //       closet.y = halfExtend.y;
  //     } else {
  //       closet.y = -halfExtend.y;
  //     }
  //   }
  // }
  // const normal = Vec2.sub(n, closet);
  // let d = normal.lenSqr();
  // const r = circle.getRadius();
  // if (d > r * r && !inside) {
  //   return;
  // }
  // m.contacts.push(closet);
  // d = Math.sqrt(d);
  // if (inside) {
  //   m.normal = Vec2.minus(n);
  //   m.penetration = r - d;
  // } else {
  //   m.normal = n;
  //   m.penetration = r - d;
  // }
}
