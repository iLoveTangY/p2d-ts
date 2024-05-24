# 碰撞检测

## Axis Aligned Bounding Boxes（轴对称包围盒）

简称AABB，四条边和坐标系平行，意味着box不能旋转，可以用如下的方式定义

```rust
struct AABB {
    Vec2 min;
    Vec2 max;
}
```

快速的判断两个AABB是否碰撞代码：

```rust
fn AABBvsAABB(a: &AABB, b: &AABB) -> Bool {
    if a.max.x < b.min.x || a.min.x > b.max.x {
        false
    }
    if (a.max < b.min.y || a.min.y > b.max.y) {
        false
    }

    true
}
```

# 碰撞求解——基于冲量（Impulse）

冲量在物理中是一个过程量，表示在一段时间内物体的动量变化。
$$V'=V+\Delta V$$

## 碰撞求解

假设我们已经检测到碰撞，并且已经获得了下面两个重要的信息：

* 碰撞法线（normal）
* 碰撞的侵入量（penetration）

公式一：
$$V^{AB} = V^B - V^A$$

公式二：
$$V^{AB} \cdot n = (V^B - V^A) \cdot n$$

公式三：
$$V_1 = \begin{bmatrix}x_1 \\y_1\end{bmatrix}, V_2 = \begin{bmatrix}x_2 \\y_2\end{bmatrix} \\ V_1 \cdot V_2 = x_1 * x_2 + y_2 * y_2$$

引入恢复系数$e = min(A.e, B.e)$

公式四：
$$V' = e * V$$

公式五：
$$V^{AB} \cdot n = -e * (V^B - V^A) \cdot n$$

公式六：
$$V' = V + j * n$$

公式七：
$$ Impulse = mass * Velocity \\ Velocity = \frac{Impulse}{mass} \therefore V' = V + \frac{j * n}{mass}$$

公式八：
$$V'^A = V^A + \frac{j * n}{mass^A} \\ V'^B = V^B - \frac{j * n}{mass^B}$$

公式九：
$$(V^A - V^V + \frac{j * n}{mass^A} + \frac{j * n}{mass^B}) * n = -e * (V^B - V^A) \cdot n \\ \therefore \\ (V^A - V^V + \frac{j * n}{mass^A} + \frac{j * n}{mass^B}) * n + e * (V^B - V^A) \cdot n = 0$$

公式十：
$$(V^B - V^A) \cdot n + j * (\frac{j * n}{mass^A} + \frac{j * n}{mass^B}) * n + e * (V^B - V^A) \cdot n = 0 \\ \therefore \\ (1 + e)((V^B - V^A) \cdot n) + j * (\frac{j * n}{mass^A} + \frac{j * n}{mass^B}) * n = 0 \\ \therefore \\ j = \frac{-(1 + e)((V^B - V^A) \cdot n)}{\frac{1}{mass^A} + \frac{1}{mass^B}}$$

$j$已经解出来了，那么可以实现碰撞的冲量求解了：

```rust
fn resolveCollision(a: &mut Object, b: &mut Object) {
    let rv: Vec2 = b.velocity - a.velocity;

    let vel_along_normal = rv * normal;

    if vel_along_normal > 0 {
        return;
    }

    let e: float = min(a.restitution, b.restitution);

    let mut j: float = -(1 + e) * vel_along_normal;
    j /= 1 / a.mass + 1 / b.mass;

    let impulse: Vec2 = j * normal;
    a.velocity -= 1 / a.mass * impulse;
    b.velocity += 1 / b.mass * impulse;
}
```

# 模块设计

## Bodise

存储物体所代表的形状、质量数据、变换（位置、旋转）、速度、扭矩等。

```rust
struct Body {
    shape: &Shape,
    tx: Transform,
    material: Material,
    mass_data: MassData,
    velocity: Vec2,
    force: Vec2,
    gravity_scale: f32,
}
```

`gravity_scale`用来缩放物体的重力。

```rust
struct MassData {
    mass: f32,
    inv_mass: f32,

    // 旋转使用
    inertia: f32,
    inverse_inertia: f32,
}
```

