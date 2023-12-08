export enum ShapeType {
  Circle,
  AABB,
}

export class Shape {
    private shapeType: ShapeType;
    getType() {
        return this.shapeType;
    }
}

export class Circle extends Shape {
    private radius: number;

    constructor(radius: number) {
        super();
        this.radius = radius;
    }

    getRadius() {
        return this.radius;
    }
}
