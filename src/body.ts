import { Shape } from "./shape";
import { Vec2 } from "./vec2";

export class Body {
  shape: Shape;
  position: Vec2;
  velocity: Vec2 = new Vec2(0, 0);
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

  makeStatic() {
    this.mass = 0;
    this.inverse_mass = 0;
  }
}