质量很不直观，手动设置需要花大量的时间来调试，因此我们会使用如下的公式来定义质量：
$$Mass=density*volume$$

当我们想要调整质量时，我们应该调整密度（density）。乘上体积（volume）之后我们就得到了质量。

## Materials

```rust
struct Material {
    density: f32,
    restitution: f32,
}
```

一旦设置了`material`之后，应该将`material`传递给`shape`来计算`mass`。

一些常见对象的材质信息：

```txt
Rock       Density : 0.6  Restitution : 0.1
Wood       Density : 0.3  Restitution : 0.2
Metal      Density : 1.2  Restitution : 0.05
BouncyBall Density : 0.3  Restitution : 0.8
SuperBall  Density : 0.3  Restitution : 0.95
Pillow     Density : 0.1  Restitution : 0.2
Static     Density : 0.0  Restitution : 0.4
```

## Forces

每次物理系统更新时，`force`的值都是从零开始。物理系统中body收到的影响将会表现为力（force），会被加到force上，然后在integration阶段会用来计算物体的加速度，在integration之后force会置零。

# Broad Phase

前面提到的碰撞检测的过程通常被称为"narrow phase"，其实在 narrow phase之前还有一个阶段通常被称为"broad phase"，broad phase 的主要目的时判断哪些物体可能会发生碰撞，而 narrow phase的目的是判断这些物体到底有没有发生碰撞。

```rust
struct Pair {
    a: &Body,
    b: &Body,
}
```
Broad Phase通常会将可能会发生碰撞的对象两两醉成一个Pair发送给物理引擎的下一个阶段，也就是Narrow phase。

最简单的的碰撞检测算法就是两两检测 Body 的 AABB 是否发生碰撞。注意不要忘记剔除重复项。

更加快速的算法，空间四叉树。

# 分层（Layering）

分层的意义在于可以通过配置层级信息不同层的对象永远不会发生碰撞。
分层最好使用bitmasks来实现。分层应该在broad phase完成。

# Halfspace intersection

halfspace 可以认为是2维空间中一条线的一侧。在物理引擎中检测一个点是否位于一条线的一侧或另一侧是一项非常常见的任务。有一个非常简单的方式来完成这个任务。
直线的一般式方程如下：
$$ax+by+c=0$$
那么直线的法线（normal）就是$\begin{bmatrix}a \\b\end{bmatrix}$
判断一点$(x, y)$是否位于直线的某一侧，只需要将点带入到直线方程中，然后检查结果的符号即可。如果结果是0表示点位于直线上，正号和负号表示分别位于直线的两侧。

# 附录
对外暴露的接口：
```typescript
class World {
    constructor(gravity: number);
    add(body: Body);
    getContacts(): Array<Manifold>;   
}

enum ShapeType {
    Circle,
    AABB,
}

interface Shape {
    readonly shapeType: ShapeType;
    readonly density: number;
    computeMass: () => number;
}
```

