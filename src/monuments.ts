import data from "../shared/monument-data.json";
import type { Language } from "../shared/contracts";
export type MonumentGuide = (typeof data)[number];
export const monumentGuides = data;
const titles: Record<string, [string, string, string]> = {
  "abandoned-cabins": ["Заброшенные хижины", "Abandoned Cabins", "废弃小屋"],
  "abandoned-military-base": [
    "Заброшенная военная база",
    "Abandoned Military Base",
    "废弃军事基地",
  ],
  "abandoned-supermarket": ["Супермаркет", "Abandoned Supermarket", "废弃超市"],
  airfield: ["Аэродром", "Airfield", "机场"],
  "apartment-complex": ["Жилой комплекс", "Apartment Complex", "公寓楼"],
  "arctic-research-base": [
    "Арктическая база",
    "Arctic Research Base",
    "北极研究基地",
  ],
  "bandit-camp": ["Город бандитов", "Bandit Camp", "土匪营地"],
  "ferry-terminal": ["Паромный терминал", "Ferry Terminal", "渡轮码头"],
  "fishing-village": ["Рыбацкая деревня", "Fishing Village", "渔村"],
  "fishing-village-2": [
    "Рыбацкая деревня, вариант 2",
    "Fishing Village, variant 2",
    "渔村（二型）",
  ],
  "large-fishing-village": [
    "Большая рыбацкая деревня",
    "Large Fishing Village",
    "大型渔村",
  ],
  "giant-excavator-pit": [
    "Гигантский экскаватор",
    "Giant Excavator Pit",
    "巨型挖掘机",
  ],
  harbor: ["Малый порт", "Small Harbor", "小型港口"],
  "harbor-2": ["Большой порт", "Large Harbor", "大型港口"],
  "hqm-quarry": ["Карьер МВК", "HQM Quarry", "高质量金属采石场"],
  "jungle-ruin": ["Руины в джунглях", "Jungle Ruins", "丛林遗迹"],
  "jungle-ziggurat": ["Зиккурат", "Jungle Ziggurat", "丛林神庙"],
  junkyard: ["Свалка", "Junkyard", "废品场"],
  "large-barn": ["Большой амбар", "Large Barn", "大谷仓"],
  "large-oil-rig": ["Большая нефтяная вышка", "Large Oil Rig", "大型石油平台"],
  "launch-site": ["Космодром", "Launch Site", "发射场"],
  lighthouse: ["Маяк", "Lighthouse", "灯塔"],
  "military-tunnel": ["Военные тоннели", "Military Tunnels", "军事隧道"],
  "mining-outpost": ["Горнодобывающий аванпост", "Mining Outpost", "采矿哨站"],
  "missile-silo": ["Ракетная шахта", "Nuclear Missile Silo", "核导弹发射井"],
  "oil-rig": ["Малая нефтяная вышка", "Small Oil Rig", "小型石油平台"],
  outpost: ["Мирный город", "Outpost", "前哨站"],
  "oxums-gas-station": ["Заправка Oxum's", "Oxum's Gas Station", "Oxum 加油站"],
  "power-plant": ["Электростанция", "Power Plant", "发电厂"],
  radtown: ["Радтаун", "Radtown", "辐射镇"],
  ranch: ["Ранчо", "Ranch", "牧场"],
  "satellite-dish": ["Спутниковые антенны", "Satellite Dish", "卫星天线"],
  "sewer-branch": ["Канализационная ветка", "Sewer Branch", "下水道分支"],
  "stone-quarry": ["Каменный карьер", "Stone Quarry", "石料采石场"],
  "sulfur-quarry": ["Серный карьер", "Sulfur Quarry", "硫磺采石场"],
  "the-dome": ["Сфера", "The Dome", "球形储罐"],
  "train-tunnel": ["Вход в метро", "Train Tunnel Entrance", "地铁入口"],
  "train-yard": ["Железнодорожное депо", "Train Yard", "火车站"],
  "underground-cave": ["Пещера", "Cave", "洞穴"],
  "underwater-lab": ["Подводная лаборатория", "Underwater Labs", "水下实验室"],
  "water-treatment-plant": [
    "Водоочистная станция",
    "Water Treatment Plant",
    "水处理厂",
  ],
  "water-well": ["Колодец", "Water Well", "水井"],
};
const normalize = (token: string) =>
  token
    .replace(/_display_name$/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
const aliases: Record<string, string> = {
  arcticbasea: "arctic-research-base",
  arcticbaseb: "arctic-research-base",
  ferryterminal: "ferry-terminal",
  gasstation: "oxums-gas-station",
  supermarket: "abandoned-supermarket",
  swamp: "abandoned-cabins",
  swampc: "abandoned-cabins",
  compound: "outpost",
  bandittown: "bandit-camp",
  trainyard: "train-yard",
  launchsite: "launch-site",
  waterplant: "water-treatment-plant",
  powerplant: "power-plant",
  militarytunnels: "military-tunnel",
  militarytunnel: "military-tunnel",
  excavator: "giant-excavator-pit",
  dome: "the-dome",
  oilrigsmall: "oil-rig",
  oilriglarge: "large-oil-rig",
  oilrig1: "oil-rig",
  oilrig2: "large-oil-rig",
  sewerbranch: "sewer-branch",
  satellitedish: "satellite-dish",
  cave: "underground-cave",
  underwaterlabs: "underwater-lab",
  largetrainstation: "train-yard",
  missilesilo: "missile-silo",
  stoneminingquarry: "stone-quarry",
  sulfurminingquarry: "sulfur-quarry",
  hqmminingquarry: "hqm-quarry",
  smallharbor: "harbor",
  largeharbor: "harbor-2",
  harbor1: "harbor",
  harbor2: "harbor-2",
  trainstation: "train-tunnel",
};
export function guideForMonument(token: string) {
  const key = normalize(token),
    alias = aliases[key];
  return data.find(
    (guide) =>
      guide.id === alias ||
      normalize(guide.id) === key ||
      normalize(guide.key) === key,
  );
}
export function monumentName(token: string, language: Language) {
  const guide = guideForMonument(token);
  if (guide)
    return (
      titles[guide.id]?.[language === "ru" ? 0 : language === "en" ? 1 : 2] ||
      guide.name
    );
  return token
    .replace(/_display_name$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .trim();
}
export function localText(
  language: Language,
  ru: string,
  en: string,
  zh: string,
) {
  return language === "ru" ? ru : language === "zh" ? zh : en;
}
const areas: Record<string, [string, string, string]> = {
  "ferry-terminal": [
    "Терминал, причалы, служебные помещения и вход в тоннели",
    "Terminal, docks, service rooms and tunnel entrance",
    "航站楼、码头、服务间和隧道入口",
  ],
  harbor: [
    "Контейнеры у причала, склады и комната за зелёной дверью",
    "Dockside containers, warehouses and the green-card room",
    "码头集装箱、仓库和绿卡房",
  ],
  "harbor-2": [
    "Большой склад, контейнеры под краном и комната с картой",
    "Main warehouse, crane-side containers and the keycard room",
    "主仓库、起重机旁的集装箱和卡房",
  ],
  airfield: [
    "Ангары, офисное здание, вышка и подземные переходы",
    "Hangars, office building, tower and underground passages",
    "机库、办公楼、塔楼和地下通道",
  ],
  "launch-site": [
    "Склады и двор с Bradley, затем главное здание и крыша",
    "Warehouses and the Bradley yard, then the main building and roof",
    "仓库、布拉德利巡逻区、主楼和屋顶",
  ],
  "arctic-research-base": [
    "Наземные лаборатории, переходы и комнаты с картами",
    "Ground-level labs, walkways and keycard rooms",
    "地面实验室、通道和卡房",
  ],
  "military-tunnel": [
    "Входной тоннель, состав в центре и помещения за дверями",
    "Entry tunnel, central train and rooms behind keycard doors",
    "入口隧道、中央列车和卡门后的房间",
  ],
  "missile-silo": [
    "Входная площадка, подземные этажи и нижние помещения",
    "Entrance area, underground floors and lower rooms",
    "入口区、地下楼层和底部房间",
  ],
  "the-dome": [
    "Нижние площадки, трубы, подъём на сферу и комната пазла",
    "Lower platforms, pipes, the dome climb and puzzle room",
    "底部平台、管道、球体攀爬路线和解谜房",
  ],
  "power-plant": [
    "Подстанции, наружные площадки и комнаты с питанием",
    "Substations, outside platforms and powered rooms",
    "变电站、室外平台和通电房间",
  ],
  "water-treatment-plant": [
    "Резервуары, промышленные здания и помещения с картами",
    "Tanks, industrial buildings and keycard rooms",
    "储水池、工业建筑和卡房",
  ],
  "train-yard": [
    "Вагоны, склады, вышки и центральное здание",
    "Train cars, warehouses, towers and the central building",
    "车厢、仓库、塔楼和中央建筑",
  ],
  "sewer-branch": [
    "Наружные здания, спуск в канализацию и подземная комната",
    "Surface buildings, sewer access and the underground room",
    "地面建筑、下水道入口和地下房间",
  ],
  "satellite-dish": [
    "Основания антенн, служебные постройки и комната с картой",
    "Dish bases, service buildings and the keycard room",
    "天线底座、服务建筑和卡房",
  ],
  "oil-rig": [
    "Нижняя посадочная площадка, лестницы и верхние палубы",
    "Lower landing, stairways and upper decks",
    "底层登陆区、楼梯和上层甲板",
  ],
  "large-oil-rig": [
    "Нижняя посадочная площадка, внутренние комнаты и верхние палубы",
    "Lower landing, interior rooms and upper decks",
    "底层登陆区、内部房间和上层甲板",
  ],
  "underwater-lab": [
    "Вход через лунный бассейн, коридоры и отдельные комнаты",
    "Moonpool entrance, corridors and separate rooms",
    "月池入口、走廊和各个房间",
  ],
  "oxums-gas-station": [
    "Магазин, задняя служебная комната и крыша",
    "Shop, back service room and roof",
    "商店、后方服务间和屋顶",
  ],
  "abandoned-supermarket": [
    "Торговый зал, подсобки и пространство за зданием",
    "Shop floor, service rooms and the area behind the building",
    "卖场、服务间和建筑后方",
  ],
  lighthouse: [
    "Основание маяка, лестница и верхняя площадка",
    "Lighthouse base, stairs and upper platform",
    "灯塔底部、楼梯和顶部平台",
  ],
  "abandoned-cabins": [
    "Хижины и небольшие постройки среди болота",
    "Cabins and small buildings around the swamp",
    "沼泽中的小屋和建筑",
  ],
  "jungle-ziggurat": [
    "Уровни храма, переходы и площадки наверху",
    "Temple levels, walkways and upper platforms",
    "神庙楼层、通道和上方平台",
  ],
  "jungle-ruin": [
    "Внутренние дворы, проходы и верхние площадки руин",
    "Courtyards, passages and upper ruin platforms",
    "内院、通道和遗迹上层平台",
  ],
  junkyard: [
    "Кучи металлолома, служебные постройки и площадки у крана",
    "Scrap heaps, service buildings and crane-side platforms",
    "废金属堆、服务建筑和起重机旁平台",
  ],
  "giant-excavator-pit": [
    "Внешние здания, экскаватор и точки выдачи ресурсов",
    "Outer buildings, excavator and resource output bins",
    "外围建筑、挖掘机和资源输出箱",
  ],
  "train-tunnel": [
    "Спуск, станция и боковые помещения",
    "Access shaft, station and side rooms",
    "下行通道、车站和侧室",
  ],
};
export function monumentAreas(guide: MonumentGuide, language: Language) {
  const value = areas[guide.id];
  return value
    ? value[language === "ru" ? 0 : language === "en" ? 1 : 2]
    : localText(
        language,
        "Начни с доступных построек и внешних площадок. Проверь отдельные помещения и точки из таблицы лута.",
        "Check accessible buildings and outside platforms, then the separate rooms and loot points listed below.",
        "先检查可进入的建筑和室外平台，再查看各个房间与下表中的战利品刷新点。",
      );
}
export function monumentTips(guide: MonumentGuide, language: Language) {
  const tips: string[] = [];
  const say = (ru: string, en: string, zh: string) =>
    tips.push(localText(language, ru, en, zh));
  if (guide.safeZone)
    say(
      "Перед входом убери оружие и проверь, нет ли на тебе агрессии. Переработку и покупки закончи до выхода из безопасной зоны.",
      "Holster your weapon and check your hostility timer before entering. Finish recycling and purchases before leaving the safe zone.",
      "进入前收起武器并检查敌对状态计时。离开安全区前完成回收和购买。",
    );
  else
    say(
      "Проверь выход и позиции над собой до начала лутания. Забирай самое ценное первым, перерабатывай только после проверки подходов.",
      "Check the exit and positions above you before looting. Take valuable loot first and check approaches before recycling.",
      "搜刮前检查出口和上方位置。先拿贵重物品，回收前确认周围通道。",
    );
  if (["oil-rig", "large-oil-rig", "underwater-lab"].includes(guide.id))
    say(
      "Подготовь транспорт для обратного пути, оружие и лечение. В лаборатории возьми акваланг; на вышке проверь верхние палубы перед взломом ящика.",
      "Bring return transport, a weapon and healing. Take scuba gear for labs; clear the upper rig decks before starting a crate hack.",
      "准备返程交通工具、武器和治疗物品。实验室需要潜水装备；石油平台开始破解箱子前先清理上层甲板。",
    );
  if (guide.id === "arctic-research-base")
    say(
      "Холод и учёные требуют одежды, оружия и запаса лечения. Проверяй переходы между зданиями, там легко попасть под перекрёстный огонь.",
      "Bring warm clothing, a weapon and spare healing for the cold and scientists. Watch the walkways between buildings for crossfire.",
      "为寒冷和科学家准备保暖衣物、武器和充足治疗。注意建筑间通道的交叉火力。",
    );
  if (
    [
      "launch-site",
      "military-tunnel",
      "power-plant",
      "water-treatment-plant",
      "missile-silo",
    ].includes(guide.id)
  )
    say(
      "Возьми защиту от радиации и запас лечения. Сначала проверь NPC и возможность выйти из закрытого помещения.",
      "Bring radiation protection and spare healing. Check NPCs and the exit from locked rooms before committing.",
      "携带防辐射装备和充足治疗。进入封闭房间前先确认 NPC 和出口。",
    );
  if (["the-dome", "jungle-ziggurat", "lighthouse"].includes(guide.id))
    say(
      "Перед прыжком осмотри следующую площадку. Лечение лучше оставить в быстром слоте, а путь вниз выбрать до подъёма.",
      "Check the next platform before jumping. Keep healing on your hotbar and plan the way down before climbing.",
      "跳跃前查看下一个平台。把治疗放在快捷栏，攀爬前规划下行路线。",
    );
  if (guide.id === "launch-site")
    say(
      "Bradley патрулирует двор. Используй здания как укрытие и не пересекай его маршрут с инвентарём, полным лута.",
      "Bradley patrols the yard. Use buildings for cover and avoid crossing its route with a full inventory.",
      "布拉德利会巡逻院区。利用建筑掩护，背包满载时避免穿过它的路线。",
    );
  if (guide.id === "giant-excavator-pit")
    say(
      "Перед запуском проверь обе точки выдачи: ресурс забирается с двух сторон, и вторую может контролировать другая команда.",
      "Check both output bins before starting it. Resources come out on two sides and another team can hold the second one.",
      "启动前检查两个输出箱。资源会从两侧产出，另一队可能占据第二侧。",
    );
  return tips;
}
