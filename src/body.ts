import { AABB, Circle, Shape, ShapeType } from "./shape";
import { Vec2 } from "./vec2";

export class Body {
  shape: Shape;
  position: Vec2;
  velocity: Vec2 = new Vec2(0, 0);
  static_fraction: number = 0.1;  // 静摩擦系数
  dynamic_fraction: number = 0.05; // 动摩擦系数
  restitution: number = 1;
  force: Vec2 = new Vec2(0, 0);

  mass: number; // 质量
  inverse_mass: number; // 质量的倒数

  constructor(shape: Shape, position: Vec2, restitution: number) {
    this.shape = shape;
    this.position = position;
    this.restitution = restitution;
    this.mass = shape.computeMass();
    this.inverse_mass = this.mass !== 0 ? 1 / this.mass : 0;
    console.log(`inverse mass = ${this.inverse_mass}`);
  }

  applyForce(f: Vec2) {
    this.force = Vec2.add(this.force, f);
  }

  applyImpulse(impulse: Vec2) {
    console.log(`this.iverse_mass = ${this.inverse_mass}`);
    console.log(`product = ${impulse.x * this.inverse_mass}`);
    this.velocity = Vec2.add(
      this.velocity,
      Vec2.product(impulse, this.inverse_mass)
    );
  }

  makeStatic() {
    this.mass = 0;
    this.inverse_mass = 0;
  }

  private renderCircle(ctx: CanvasRenderingContext2D, circle: Circle) {
    ctx.beginPath();
    ctx.fillStyle = "rgb(235, 235, 235)";
    ctx.arc(this.position.x, this.position.y, circle.getRadius(), 0, Math.PI * 2);
    ctx.fill();
  }

  private renderAABB(ctx: CanvasRenderingContext2D, rect: AABB) {
    ctx.beginPath();
    ctx.fillStyle = "rgb(72, 77, 116)";
    
    const halfExtend = Vec2.div(Vec2.sub(rect.max, rect.min), 2);
    const leftTop = Vec2.sub(this.position, halfExtend);
    ctx.fillRect(leftTop.x, leftTop.y, halfExtend.x * 2, halfExtend.y * 2);
  }

  render(ctx: CanvasRenderingContext2D) {
    switch (this.shape.shapeType) {
      case ShapeType.Circle:
        this.renderCircle(ctx, this.shape as Circle);
        break;
      case ShapeType.AABB:
        this.renderAABB(ctx, this.shape as AABB);
        break;
    }
  }
}
