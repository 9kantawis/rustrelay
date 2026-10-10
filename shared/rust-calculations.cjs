"use strict";
const materials = {
  twig: { name: "Солома", hp: 10, hours: 1 },
  wood: { name: "Дерево", hp: 250, hours: 3 },
  stone: { name: "Камень", hp: 500, hours: 5 },
  metal: { name: "Металл", hp: 1000, hours: 8 },
  armored: { name: "Броня", hp: 2000, hours: 12 },
};
const explosives = [
  { id: "rocket", name: "Ракета", sulfur: 1400, lgf: 30, time: 10 },
  { id: "c4", name: "C4", sulfur: 2200, lgf: 60, time: 30 },
  { id: "satchel", name: "Сачель", sulfur: 480, lgf: 0, time: 30 },
  { id: "ammo", name: "Разрывной патрон", sulfur: 25, lgf: 0, time: 1 },
];
// Vanilla reference damage, hard side, a single target; splash and gun durability excluded.
const targets = [
  {
    id: "wood-door",
    name: "Деревянная дверь",
    group: "Двери",
    hp: 200,
    damage: { rocket: 247.6, c4: 440, satchel: 91.5, ammo: 5.6 },
  },
  {
    id: "metal-door",
    name: "Металлическая дверь",
    group: "Двери",
    hp: 250,
    damage: { rocket: 220, c4: 440, satchel: 70, ammo: 4 },
  },
  {
    id: "garage-door",
    name: "Гаражная дверь",
    group: "Двери",
    hp: 600,
    damage: { rocket: 220, c4: 440, satchel: 70, ammo: 4 },
  },
  {
    id: "armored-door",
    name: "Бронированная дверь",
    group: "Двери",
    hp: 1000,
    damage: { rocket: 220, c4: 440, satchel: 70, ammo: 4 },
  },
  {
    id: "wood-wall",
    name: "Деревянная стена",
    group: "Стены",
    hp: 250,
    damage: { rocket: 137.5, c4: 275, satchel: 51.5, ammo: 2.8 },
  },
  {
    id: "stone-wall",
    name: "Каменная стена",
    group: "Стены",
    hp: 500,
    damage: { rocket: 137.6, c4: 275, satchel: 51.5, ammo: 2.8 },
  },
  {
    id: "metal-wall",
    name: "Металлическая стена",
    group: "Стены",
    hp: 1000,
    damage: { rocket: 137.6, c4: 275, satchel: 43.5, ammo: 2.8 },
  },
  {
    id: "armored-wall",
    name: "Бронированная стена",
    group: "Стены",
    hp: 2000,
    damage: { rocket: 137.6, c4: 275, satchel: 43.5, ammo: 2.8 },
  },
];
const recipes = [
  {
    id: "rifle.ak",
    name: "Assault Rifle",
    tier: 3,
    time: 45,
    yield: 1,
    ingredients: { hqm: 50, wood: 200, riflebody: 1, spring: 4 },
  },
  {
    id: "rocket",
    name: "Ракета",
    tier: 3,
    time: 10,
    yield: 1,
    ingredients: { explosives: 10, gunpowder: 150, pipe: 2, lgf: 30 },
  },
  {
    id: "c4",
    name: "C4",
    tier: 3,
    time: 30,
    yield: 1,
    ingredients: { explosives: 20, cloth: 5, tech: 2 },
  },
  {
    id: "explosives",
    name: "Взрывчатое вещество",
    tier: 3,
    time: 5,
    yield: 1,
    ingredients: { gunpowder: 50, lgf: 3, sulfur: 10, metal: 10 },
  },
  {
    id: "gunpowder",
    name: "Порох",
    tier: 1,
    time: 2,
    yield: 10,
    ingredients: { sulfur: 20, charcoal: 30 },
  },
  {
    id: "ammo",
    name: "Разрывные патроны",
    tier: 3,
    time: 10,
    yield: 2,
    ingredients: { gunpowder: 20, metal: 10, sulfur: 10 },
  },
  {
    id: "syringe",
    name: "Медицинский шприц",
    tier: 2,
    time: 10,
    yield: 1,
    ingredients: { cloth: 15, metal: 10, lgf: 10 },
  },
  {
    id: "ammo.rifle",
    name: "Патроны 5.56",
    tier: 2,
    time: 10,
    yield: 3,
    ingredients: { metal: 10, gunpowder: 5 },
  },
  {
    id: "satchel",
    name: "Сачель",
    tier: 1,
    time: 30,
    yield: 1,
    ingredients: { beancan: 4, stash: 1, rope: 1 },
  },
  {
    id: "beancan",
    name: "Бобовая граната",
    tier: 1,
    time: 15,
    yield: 1,
    ingredients: { gunpowder: 60, metal: 20 },
  },
  {
    id: "stash",
    name: "Маленький тайник",
    tier: 0,
    time: 5,
    yield: 1,
    ingredients: { cloth: 10 },
  },
  {
    id: "lgf",
    name: "Топливо низкого качества",
    tier: 0,
    time: 5,
    yield: 4,
    ingredients: { fat: 3, cloth: 1 },
  },
];
const names = {
  wood: "Дерево",
  stone: "Камень",
  metal: "Фрагменты металла",
  hqm: "МВК",
  sulfur: "Сера",
  charcoal: "Уголь",
  gunpowder: "Порох",
  lgf: "Топливо",
  cloth: "Ткань",
  riflebody: "Корпус винтовки",
  spring: "Пружина",
  pipe: "Труба",
  explosives: "Взрывчатка",
  tech: "Микросхема",
  rope: "Верёвка",
  fat: "Жир",
  scrap: "Скрап",
  beancan: "Бобовая граната",
  stash: "Тайник",
};
const recyclables = [
  { id: "gears", name: "Шестерни", outputs: { metal: 12.5, scrap: 10 } },
  {
    id: "blade",
    name: "Металлическое лезвие",
    outputs: { metal: 15, scrap: 2 },
  },
  { id: "pipe", name: "Труба", outputs: { hqm: 1, scrap: 5 } },
  { id: "spring", name: "Пружина", outputs: { hqm: 1, scrap: 10 } },
  {
    id: "sheet",
    name: "Листовой металл",
    outputs: { metal: 100, hqm: 1, scrap: 8 },
  },
  { id: "tank", name: "Пропановый баллон", outputs: { metal: 50, scrap: 1 } },
  { id: "sign", name: "Дорожные знаки", outputs: { hqm: 1, scrap: 5 } },
  { id: "rope", name: "Верёвка", outputs: { cloth: 15 } },
  { id: "sewing", name: "Набор для шитья", outputs: { cloth: 10, rope: 2 } },
  { id: "tarp", name: "Брезент", outputs: { cloth: 50 } },
  { id: "tech", name: "Микросхема", outputs: { hqm: 1, scrap: 20 } },
  { id: "riflebody", name: "Корпус винтовки", outputs: { hqm: 2, scrap: 25 } },
  {
    id: "semi",
    name: "Корпус полуавтомата",
    outputs: { metal: 75, hqm: 2, scrap: 15 },
  },
  { id: "smg", name: "Корпус SMG", outputs: { hqm: 2, scrap: 15 } },
  { id: "fuse", name: "Предохранитель", outputs: { scrap: 20 } },
  { id: "camera", name: "Камера", outputs: { hqm: 2, tech: 2 } },
  {
    id: "computer",
    name: "Компьютер",
    outputs: { metal: 50, hqm: 1, tech: 3 },
  },
];
function positive(value, maximum = 100000) {
  value = Number(value);
  if (!Number.isFinite(value) || value < 0 || value > maximum)
    throw Error("Некорректное количество");
  return value;
}
function decay(grade, hp, rate = 1) {
  const material = materials[grade];
  if (!material) throw Error("Неизвестный материал");
  positive(hp, material.hp);
  if (!(rate > 0 && rate <= 100)) throw Error("Некорректная скорость");
  return Math.round(((hp / material.hp) * material.hours * 3600) / rate);
}
function raid(
  targetId,
  quantity = 1,
  allowed = explosives.map((item) => item.id),
  mode = "sulfur",
) {
  const target = targets.find((item) => item.id === targetId);
  if (!target) throw Error("Неизвестная цель");
  positive(quantity, 100);
  if (!Number.isInteger(quantity)) throw Error("Нужно целое количество");
  const options = explosives.filter((item) => allowed.includes(item.id));
  if (!options.length) return null;
  // A shortest-path search over damage in tenths. Per-target optimization prevents sharing a hit across independent doors.
  const requiredDamage = Math.ceil(target.hp * 10);
  const bestByDamage = Array(requiredDamage + 1).fill(null);
  bestByDamage[0] = { sulfur: 0, lgf: 0, count: 0, time: 0, tools: {} };
  for (let damage = 0; damage < requiredDamage; damage++) {
    if (!bestByDamage[damage]) continue;
    for (const explosive of options) {
      const nextDamage = Math.min(
        requiredDamage,
        damage + Math.round(target.damage[explosive.id] * 10),
      );
      const current = bestByDamage[damage];
      const candidate = {
        sulfur: current.sulfur + explosive.sulfur,
        lgf: current.lgf + explosive.lgf,
        count: current.count + 1,
        time: current.time + explosive.time,
        tools: {
          ...current.tools,
          [explosive.id]: (current.tools[explosive.id] || 0) + 1,
        },
      };
      const existing = bestByDamage[nextDamage];
      if (
        !existing ||
        (mode === "count"
          ? candidate.count < existing.count ||
            (candidate.count === existing.count &&
              candidate.sulfur < existing.sulfur)
          : candidate.sulfur < existing.sulfur ||
            (candidate.sulfur === existing.sulfur &&
              candidate.count < existing.count))
      )
        bestByDamage[nextDamage] = candidate;
    }
  }
  const result = bestByDamage[requiredDamage];
  if (!result) return null;
  return {
    ...result,
    sulfur: result.sulfur * quantity,
    lgf: result.lgf * quantity,
    count: result.count * quantity,
    time: result.time * quantity,
    tools: Object.fromEntries(
      Object.entries(result.tools).map(([tool, count]) => [
        tool,
        count * quantity,
      ]),
    ),
  };
}
function craft(id, quantity = 1, raw = false) {
  positive(quantity, 10000);
  if (!recipes.some((recipe) => recipe.id === id))
    throw Error("Неизвестный рецепт");
  if (!Number.isInteger(quantity)) throw Error("Нужно целое количество");
  const resources = {};
  let time = 0;
  function addIngredients(itemId, amount, depth) {
    const recipe = recipes.find((item) => item.id === itemId);
    if (!recipe || depth > 12) {
      resources[itemId] = (resources[itemId] || 0) + amount;
      return;
    }
    const batches = Math.ceil(amount / recipe.yield);
    time += recipe.time * batches;
    for (const [ingredientId, ingredientAmount] of Object.entries(
      recipe.ingredients,
    )) {
      if (raw && recipes.some((item) => item.id === ingredientId))
        addIngredients(ingredientId, ingredientAmount * batches, depth + 1);
      else
        resources[ingredientId] =
          (resources[ingredientId] || 0) + ingredientAmount * batches;
    }
  }
  addIngredients(id, quantity, 0);
  return { resources, time };
}
function recycle(cart, efficiency = 0.5, chain = false) {
  if (![0.4, 0.5, 0.6, 0.75].includes(efficiency))
    throw Error("Неизвестный переработчик");
  const resources = {};
  function addOutputs(id, amount, depth) {
    positive(amount, 1000000);
    const item = recyclables.find((entry) => entry.id === id);
    if (!item || depth > 8) {
      resources[id] = (resources[id] || 0) + amount;
      return;
    }
    for (const [outputId, outputAmount] of Object.entries(item.outputs)) {
      const yieldAmount = (amount * outputAmount * efficiency) / 0.5;
      if (chain && recyclables.some((entry) => entry.id === outputId))
        addOutputs(outputId, yieldAmount, depth + 1);
      else resources[outputId] = (resources[outputId] || 0) + yieldAmount;
    }
  }
  for (const [id, amount] of Object.entries(cart)) {
    if (!recyclables.some((item) => item.id === id))
      throw Error("Неизвестный предмет");
    if (!Number.isInteger(Number(amount)))
      throw Error("Нужно целое количество");
    addOutputs(id, amount, 0);
  }
  return resources;
}
function breed(center, donors) {
  const valid = /^[GYHWX]{6}$/;
  if (
    !valid.test(center) ||
    !donors.length ||
    donors.length > 8 ||
    donors.some((donor) => !valid.test(donor))
  )
    throw Error("Нужны гены из 6 букв G, Y, H, W, X и от 1 до 8 соседей");
  return Array.from({ length: 6 }, (_, slot) => {
    const scores = { G: 0, Y: 0, H: 0, W: 0, X: 0 };
    for (const donor of donors)
      scores[donor[slot]] += "WX".includes(donor[slot]) ? 10 : 6;
    const highestScore = Math.max(...Object.values(scores));
    if (highestScore <= ("WX".includes(center[slot]) ? 10 : 6))
      return center[slot];
    return Object.keys(scores)
      .filter((gene) => scores[gene] === highestScore)
      .join("/");
  });
}
function findBreed(pool, target, center = "XXXXXX") {
  if (!/^[GYHWX]{6}$/.test(target))
    throw Error("Цель должна содержать 6 генов");
  const clones = [...new Set(pool)].slice(0, 16);
  if (clones.some((clone) => !/^[GYHWX]{6}$/.test(clone)))
    throw Error("Проверь гены клонов");
  let best = null;
  function searchCombinations(start, chosen) {
    if (chosen.length >= 2) {
      const result = breed(center, chosen);
      const exact = result.filter(
        (genes, index) => genes === target[index],
      ).length;
      const possible = result.filter((genes, index) =>
        genes.split("/").includes(target[index]),
      ).length;
      const score = exact * 10 + possible - chosen.length * 0.01;
      if (!best || score > best.score)
        best = { donors: [...chosen], result, exact, possible, score };
      if (exact === 6) return true;
    }
    if (chosen.length === 4) return false;
    for (let index = start; index < clones.length; index++) {
      chosen.push(clones[index]);
      searchCombinations(index, chosen);
      chosen.pop();
    }
    return false;
  }
  searchCombinations(0, []);
  return best;
}
module.exports = {
  materials,
  targets,
  explosives,
  recipes,
  names,
  recyclables,
  decay,
  raid,
  craft,
  recycle,
  breed,
  findBreed,
};
