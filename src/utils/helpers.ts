export const emojis: Record<string, string> = {
  mango: "🥭", fresa: "🍓", uva: "🍇", papaya: "🍈", sandia: "🍉",
  melon: "🍈", manzana: "🍎", platano: "🍌", piña: "🍍", naranja: "🍊",
  kiwi: "🥝", aguacate: "🥑", limon: "🍋", blueberry: "🫐",
  mora: "🍇", frambuesa: "🍓", durazno: "🍑", pera: "🍐", coco: "🥥"
};

export function getEmoji(name: string): string {
  const n = name.toLowerCase();
  for (const key in emojis) {
    if (n.includes(key)) return emojis[key];
  }
  return "🥬";
}

export const initialBoxes = [
  { id: "c1", precio: 250, espacios: 10, color: "#E8F5E9", label: "Caja 10" },
  { id: "c2", precio: 300, espacios: 13, color: "#C8E6C9", label: "Caja 13" },
  { id: "c3", precio: 350, espacios: 16, color: "#A5D6A7", label: "Caja 16" },
  { id: "c4", precio: 400, espacios: 19, color: "#81C784", label: "Caja 19" }
];
