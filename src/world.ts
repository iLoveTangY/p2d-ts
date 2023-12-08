import { Body } from "./body";
import { Manifold } from "./manifold";
import { Vec2 } from "./vec2";

const gravity = new Vec2(0, 10.0);

export class World {
  private dt: number;
  private iterations: number;
  private bodies: Array<Body> = [];
  private contacts: Array<Manifold> = [];

  constructor(dt: number, iterations: number) {
    this.dt = dt;
    this.iterations = iterations;
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
        this.integrageForces(this.bodies[i], this.dt);
    }

    for (let i = 0; i < this.contacts.length; ++i) {
        this.contacts[i].initialize();
    }

    for (let j = 0; j < this.iterations; ++j) {
        for (let i = 0; i < this.contacts.length; ++i) {
            this.contacts[i].applyImpulse();
        }
    }
  }

  add(body: Body) {
    this.bodies.push(body);
  }

  private integrageForces(body: Body, dt: number) {
    if (body.inverse_mass === 0) {
      return;
    }

    body.velocity = Vec2.add(
      body.velocity,
      Vec2.product(
        Vec2.add(Vec2.product(body.force, body.inverse_mass), gravity),
        dt / 2
      )
    );
  }
}