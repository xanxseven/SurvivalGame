import { ITEM, Items } from "../../../shared/Item";
import { SPRITE } from "../../../shared/Sprite";
import { renderer } from "../GameClient";
import { mNode, mSprite, mText } from "../Renderer";
import { Sprites } from "../Sprites";

const root: mNode = new mNode();
const icons: mSprite[] = [];
const totalSlots: number = 10;
const slotIndexLabels: mText[] = [];
const slotQuantityLabels: mText[] = [];
const gap = 10;
const fontName = `"Baloo Paaji", Verdana, sans-serif`;
for (let i = 0; i < totalSlots; i++) {
  const sprite = new mSprite(Sprites[SPRITE.SLOT]);
  icons.push(sprite);
  root.add(sprite);

  const indexLabel = new mText("" + (i + 1), {
    fontSize: 25,
    fontFamily: fontName,
    fill: "white",
    align: "left",
    baseLine: "top",
  });

  const quantityLabel = new mText("", {
    fontSize: 25,
    fontFamily: fontName,
    fill: "white",
    align: "right",
    baseLine: "top",
  });

  indexLabel.position.x = 10;
  indexLabel.position.y = 10;
  indexLabel.visible = false;

  quantityLabel.position.x = 70;
  quantityLabel.position.y = 80;
  quantityLabel.visible = false;

  sprite.add(indexLabel);
  sprite.add(quantityLabel);

  slotIndexLabels.push(indexLabel);
  slotQuantityLabels.push(quantityLabel);
}

function reposition() {
  const firstIcon = icons[0];
  let totalWidth = totalSlots * (firstIcon.frame.size.x * firstIcon.frame.scale.x + gap);

  const y = renderer.scaledHeight - firstIcon.frame.size.y * firstIcon.frame.scale.y - 5;

  const x = renderer.scaledWidth * .5 - totalWidth * .5;
  root.position.y = y;

  for (let i = 0; i < totalSlots; i++) {
    const icon = icons[i];
    icon.position.y = 0
    icon.position.x = x + i * (icon.frame.size.x * icon.frame.scale.x + gap);
  }
}

function updateSlot(slotIndex: number, itemId: number, quantity: number) {
  if (itemId === ITEM.NONE || quantity === 0) {
    quantity = 0;
    itemId = ITEM.NONE;
    slotQuantityLabels[slotIndex].visible = false;
    slotIndexLabels[slotIndex].visible = false;
  } else {
    slotQuantityLabels[slotIndex].visible = true;
    slotIndexLabels[slotIndex].visible = true;
    slotQuantityLabels[slotIndex].updateText("x" + quantity);
  }

  icons[slotIndex].frame = Sprites[Items[itemId].inventorySprite];
}

updateSlot(3, 0, 0);

export const Hotbar_root = root;
export const Hotbar_reposition = reposition;
export const Hotbar_updateSlot = updateSlot;