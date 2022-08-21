import { Types, defineComponent } from "bitecs";

export const C_Vector3 = { x: Types.f32, y: Types.f32 }
export const C_Position = defineComponent(C_Vector3);
export const C_Rotation = defineComponent({ rotation: Types.f32 });
export const C_Body = defineComponent();
export const C_Controls = defineComponent({ x: Types.f32, y: Types.f32, vel: Types.f32 });
export const C_Base = defineComponent({ active: Types.ui8, type: Types.ui8, networkTypes: Types.ui32, alive: Types.ui8 });
export const C_Weilds = defineComponent({ itemId: Types.ui16 });
export const C_HitBouceEffect = defineComponent({ hitInThisFrame: Types.ui8 });
export const C_ClientHandle = defineComponent({ cid: Types.ui16 });
export const C_AttackTimer = defineComponent({ attackDelay: Types.f32, attackCooldown: Types.f32, active: Types.ui8 });
export const C_Health = defineComponent({ health: Types.ui16, maxHealth: Types.ui16 });
export const C_Mouse = defineComponent({ mouseDown: Types.ui8 });
export const C_Leaderboard = defineComponent({ score: Types.ui32 });
export const C_Mob = defineComponent({ state: Types.ui32, isHostile: Types.ui8, timer: Types.f32, stateTimer: Types.f32, targetEid: Types.ui32, targetAngle: Types.f32});


export const maxIventorySize = 10;

// item, quantity
export const C_Inventory = defineComponent({
  items: [Types.ui16, maxIventorySize * 2],
});