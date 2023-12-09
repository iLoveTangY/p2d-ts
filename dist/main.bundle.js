/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/manifold.ts":
/*!*************************!*\
  !*** ./src/manifold.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Manifold: () => (/* binding */ Manifold)
/* harmony export */ });
/* harmony import */ var _shape__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./shape */ "./src/shape.ts");
/* harmony import */ var _vec2__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vec2 */ "./src/vec2.ts");


const DISPATCHER = new Map([
    [
        _shape__WEBPACK_IMPORTED_MODULE_0__.ShapeType.Circle,
        new Map([
            [_shape__WEBPACK_IMPORTED_MODULE_0__.ShapeType.Circle, circle2circle],
            [_shape__WEBPACK_IMPORTED_MODULE_0__.ShapeType.AABB, circle2AABB],
        ]),
    ],
    [
        _shape__WEBPACK_IMPORTED_MODULE_0__.ShapeType.AABB,
        new Map([
            [_shape__WEBPACK_IMPORTED_MODULE_0__.ShapeType.Circle, AABB2circle],
            [_shape__WEBPACK_IMPORTED_MODULE_0__.ShapeType.AABB, AABB2AABB],
        ]),
    ],
]);
class Manifold {
    constructor(a, b) {
        this.normal = new _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2(0, 1); // 单位向量，碰撞法线，表明两个物体的碰撞方向，在我们的物理引擎中采用相对于 B 的碰撞方向
        this.penetration = 0;
        this.e = 0; // 计算后的恢复系数
        this.contacts = []; // 碰撞发生的位置
        this.a = a;
        this.b = b;
    }
    // 生成碰撞信息
    solve() {
        var _a;
        const func = (_a = DISPATCHER.get(this.a.shape.shapeType)) === null || _a === void 0 ? void 0 : _a.get(this.b.shape.shapeType);
        if (func) {
            func(this, this.a, this.b);
        }
        else {
            throw Error("Invalid shape type");
        }
    }
    // 计算一些冲量求解的过程中需要的数据
    initialize() {
        this.e = Math.min(this.a.restitution, this.b.restitution);
    }
    applyImpulse() {
        if (Math.abs(this.a.inverse_mass + this.b.inverse_mass) < 0.00001) {
            // 两个物体的质量都无穷大
            this.infiniteMassCorrection();
            return;
        }
        // for (const contanct of this.contacts) {
        // 相对速度在碰撞法线方向的分量
        const rv = _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.dot(_vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.sub(this.b.velocity, this.a.velocity), this.normal);
        if (rv > 0) {
            // 物体有分离的趋势
            return;
        }
        const inv_mass_sum = this.a.inverse_mass + this.b.inverse_mass;
        // 计算冲量
        let j = -(1.0 + this.e) * rv;
        j /= inv_mass_sum;
        const impulse = _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.product(this.normal, j);
        this.a.applyImpulse(_vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.minus(impulse));
        this.b.applyImpulse(impulse);
        // }
    }
    positionalCorrection() {
        const kSlop = 0.05; // Penetration allowance
        const percent = 0.4; // Penetration percentage to correct
        const correction = _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.product(this.normal, (Math.max(this.penetration - kSlop, 0) / (this.a.inverse_mass + this.b.inverse_mass)) * percent);
        this.a.position = _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.add(this.a.position, _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.product(correction, this.a.inverse_mass));
        this.b.position = _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.add(this.b.position, _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.product(correction, this.b.inverse_mass));
    }
    infiniteMassCorrection() {
        this.a.velocity = new _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2(0, 0);
        this.b.velocity = new _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2(0, 0);
    }
}
function circle2circle(m, a, b) {
    const circleA = a.shape;
    const circleB = b.shape;
    const n = _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.sub(b.position, a.position);
    const r = circleA.getRadius() + circleB.getRadius();
    const dist_sqr = n.lenSqr();
    if (dist_sqr >= r) {
        // 无碰撞发生
        return;
    }
    const dist = Math.sqrt(dist_sqr);
    if (dist === 0) {
        // 两个圆处于同一位置
        m.penetration = circleA.getRadius();
        m.normal = new _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2(1, 0);
        m.contacts.push(a.position);
    }
    else {
        m.penetration = r - dist;
        m.normal = _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.div(n, dist);
        // 相对于 A 来说的碰撞点位置
        m.contacts.push(_vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.add(_vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.product(m.normal, circleA.getRadius()), a.position));
    }
}
function circle2AABB(m, a, b) { }
function AABB2AABB(m, a, b) { }
function AABB2circle(m, a, b) { }


