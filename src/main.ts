import { Body } from "./body";
import { AABB, Circle } from "./shape";
import { Vec2 } from "./vec2";
import { World } from "./world";

const canvas = document.querySelector(".scene") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
canvas.width = 480;
canvas.height = 800;

const world = new World(1 / 60, 20);

addBorder();

const renderLoop = () => {
    ctx.fillStyle = "rgb(45, 64, 108)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    world.step();
    for (const body of world.getBodies()) {
        body.render(ctx);
    }
    requestAnimationFrame(renderLoop);
};

renderLoop();

canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
        // 左键被按下，在按下的位置生成一个Ball
        const rect = canvas.getBoundingClientRect();
        const ballPosition = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
        world.add(new Body(new Circle(30), ballPosition, 1.0));
    } else if (e.button === 2) {
        // 右键被按下，在按下的位置生成一个AABB
        const rect = canvas.getBoundingClientRect();
        const pos = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
        const aabb = new AABB(new Vec2(0, 0), new Vec2(60, 60));
        world.add(new Body(aabb, pos, 1.0));
    }
});

function addBorder() {
    const bottomHeight = 20;
    const otherHeight = 10;
    const topBorderAABB = new AABB(new Vec2(0, 0), new Vec2(canvas.width, otherHeight));
    const topBorderground = new Body(topBorderAABB, topBorderAABB.getCenter(), 0.5);
    topBorderground.makeStatic();
    world.add(topBorderground);
    const bottomBorderAABB = new AABB(new Vec2(0, canvas.height - bottomHeight), new Vec2(canvas.width, canvas.height));
    const bottomBorderGround = new Body(bottomBorderAABB, bottomBorderAABB.getCenter(), 0.5);
    bottomBorderGround.makeStatic();
    world.add(bottomBorderGround);
    const leftBorderAABB = new AABB(new Vec2(0, otherHeight), new Vec2(otherHeight, canvas.height - bottomHeight));
    const leftBorderAABBGround = new Body(leftBorderAABB, leftBorderAABB.getCenter(), 0.5);
    leftBorderAABBGround.makeStatic();
    world.add(leftBorderAABBGround);
    const rightBorderAABB = new AABB(new Vec2(canvas.width - otherHeight, otherHeight), new Vec2(canvas.width, canvas.height - bottomHeight));
    const rightBorderGround = new Body(rightBorderAABB, rightBorderAABB.getCenter(), 0.5);
    rightBorderGround.makeStatic();
    world.add(rightBorderGround);
}
