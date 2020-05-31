"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//メインのゲーム画面
var MainGame = /** @class */ (function (_super) {
    __extends(MainGame, _super);
    function MainGame(scene) {
        var _this = this;
        var tl = require("@akashic-extension/akashic-timeline");
        var b2 = require("@akashic-extension/akashic-box2d");
        var timeline = new tl.Timeline(scene);
        _this = _super.call(this, { scene: scene, x: 0, y: 0, width: 640, height: 360, touchable: true }) || this;
        var bg = new g.FilledRect({
            scene: scene,
            width: 640,
            height: 360,
            cssColor: "black",
            opacity: 0.5
        });
        _this.append(bg);
        var box2d = new b2.Box2D({
            gravity: [0, 9.8],
            scale: 50,
            sleep: false //trueにした方がいいらしい
        });
        //床の作成
        var b2bodys = [];
        var floors = [];
        var createFloor = function (x, y, w, h, angle, tag) {
            var floorEntity;
            if (tag != 0) {
                floorEntity = new g.Sprite({
                    scene: scene,
                    src: scene.assets.floor,
                    x: x,
                    y: y,
                    width: w,
                    height: h,
                    angle: angle
                });
            }
            else {
                floorEntity = new g.FilledRect({
                    scene: scene,
                    cssColor: "white",
                    x: x,
                    y: y,
                    width: w,
                    height: h,
                    angle: angle
                });
            }
            _this.append(floorEntity);
            floors.push(floorEntity);
            var floorFixDef = box2d.createFixtureDef({
                density: 1.0,
                friction: 0.5,
                restitution: 0.3,
                shape: box2d.createRectShape(floorEntity.width, floorEntity.height) // 形状
            });
            var floorDef = box2d.createBodyDef({
                type: b2.BodyType.Static
            });
            var floorBody = box2d.createBody(floorEntity, floorDef, floorFixDef);
            b2bodys.push({ body: floorBody.b2body, pos: tag });
        };
        createFloor(60, 40, 250, 15, 0, 1);
        createFloor(280, 120, 250, 15, 0, -1);
        createFloor(60, 200, 250, 15, 0, 1);
        createFloor(280, 280, 250, 15, 0, -1);
        var items = [];
        var itemPoints = [];
        for (var j = 0; j < 4; j++) {
            for (var i = 0; i < (j + 2); i++) {
                var x = j === 0 ? 100 : 20;
                var item = new g.Sprite({
                    scene: scene,
                    src: scene.assets.item,
                    x: floors[j].x + (i * (floors[j].width / (j + 2))) + x,
                    y: floors[j].y - 24,
                    width: 24,
                    height: 24,
                    tag: j
                });
                _this.append(item);
                items.push(item);
                itemPoints.push({ x: item.x + (item.width / 2), y: item.y + (item.height / 2) });
            }
        }
        //下部アイテム
        for (var i = 0; i < 3; i++) {
            var item = new g.Sprite({
                scene: scene,
                src: scene.assets.item,
                x: 95 + (i * 65),
                y: 360 - 32,
                width: 32,
                height: 32,
                srcX: 32 * (i + 1),
                tag: -(3 - i)
            });
            _this.append(item);
            items.push(item);
        }
        //しきい
        for (var i = 0; i < 4; i++) {
            createFloor(75 + (i * 65), 320, 5, 80, 2, 0);
        }
        //ボールの作成
        var ball = new g.Sprite({
            scene: scene,
            src: scene.assets.coin,
            x: 110,
        });
        _this.append(ball);
        var ballFixDef = box2d.createFixtureDef({
            density: 1.0,
            friction: 0.5,
            restitution: 0.0,
            shape: box2d.createCircleShape(38)
        });
        var ballDef = box2d.createBodyDef({
            type: b2.BodyType.Dynamic
        });
        var ballBody = box2d.createBody(ball, ballDef, ballFixDef);
        var b2body = ballBody.b2body;
        ball.touchable = true;
        _this.pointMove.add(function (o) {
            b2bodys.forEach(function (b) {
                if (b.pos === 0)
                    return;
                var body = b.body;
                var angle = o.startDelta.y * b.pos;
                if (angle < -45)
                    angle = -45;
                if (angle > 45)
                    angle = 45;
                body.SetAngle(box2d.radian(angle));
            });
        });
        //エフェクト作成
        var effects = [];
        var effectsNum = 0;
        for (var i = 0; i < 5; i++) {
            var effect = new g.FrameSprite({
                scene: scene,
                src: scene.assets["effect"],
                width: 120,
                height: 120,
                frames: [0, 1, 2],
                interval: 100
            });
            effect.hide();
            effect.start();
            effects.push(effect);
            _this.append(effect);
        }
        var start = function () {
            b2body.SetLinearVelocity(box2d.vec2(0, 0));
            b2body.SetAngularVelocity(0);
            b2body.SetPosition(box2d.vec2(100 + scene.random.get(0, 80), -20));
            items.forEach(function (e) {
                e.show();
            });
        };
        scene.update.add(function () {
            if (!scene.isStart)
                return;
            // 物理エンジンの世界を進める
            box2d.step(1 / g.game.fps);
            if (ball.y > 360) {
                start();
            }
            function rotatePoints(point, angle, center) {
                var cos = Math.cos(angle);
                var sin = Math.sin(angle);
                var x = point.x - center.x;
                var y = point.y - center.y;
                var xx = x * cos - y * sin + center.x;
                var yy = x * sin + y * cos + center.y;
                return { x: xx, y: yy };
            }
            var _loop_1 = function (i) {
                var e = items[i];
                if (e.tag > -1) {
                    var entity = floors[e.tag];
                    var centerX = entity.x + (entity.width / 2);
                    var centerY = entity.y + (entity.height / 2);
                    var pos = rotatePoints(itemPoints[i], box2d.radian(entity.angle), { x: centerX, y: centerY });
                    e.x = pos.x - (e.width / 2);
                    e.y = pos.y - (e.height / 2);
                    e.modified();
                }
                if (!(e.state & 1)) {
                    if (g.Collision.intersectAreas(ball, e)) {
                        if (e.tag > -1) {
                            scene.addScore(400);
                            scene.playSound("coin02");
                        }
                        else {
                            scene.addScore(-e.tag * 1000);
                            scene.playSound("coin03");
                        }
                        var effect_1 = effects[effectsNum];
                        effect_1.x = e.x - 50;
                        effect_1.y = e.y - 50;
                        effect_1.show();
                        effect_1.modified();
                        effectsNum = (effectsNum + 1) % effects.length;
                        scene.setTimeout(function () {
                            effect_1.hide();
                        }, 300);
                        e.hide();
                    }
                }
            };
            for (var i = 0; i < items.length; i++) {
                _loop_1(i);
            }
        });
        _this.finish = function () {
        };
        //リセット
        _this.reset = function () {
            start();
        };
        return _this;
    }
    return MainGame;
}(g.E));
exports.MainGame = MainGame;
