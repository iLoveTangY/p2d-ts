import { Body } from "./body";
import { Manifold } from "./manifold";
import { Vec2 } from "./vec2";

export class World {
  private dt: number;
  private iterations: number;
  private bodies: Array<Body> = [];
  private contacts: Array<Manifold> = [];
  private gravityScale = 10.0;
  private gravity = new Vec2(0, 10.0 * this.gravityScale);

  constructor(dt: number, iterations: number) {
    this.dt = dt;
    this.iterations = iterations;
  }

  getBodies() {
    return this.bodies;
  }

  step() {
    this.contacts.length = 0;
    // 碰撞检测
    for (let i = 0; i < this.bodies.length; ++i) {
      const a = this.bodies[i];
      for (let j = i + 1; j < this.bodies.length; ++j) {
        const b = this.bodies[j];
        if (a.inverse_mass === 0 && b.inverse_mass === 0) {
          // 两个物体的质量都是无穷大，都不会挪动了
          continue;
        }
        const m = new Manifold(a, b);
        m.solve();
        if (m.contacts.length > 0) {
          this.contacts.push(m);
        }
      }
    }

    for (let i = 0; i < this.bodies.length; ++i) {
      this.integrateForces(this.bodies[i], this.dt);
    }

    for (let i = 0; i < this.contacts.length; ++i) {
      this.contacts[i].initialize();
    }

    for (let j = 0; j < this.iterations; ++j) {
      for (let i = 0; i < this.contacts.length; ++i) {
        this.contacts[i].applyImpulse();
      }
    }

    for (const body of this.bodies) {
      this.integrateVelocity(body, this.dt);
    }

    // 校正位置
    for (const contact of this.contacts) {
      contact.positionalCorrection();
    }

    // 清除所有受力
    for (const body of this.bodies) {
      body.force = new Vec2(0, 0);
    }
  }

  add(body: Body) {
    this.bodies.push(body);
  }

  getContacts() {
    return this.contacts;
  }

  private integrateForces(body: Body, dt: number) {
    if (body.inverse_mass === 0) {
      return;
    }

    body.velocity = Vec2.add(
      body.velocity,
      Vec2.product(
        Vec2.add(Vec2.product(body.force, body.inverse_mass), this.gravity),
        dt / 2
      )
    );
  }

  private integrateVelocity(body: Body, dt: number) {
    if (body.inverse_mass === 0) {
      return;
    }
    body.position = Vec2.add(body.position, Vec2.product(body.velocity, dt));
    // TODO: Why ??
    this.integrateForces(body, dt);
  }
}
