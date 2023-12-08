import { Shape } from "./shape";
import { Vec2 } from "./vec2";

export class Body {
  shape: Shape;
  position: Vec2;
  velocity: Vec2;
  restitution: number;
  force: Vec2;

  mass: number; // 质量
  inverse_mass: number; // 质量的倒数

  constructor(shape: Shape, position: Vec2) {
    this.shape = shape;
    this.position = position;
  }

  applyForce(f: Vec2) {
    this.force = Vec2.add(this.force, f);
  }

  applyImpulse(impulse: Vec2) {
    this.velocity = Vec2.add(
      this.velocity,
      Vec2.product(impulse, this.inverse_mass)
    );
  }
}
