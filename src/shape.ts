import { Vec2 } from "./vec2";

export enum ShapeType {
  Circle,
  AABB,
}

export interface Shape {
    readonly shapeType: ShapeType;
    readonly density: number;
    computeMass: () => number;
}

export class Circle implements Shape {
    private radius: number;
    shapeType: ShapeType = ShapeType.Circle;
    density = 1.0;

    constructor(radius: number) {
        this.radius = radius;
    }

    computeMass() {
        return Math.PI * Math.pow(this.radius, 2) * this.density;
    }

    getRadius() {
        return this.radius;
    }
}

export class AABB implements Shape {
    max: Vec2;
    min: Vec2;

    shapeType: ShapeType = ShapeType.AABB;
    density: number = 1.0;

    constructor(min: Vec2, max: Vec2) {
        this.max = max.clone();
        this.min = min.clone();
    }

    computeMass() {
        const sub = Vec2.sub(this.max, this.min);
        return sub.x * sub.y * this.density;
    }
}
