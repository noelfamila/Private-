/**
 * APIから取得した生データを表示用に整形するユーティリティ関数
 */

// ガチャタイプの日本語ラベルマッピング
const GACHA_TYPE_LABELS = {
  PickupGacha:   "ピックアップ",
  LimitedGacha:  "限定ピックアップ",
  FesGacha:      "フェス限定",
};

// ガチャタイプのカラーマッピング
export const GACHA_TYPE_COLORS = {
  PickupGacha:  "#00AEEF",
  LimitedGacha: "#FF6699",
  FesGacha:     "#FFD700",
};

/**
 * API生データのガチャバナーを同一期間ごとにグループ化する
 * @param {Array} banners - /banner API から取得したガチャ配列
 * @returns {Array} グループ化されたガチャ情報
 */
export function groupBannersByPeriod(banners) {
  const groups = {};
  for (const b of banners) {
    const key = `${b.startedAt}_${b.endedAt}`;
    if (!groups[key]) {
      groups[key] = {
        id: key,
        startDate: new Date(b.startedAt).toISOString(),
        endDate: new Date(b.endedAt).toISOString(),
        gachaType: b.gachaType,
        typeLabel: GACHA_TYPE_LABELS[b.gachaType] ?? b.gachaType,
        color: GACHA_TYPE_COLORS[b.gachaType] ?? "#00AEEF",
        pickups: [],
      };
    }
    groups[key].pickups.push(...b.rateups);
  }
  return Object.values(groups).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
}

// ボス名の日本語マッピング (部分一致で対応)
const BOSS_NAME_MAP = {
  Binah:          { name: "ビナー",           terrain: "屋外・市街地",  armor: "重装甲" },
  Chesed:         { name: "ケセド",           terrain: "屋内・屋外",    armor: "重装甲" },
  ShiroKuro:      { name: "シロ＆クロ",       terrain: "市街地・屋内",  armor: "軽装甲" },
  Hieronymus:     { name: "ヒエロニムス",     terrain: "市街地・屋外",  armor: "重装甲" },
  Perorozilla:    { name: "ペロロジラ",       terrain: "野外・市街地",  armor: "弾力装甲" },
  Kaitenger:      { name: "カイテンFX Mk.0", terrain: "市街地・野外",  armor: "軽装甲・重装甲・特殊装甲" },
  HOD:            { name: "HOD",             terrain: "屋内・屋外",    armor: "弾力装甲" },
  Goz:            { name: "ゴズ",             terrain: "屋内",          armor: "特殊装甲" },
  HoverCraft:     { name: "ホバークラフト",   terrain: "野外・市街地",  armor: "重装甲" },
  EN0005:         { name: "EN0005 サルバトーレ", terrain: "屋内",       armor: "特殊装甲" },
  EN0006:         { name: "EN0006",           terrain: "屋外",          armor: "重装甲" },
  EN0010:         { name: "EN0010",           terrain: "野外",          armor: "特殊装甲" },
  EN0013:         { name: "EN0013",           terrain: "屋内",          armor: "弾力装甲" },
};

/**
 * ボスパス名からボス情報を解決する
 * @param {string} bossPath - APIから返ってくるボスのパス名（例: "Binah_Street"）
 */
export function resolveBossInfo(bossPath) {
  // パスからバリアントサフィックスを除いたベース名で検索
  for (const [key, info] of Object.entries(BOSS_NAME_MAP)) {
    if (bossPath.startsWith(key)) {
      // バリアントによる地形上書き
      let terrain = info.terrain;
      if (bossPath.includes('_Street')) terrain = "市街地";
      if (bossPath.includes('_Outdoor')) terrain = "野外";
      if (bossPath.includes('_Indoor')) terrain = "屋内";
      return { ...info, terrain, bossPath };
    }
  }
  return { name: bossPath, terrain: "不明", armor: "不明", bossPath };
}

/**
 * 現在時刻を基準に、終了しているかどうかを判定する
 * @param {string|number} endDate
 */
export function isEnded(endDate) {
  return new Date(endDate) < new Date();
}

/**
 * 現在時刻を基準に、開催中かどうかを判定する
 */
export function isOngoing(startDate, endDate) {
  const now = new Date();
  return new Date(startDate) <= now && now <= new Date(endDate);
}