暴露的封装接口可以参考如下代码
```javascript
var canvas;
var ctx;
var canvasWidth;
var canvasHeight;

var world;
var box, wallLeft, wallRight, ground;

// 我们将创建世界封装至createWorld函数内
function createWorld() {
    // 世界的大小
    var worldAABB = new b2AABB();
    worldAABB.minVertex.Set(-4000, -4000);
    worldAABB.maxVertex.Set(4000, 4000);

    //定义重力
    var gravity = new b2Vec2(0, 300);

    // 是否休眠
    var doSleep = false;

    // 最终创建世界
    var world = new b2World(worldAABB, gravity, doSleep);

    return world;
}

//绘画功能
function drawWorld(world, context) {
    for (var j = world.m_jointList; j; j = j.m_next) {
        // 绘制关节
        // drawJoint(j, context);
    }
    for (var b = world.m_bodyList; b != null; b = b.m_next) {
        for (var s = b.GetShapeList(); s != null; s = s.GetNext()) {
            if (s.GetUserData() != undefined) {
                // 使用数据包括图片
                var img = s.GetUserData();

                // 图片的长和宽
                var x = s.GetPosition().x;
                var y = s.GetPosition().y;
                var topleftX = -img.clientWidth / 2;
                var topleftY = -img.clientHeight / 2;

                context.save();
                context.translate(x, y);
                context.rotate(s.GetBody().GetRotation());
                context.drawImage(img, topleftX, topleftY);
                context.restore();
            }
            drawShape(s, context);
        }
    }
}

// 创建圆形刚体
function createBall(world, x, y, r, custom) {
    // 创建圆形定义
    var ballSd = new b2CircleDef();
    ballSd.density = 1.0; // 设置密度
    if (custom === 'fixed') ballSd.density = 0.0; // 若传入'fixed'，则需固定，此时设置密度为0
    else ballSd.userData = custom; // 若传入其他，则视为图片数据
    ballSd.radius = 20; // 设置半径
    ballSd.restitution = 1.0; // 设置弹性
    ballSd.friction = 0; // 设置摩擦因子
    var ballBd = new b2BodyDef(); // 创建刚体定义
    ballBd.AddShape(ballSd); // 添加形状
    ballBd.position.Set(x || 0, y || 0); // 设置位置
    return world.CreateBody(ballBd); // 创建并返回刚体
}

// 创建矩形刚体
function createBox(world, x, y, width, height, custom) {
    var boxSd = new b2BoxDef(); // 创建一个形状Shape，然后设置有关Shape的属性
    boxSd.extents.Set(width || 1200, height || 5); // 设置矩形高、宽
    boxSd.density = 1.0; // 设置矩形的密度 
    if (custom === 'fixed') boxSd.density = 0.0; // 若传入'fixed'，则需固定，此时设置密度为0
    else boxSd.userData = custom; // 若传入其他，则视为图片数据
    boxSd.restitution = .3; // 设置矩形的弹性
    boxSd.friction = 1; // 设置矩形的摩擦因子，可以设置为0-1之间任意一个数，0表示光滑，1表示强摩擦

    var boxBd = new b2BodyDef(); // 创建刚体定义
    boxBd.AddShape(boxSd); // 添加形状
    boxBd.position.Set(x || 10, y || 10); // 设置位置
    return world.CreateBody(boxBd) // 创建并返回刚体
}

// 定义step函数，用于游戏的迭代运行
function step() {
    // 模拟世界
    world.Step(1.0 / 60, 1);
    checkContact();
    // 清除画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    // 重新绘制
    drawWorld(world, ctx);

    // 再次刷新
    setTimeout(step, 10);
}

// 从draw_world.js里面引用的绘画功能
function drawShape(shape, context) {
    context.strokeStyle = '#003300';
    context.beginPath();
    switch (shape.m_type) {
        // 绘制圆
        case b2Shape.e_circleShape:
            var circle = shape;
            var pos = circle.m_position;
            var r = circle.m_radius;
            var segments = 16.0;
            var theta = 0.0;
            var dtheta = 2.0 * Math.PI / segments;
            // 画圆圈
            context.moveTo(pos.x + r, pos.y);
            for (var i = 0; i < segments; i++) {
                var d = new b2Vec2(r * Math.cos(theta), r * Math.sin(theta));
                var v = b2Math.AddVV(pos, d);
                context.lineTo(v.x, v.y);
                theta += dtheta;
            }
            context.lineTo(pos.x + r, pos.y);

            // 画半径
            context.moveTo(pos.x, pos.y);
            var ax = circle.m_R.col1;
            var pos2 = new b2Vec2(pos.x + r * ax.x, pos.y + r * ax.y);
            context.lineTo(pos2.x, pos2.y);
            break;
        // 绘制多边形
        case b2Shape.e_polyShape:
            var poly = shape;
            var tV = b2Math.AddVV(poly.m_position, b2Math.b2MulMV(poly.m_R, poly.m_vertices[0]));
            context.moveTo(tV.x, tV.y);
            for (var i = 0; i < poly.m_vertexCount; i++) {
                var v = b2Math.AddVV(poly.m_position, b2Math.b2MulMV(poly.m_R, poly.m_vertices[i]));
                context.lineTo(v.x, v.y);
            }
            context.lineTo(tV.x, tV.y);
            break;
    }
    context.stroke();
}

// 检查是否有碰撞
function checkContact(){
    for (var cn = world.GetContactList(); cn != null; cn = cn.GetNext()) {
    var body1 = cn.GetShape1().GetBody();
    var body2 = cn.GetShape2().GetBody();

        // 若与箱子碰撞，则销毁该刚体

        if(body1 === box && body2.IsStatic() == false ){
            world.DestroyBody(body2);
        }

        if(body2 === box && body1.IsStatic() == false ){
            world.DestroyBody(body1);
        }
    }
}

function GetBodyAtPosition(x, y) {
    // 首先创建一个近似于点的小区域
    var mousePVec = new b2Vec2(x, y);
    // 利用b2Vec2定义一个矢量，用来保存鼠标点击的点
    var aabb = new b2AABB();
    // 利用b2AABB创建一个环境
    aabb.minVertex.Set(mousePVec.x - 0.001, mousePVec.y - 0.001);
    aabb.maxVertex.Set(mousePVec.x + 0.001, mousePVec.y + 0.001);
    // 设置aabb的左上角及右下角坐标，这里是以鼠标点击位置为中心创建了一个长、宽均为0.002的矩形区域

    // 然后查询与指定区域有重叠的刚体
    var k_maxCount = 10;     // 设定所要查找形状的数量，注意合理设置其大小，过大会影响运行速度
    var shapes = new Array();  // 保存查找到的与已知边界盒相交的形状
    var count = world.Query(aabb, shapes, k_maxCount);    // 在世界中查找与边界盒相交的maxCount个形状，并返回边界盒区域内实际包含的形状的个数

    var findBody = null;  // 首先设定没有找到物体
    for (var i = 0; i < count; ++i) {
        if (shapes[i].GetBody().IsStatic() == false)
        // 条件假定查找到的形状不是静态刚体，比如墙
        {
            var tShape = shapes[i];    // 将查找到的形状赋给tShape变量
            var inside = tShape.GetBody();   // 将tShape对应的刚体赋给inside
            if (inside)        // 如果inside这个刚体存在
            {
                // 那么返回这个刚体，并跳出遍历
                findBody = tShape.GetBody();
                break;
            }
        }
    }
    return findBody;
}

// 获取鼠标坐标
function getMousePos(event) {
    var e = event || window.event;
    var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
    var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
    var x = e.pageX || e.clientX + scrollX;
    var y = e.pageY || e.clientY + scrollY;
    return { 'x': x, 'y': y };
}

// 处理鼠标移动
function handleMousedown(e) {
    var e = e || window.event;
    // 获取鼠标x坐标
    var newMouse = getMousePos(e);
    var selectBody = GetBodyAtPosition(newMouse.x - canvas.offsetLeft, newMouse.y - canvas.offsetTop); // 选择刚体
    if (selectBody) {
        // 若有选中刚体，则处理
        var LinearVelocity = new b2Vec2(500, -200); // 定义一个向量
        selectBody.WakeUp(); // 激活休眠状态
        selectBody.SetLinearVelocity(LinearVelocity);      //给定一个速度向量
    } else {
        // 若无，则随机生成一个矩形添加
        var width = parseInt(Math.random() * 50);
        var height = parseInt(Math.random() * 50);
        createBox(world, newMouse.x, newMouse.y, width, height);
    }
}

document.addEventListener('mousedown', handleMousedown, false);

window.onload = function () {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvasWidth = parseInt(canvas.width);
    canvasHeight = parseInt(canvas.height);
    // 启动游戏
    world = createWorld();
    createBall(world, 100, 20, 20);
    createBall(world, 300, 60, 10);
    createBox(world, 100, 200, 25, 30, 'fixed');
    createBox(world, 200, 50, 20, 20);
    box = createBox(world, 400, 80, 20, 20, document.getElementById('box'));
    wallLeft = createBox(world, 0, 0, 10, 600, 'fixed');
    wallRight = createBox(world, 1290, 0, 10, 400, 'fixed');
    ground = createBox(world, 30, 595, 1200, 5, 'fixed');
    step();
};
```
