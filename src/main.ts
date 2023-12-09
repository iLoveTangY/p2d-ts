import { World } from "./world";

const canvas = document.querySelector(".scene") as HTMLCanvasElement;
canvas.width = 480;
canvas.height = 800;

const world = new World(1 / 60, 10);

const renderLoop = () => {
    world.step();
    requestAnimationFrame(renderLoop);
};

renderLoop();