/***/ }),

/***/ "./src/shape.ts":
/*!**********************!*\
  !*** ./src/shape.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Circle: () => (/* binding */ Circle),
/* harmony export */   ShapeType: () => (/* binding */ ShapeType)
/* harmony export */ });
var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["Circle"] = 0] = "Circle";
    ShapeType[ShapeType["AABB"] = 1] = "AABB";
})(ShapeType || (ShapeType = {}));
class Circle {
    constructor(radius) {
        this.shapeType = ShapeType.Circle;
        this.density = 1.0;
        this.radius = radius;
    }
    computeMass() {
        return Math.PI * Math.pow(this.radius, 2) * this.density;
    }
    getRadius() {
        return this.radius;
    }
}


/***/ }),

/***/ "./src/vec2.ts":
/*!*********************!*\
  !*** ./src/vec2.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Vec2: () => (/* binding */ Vec2)
/* harmony export */ });
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static add(left, right) {
        if (typeof right === "number") {
            return new Vec2(left.x + right, left.y + right);
        }
        else {
            return new Vec2(left.x + right.x, left.y + right.y);
        }
    }
    static sub(left, right) {
        if (typeof right === "number") {
            return new Vec2(left.x - right, left.y - right);
        }
        else {
            return new Vec2(left.x - right.x, left.y - right.y);
        }
    }
    static product(left, right) {
        return new Vec2(left.x * right, left.y * right);
    }
    static dot(left, right) {
        return left.x * right.x + left.y * right.y;
    }
    static div(left, right) {
        return new Vec2(left.x / right, left.y / right);
    }
    static clampNumber(value, min, max) {
        if (value < min) {
            return min;
        }
        else if (value > max) {
            return max;
        }
        return value;
    }
    static clamp(value, min, max) {
        return new Vec2(Vec2.clampNumber(value.x, min.x, max.x), Vec2.clampNumber(value.y, min.y, max.y));
    }
    static minus(vec) {
        return new Vec2(-vec.x, -vec.y);
    }
    normalize() {
        const length = this.distance();
        this.x /= length;
        this.y /= length;
    }
    lenSqr() {
        return this.x * this.x + this.y + this.y;
    }
    distance() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
}


/***/ }),

/***/ "./src/world.ts":
/*!**********************!*\
  !*** ./src/world.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   World: () => (/* binding */ World)
/* harmony export */ });
/* harmony import */ var _manifold__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./manifold */ "./src/manifold.ts");
/* harmony import */ var _vec2__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vec2 */ "./src/vec2.ts");


class World {
    constructor(dt, iterations) {
        this.bodies = [];
        this.contacts = [];
        this.gravity = new _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2(0, 10.0);
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
                const m = new _manifold__WEBPACK_IMPORTED_MODULE_0__.Manifold(a, b);
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
            body.force = new _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2(0, 0);
        }
    }
    add(body) {
        this.bodies.push(body);
    }
    integrateForces(body, dt) {
        if (body.inverse_mass === 0) {
            return;
        }
        body.velocity = _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.add(body.velocity, _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.product(_vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.add(_vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.product(body.force, body.inverse_mass), this.gravity), dt / 2));
    }
    integrateVelocity(body, dt) {
        if (body.inverse_mass === 0) {
            return;
        }
        body.position = _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.add(body.position, _vec2__WEBPACK_IMPORTED_MODULE_1__.Vec2.product(body.velocity, dt));
        // TODO: Why ??
        this.integrateForces(body, dt);
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _world__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./world */ "./src/world.ts");

const canvas = document.querySelector(".scene");
canvas.width = 480;
canvas.height = 800;
const world = new _world__WEBPACK_IMPORTED_MODULE_0__.World(1 / 60, 10);
const renderLoop = () => {
    world.step();
    requestAnimationFrame(renderLoop);
};
renderLoop();

})();

/******/ })()
;
//# sourceMappingURL=main.bundle.js.map