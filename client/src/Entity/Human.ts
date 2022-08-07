import { ANIMATION, animationDurations } from "../../../shared/AnimationConfig";
import { ITEM, Items } from "../../../shared/Item";
import { SPRITE } from "../../../shared/Sprite";
import { computeAndApplyAnimation, computeAndApplyAnimationTransition } from "../Animation/AnimUtils";
import { humanIdleHandL, humanIdleHandR } from "../Animation/HUMAN/FIST/IDLE_FIST";
import { humanMoveFootL, humanMoveFootR, humanMoveHandL, humanMoveHandR } from "../Animation/HUMAN/FIST/MOVE_FIST";
import { humanUseHandL, humanUseHandR } from "../Animation/HUMAN/FIST/USE_FIST";
import { humanIdleSword } from "../Animation/HUMAN/SWORD/IDLE_SWORD";
import { worldLayer1, worldLayer2 } from "../GameClient";
import { mAnimatedSprite, mNode, mText } from "../Renderer";
import { Sprites } from "../Sprites";
import { Entity } from "./Entity";
import { HealthBar } from "./Healthbar";

const fontName = `"Baloo Paaji", Verdana, sans-serif`;

export class HumanEntity extends Entity {
  itemId: number = ITEM.FIST;
  root = new mNode();
  body = new mAnimatedSprite(Sprites[SPRITE.PLAYER]);
  leftArm = new mAnimatedSprite(Sprites[SPRITE.PLAYER_ARM_L]);
  rightArm = new mAnimatedSprite(Sprites[SPRITE.PLAYER_ARM_R]);
  rightFoot = new mAnimatedSprite(Sprites[SPRITE.FOOT_R]);
  leftFoot = new mAnimatedSprite(Sprites[SPRITE.FOOT_L]);
  item = new mAnimatedSprite(Sprites[SPRITE.SWORD]);
  nameLabel = new mText("Hello world!", {
    align: 'left',
    baseLine: 'top',
    fill: "white",
    fontFamily: fontName,
    fontSize: 23,

  });
  healthBar = new HealthBar;
  doInterpolation: boolean = true;
  doUpdate: boolean = true;
  activeArm = 0;

  updateName(text: string) {
    this.nameLabel.updateText(text);
    this.nameLabel.frame.anchor.x = this.nameLabel.frame.size.x * .5 * this.nameLabel.frame.scale.x;
    this.nameLabel.frame.anchor.y = this.nameLabel.frame.size.y * .5 * this.nameLabel.frame.scale.y;
  }

  constructor(type: number) {
    super(type);

    this.root.add(this.leftFoot);
    this.root.add(this.rightFoot);
    this.root.add(this.body);
    this.root.add(this.item);
    this.root.add(this.leftArm);
    this.root.add(this.rightArm);
    this.animationState = ANIMATION.IDLE_FIST;

    this.item.setDepth(-1);
    this.setItemActive(false);
    this.updateName("playerName");
  }

  updateHealth(health: number): void {
    this.healthBar.setHealth(health / 100);
  }

  setTransform(x: number, y: number, rotation: number) {
    this.root.position.x = x;
    this.root.position.y = y;
    this.root.rotation = rotation;

    this.healthBar.root.position.x = x;
    this.healthBar.root.position.y = y + 50;
    this.nameLabel.position.x = x;
    this.nameLabel.position.y = y - 65;
  }

  changeAnimState(newState: number): void {
    if (newState === ANIMATION.USE_FIST) {
      this.activeArm = +(!this.activeArm);
    }
    super.changeAnimState(newState);
  }

  addToScene() {
    worldLayer1.add(this.root);
    //worldLayer2.add(this.healthBar.root);
    worldLayer2.add(this.nameLabel);
  }

  removeFromScene() {
    worldLayer1.remove(this.root);
    //worldLayer2.remove(this.healthBar.root);
    worldLayer2.remove(this.nameLabel);
  }

  onAnimationOver(): void {
    if (this.animationState === ANIMATION.USE_FIST) {
      this.changeAnimState(ANIMATION.IDLE_FIST);
    } else if (this.animationState === ANIMATION.USE_SWORD) {
      this.changeAnimState(ANIMATION.IDLE_SWORD);
    }
  }

