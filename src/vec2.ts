export class Vec2 {
  public x: number;
  public y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }

  static add(left: Vec2, right: number): Vec2;
  static add(left: Vec2, right: Vec2): Vec2;
  static add(left: Vec2, right: number | Vec2): Vec2 {
    if (typeof right === "number") {
      return new Vec2(left.x + right, left.y + right);
    } else {
      return new Vec2(left.x + right.x, left.y + right.y);
    }
  }

  static sub(left: Vec2, right: number): Vec2;
  static sub(left: Vec2, right: Vec2): Vec2;
  static sub(left: Vec2, right: number | Vec2): Vec2 {
    if (typeof right === "number") {
      return new Vec2(left.x - right, left.y - right);
    } else {
      return new Vec2(left.x - right.x, left.y - right.y);
    }
  }

  static product(left: Vec2, right: number): Vec2 {
    return new Vec2(left.x * right, left.y * right);
  }

  static dot(left: Vec2, right: Vec2): number {
    return left.x * right.x + left.y * right.y;
  }

  static div(left: Vec2, right: number): Vec2 {
    return new Vec2(left.x / right, left.y / right);
  }

  private static clampNumber(value: number, min: number, max: number) {
    if (value < min) {
      return min;
    } else if (value > max) {
      return max;
    }
    return value;
  }

  static clamp(value: Vec2, min: Vec2, max: Vec2) {
    return new Vec2(
      Vec2.clampNumber(value.x, min.x, max.x),
      Vec2.clampNumber(value.y, min.y, max.y)
    );
  }

  static minus(vec: Vec2) {
    return new Vec2(-vec.x, -vec.y);
  }

  equal(right: Vec2) {
    return this.x === right.x && this.y === right.y;
  }

  normalize() {
    const length = this.distance();
    this.x /= length;
    this.y /= length;
    if (isNaN(this.x) || isNaN(this.y)) {
      console.error("Alert!!!!");
    }
  }

  lenSqr(): number {
    return this.x * this.x + this.y * this.y;
  }

  distance() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }
}
