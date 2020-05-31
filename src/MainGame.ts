import { MainScene } from "./MainScene";
import { SceneComment } from "@atsumaru/api-types";
declare function require(x: string): any;

//メインのゲーム画面
export class MainGame extends g.E {
	public reset: () => void;
	public finish: () => void;
	public setMode: (num: number) => void;

	constructor(scene: MainScene) {
		const tl = require("@akashic-extension/akashic-timeline");
		var b2 = require("@akashic-extension/akashic-box2d");
		const timeline = new tl.Timeline(scene);
		super({ scene: scene, x: 0, y: 0, width: 640, height: 360, touchable: true });

		const bg = new g.FilledRect({
			scene: scene,
			width: 640,
			height: 360,
			cssColor: "black",
			opacity: 0.5
		});
		this.append(bg);

		var box2d = new b2.Box2D({
			gravity: [0, 9.8],
			scale: 50,
			sleep: false//trueにした方がいいらしい
		});

		//床の作成
		const b2bodys: { body: any, pos: number }[] = [];
		const floors: g.E[] = [];
		const createFloor = (x: number, y: number, w: number, h: number, angle: number, tag: number) => {
			var floorEntity: g.E
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
			} else {
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
			this.append(floorEntity);
			floors.push(floorEntity);

			var floorFixDef = box2d.createFixtureDef({
				density: 1.0, // 密度
				friction: 0.5, // 摩擦係数
				restitution: 0.3, // 反発係数
				shape: box2d.createRectShape(floorEntity.width, floorEntity.height) // 形状
			});

			var floorDef = box2d.createBodyDef({
				type: b2.BodyType.Static
			});

			var floorBody = box2d.createBody(floorEntity, floorDef, floorFixDef);
			b2bodys.push({ body: floorBody.b2body, pos: tag });

		}

		createFloor(60, 40, 250, 15, 0, 1);

		createFloor(280, 120, 250, 15, 0, -1);

		createFloor(60, 200, 250, 15, 0, 1);

		createFloor(280, 280, 250, 15, 0, -1);

		const items: g.Sprite[] = [];
		const itemPoints: { x: number, y: number }[] = [];

		for (let j = 0; j < 4; j++) {
			for (let i = 0; i < (j + 2); i++) {
				const x = j === 0 ? 100 : 20;
				var item = new g.Sprite({
					scene: scene,
					src: scene.assets.item,
					x: floors[j].x + (i * (floors[j].width / (j + 2))) + x,
					y: floors[j].y - 24,
					width: 24,
					height: 24,
					tag: j
				});
				this.append(item);
				items.push(item);
				itemPoints.push({ x: item.x + (item.width / 2), y: item.y + (item.height / 2) });
			}
		}

		//下部アイテム
		for (let i = 0; i < 3; i++) {
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
			this.append(item);
			items.push(item);
		}

		//しきい
		for (let i = 0; i < 4; i++) {
			createFloor(75 + (i * 65), 320, 5, 80, 2, 0);
		}

		//ボールの作成
		var ball = new g.Sprite({
			scene: scene,
			src: scene.assets.coin,
			x: 110,
		});
		this.append(ball);

		var ballFixDef = box2d.createFixtureDef({
			density: 1.0, // 密度
			friction: 0.5, // 摩擦係数
			restitution: 0.0, // 反発係数
			shape: box2d.createCircleShape(38)
		});

		var ballDef = box2d.createBodyDef({
			type: b2.BodyType.Dynamic
		});

		var ballBody = box2d.createBody(ball, ballDef, ballFixDef);

		var b2body = ballBody.b2body;
		ball.touchable = true;
		this.pointMove.add(function (o) {
			b2bodys.forEach((b) => {
				if (b.pos === 0) return;
				const body = b.body;
				let angle = o.startDelta.y * b.pos
				if (angle < -45) angle = -45;
				if (angle > 45) angle = 45;
				body.SetAngle(box2d.radian(angle));
			});
		});

		//エフェクト作成
		const effects: g.FrameSprite[] = [];
		let effectsNum = 0;
		for (let i = 0; i < 5; i++) {
			const effect = new g.FrameSprite({
				scene: scene,
				src: scene.assets["effect"] as g.ImageAsset,
				width: 120,
				height: 120,
				frames: [0, 1, 2],
				interval:100
			});
			effect.hide();
			effect.start();
			effects.push(effect);
			this.append(effect);
		}

		const start = () => {
			b2body.SetLinearVelocity(box2d.vec2(0, 0));
			b2body.SetAngularVelocity(0);
			b2body.SetPosition(box2d.vec2(100 + scene.random.get(0,80), -20));
			items.forEach((e) => {
				e.show();
			});
		}

		scene.update.add(function () {
			if (!scene.isStart) return;
			// 物理エンジンの世界を進める
			box2d.step(1 / g.game.fps);

			if (ball.y > 360) {
				start();
			}

			function rotatePoints(point: { x: number, y: number }, angle: number, center: { x: number, y: number }) {
				const cos = Math.cos(angle);
				const sin = Math.sin(angle);
				const x = point.x - center.x;
				const y = point.y - center.y;
				const xx = x * cos - y * sin + center.x;
				const yy = x * sin + y * cos + center.y;
				return { x: xx, y: yy };
			}

			for (let i = 0; i < items.length; i++) {
				const e = items[i];
				if (e.tag > -1) {
					const entity = floors[e.tag as number];
					const centerX = entity.x + (entity.width / 2);
					const centerY = entity.y + (entity.height / 2);

					const pos = rotatePoints(itemPoints[i], box2d.radian(entity.angle), { x: centerX, y: centerY });
					e.x = pos.x - (e.width / 2);
					e.y = pos.y - (e.height / 2);
					e.modified();
				}
				if (!(e.state & 1)) {
					if (g.Collision.intersectAreas(ball, e)) {
						if (e.tag > -1) {
							scene.addScore(400);
							scene.playSound("coin02");
						} else {
							scene.addScore(-e.tag * 1000);
							scene.playSound("coin03");
						}

						const effect = effects[effectsNum];
						effect.x = e.x - 50;
						effect.y = e.y - 50;
						effect.show();
						effect.modified();
						effectsNum = (effectsNum + 1) % effects.length
						scene.setTimeout(() => {
							effect.hide();
						}, 300);

						e.hide();
					}
				}
			}

		});

		this.finish = () => {
		};

		//リセット
		this.reset = () => {
			start();
		};

	}
}