  update(delta: number) {
    this.delta += delta;

    if (this.isTransition) {
      this.transition += delta;
      if (this.transition > this.totalTransitionTime) {
        this.isTransition = false;
      }
    }

    if (this.isTransition) {
      const t = this.transition / this.totalTransitionTime;
      switch (this.animationState) {
        case ANIMATION.IDLE_FIST:
          computeAndApplyAnimationTransition(this.rightArm, humanIdleHandR, this.delta, t);
          computeAndApplyAnimationTransition(this.leftArm, humanIdleHandL, this.delta, t);
          this.leftFoot.position.y = 0;
          this.rightFoot.position.y = 0;
          break;
        case ANIMATION.USE_FIST:
          if (this.activeArm) {
            computeAndApplyAnimationTransition(this.rightArm, humanIdleHandR, this.delta, t);
            computeAndApplyAnimationTransition(this.leftArm, humanUseHandL, this.delta, t);
          } else {
            computeAndApplyAnimationTransition(this.rightArm, humanUseHandR, this.delta, t);
            computeAndApplyAnimationTransition(this.leftArm, humanIdleHandL, this.delta, t);
          }
          this.leftFoot.position.y = 0;
          this.rightFoot.position.y = 0;
          break;
        case ANIMATION.MOVE_FIST:
          computeAndApplyAnimationTransition(this.rightArm, humanMoveHandR, this.delta, t);
          computeAndApplyAnimationTransition(this.leftArm, humanMoveHandL, this.delta, t);
          computeAndApplyAnimationTransition(this.rightFoot, humanMoveFootR, this.delta, t);
          computeAndApplyAnimationTransition(this.leftFoot, humanMoveFootL, this.delta, t);
          break;
        case ANIMATION.IDLE_SWORD: {
          computeAndApplyAnimationTransition(this.rightArm, humanIdleHandR, this.delta, t);
          computeAndApplyAnimationTransition(this.leftArm, humanIdleHandL, this.delta, t);
          computeAndApplyAnimationTransition(this.item, humanIdleSword, this.delta, t);
          this.item.position.x = this.leftArm.position.x;
          this.item.position.y = this.leftArm.position.y;
          this.leftFoot.position.y = 0;
          this.rightFoot.position.y = 0;
          break;
        }
        case ANIMATION.MOVE_SWORD: {
          computeAndApplyAnimationTransition(this.rightArm, humanMoveHandR, this.delta, t);
          computeAndApplyAnimationTransition(this.leftArm, humanMoveHandL, this.delta, t);
          computeAndApplyAnimationTransition(this.item, humanIdleSword, this.delta, t);
          computeAndApplyAnimationTransition(this.rightFoot, humanMoveFootR, this.delta, t);
          computeAndApplyAnimationTransition(this.leftFoot, humanMoveFootL, this.delta, t);
          this.item.position.x = this.leftArm.position.x;
          this.item.position.y = this.leftArm.position.y;
          break;
        }
        case ANIMATION.USE_SWORD: {
          computeAndApplyAnimationTransition(this.rightArm, humanUseHandR, this.delta, t);
          computeAndApplyAnimationTransition(this.leftArm, humanUseHandL, this.delta, t);
          computeAndApplyAnimationTransition(this.item, humanIdleSword, this.delta, t);
          this.item.position.x = this.leftArm.position.x;
          this.item.position.y = this.leftArm.position.y;
          this.leftFoot.position.y = 0;
          this.rightFoot.position.y = 0;
          break;
        }
      }
    } else {
      switch (this.animationState) {
        case ANIMATION.IDLE_FIST:
          computeAndApplyAnimation(this.leftArm, humanIdleHandL, this.delta);
          computeAndApplyAnimation(this.rightArm, humanIdleHandR, this.delta);
          this.leftFoot.position.y = 0;
          this.rightFoot.position.y = 0;
          break;
        case ANIMATION.MOVE_FIST:
          computeAndApplyAnimation(this.rightArm, humanMoveHandR, this.delta);
          computeAndApplyAnimation(this.leftArm, humanMoveHandL, this.delta);
          computeAndApplyAnimation(this.rightFoot, humanMoveFootR, this.delta);
          computeAndApplyAnimation(this.leftFoot, humanMoveFootL, this.delta);
          break;
        case ANIMATION.USE_FIST:
          if (this.activeArm) {
            computeAndApplyAnimation(this.rightArm, humanIdleHandR, this.delta);
            computeAndApplyAnimation(this.leftArm, humanUseHandL, this.delta);
          } else {
            computeAndApplyAnimation(this.rightArm, humanUseHandR, this.delta);
            computeAndApplyAnimation(this.leftArm, humanIdleHandL, this.delta);
          }
          this.leftFoot.position.y = 0;
          this.rightFoot.position.y = 0;
          break;
        case ANIMATION.IDLE_SWORD: {
          computeAndApplyAnimation(this.rightArm, humanIdleHandR, this.delta);
          computeAndApplyAnimation(this.leftArm, humanIdleHandL, this.delta);
          computeAndApplyAnimation(this.item, humanIdleSword, this.delta);
          this.item.position.x = this.leftArm.position.x;
          this.item.position.y = this.leftArm.position.y;
          this.leftFoot.position.y = 0;
          this.rightFoot.position.y = 0;
          break;
        }
        case ANIMATION.MOVE_SWORD: {
          computeAndApplyAnimation(this.rightArm, humanMoveHandR, this.delta);
          computeAndApplyAnimation(this.leftArm, humanMoveHandL, this.delta);
          computeAndApplyAnimation(this.item, humanIdleSword, this.delta);
          computeAndApplyAnimation(this.rightFoot, humanMoveFootR, this.delta);
          computeAndApplyAnimation(this.leftFoot, humanMoveFootL, this.delta);
          this.item.position.x = this.leftArm.position.x;
          this.item.position.y = this.leftArm.position.y;
          break;
        }
        case ANIMATION.USE_SWORD: {
          computeAndApplyAnimation(this.rightArm, humanUseHandR, this.delta);
          computeAndApplyAnimation(this.leftArm, humanUseHandL, this.delta);
          computeAndApplyAnimation(this.item, humanIdleSword, this.delta);
          this.item.position.x = this.leftArm.position.x;
          this.item.position.y = this.leftArm.position.y;
          this.leftFoot.position.y = 0;
          this.rightFoot.position.y = 0;
          break;
        }
      }
    }


    this.leftArm.saveState();
    this.rightArm.saveState();
    this.item.saveState();
    this.body.saveState();
    this.leftFoot.saveState();
    this.rightFoot.saveState();

    if (this.delta > animationDurations[this.animationState] * 2) this.onAnimationOver();
  };

  setRotation(rotation: number): void {
    this.root.rotation = rotation;
  }

  setItemActive(active: boolean) {
    this.item.visible = active;
  }

  setItemOnTop() {
    this.item.setDepth(1);
  }

  setItemOnBottom() {
    this.item.setDepth(-1);
  }

  changeItem(itemId: number) {
    const spriteId = Items[itemId].spriteId;
    if (spriteId === -1) this.item.visible = false;
    else {
      this.item.frame = Sprites[spriteId];
      this.item.visible = true;
    }
  }
}