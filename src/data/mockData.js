/**
 * モックデータ
 * - ガチャ・総力戦は外部APIから取得するため、ここには定義しない
 * - イベント・キャンペーンはAPIが存在しないためモックデータで管理する
 */

export const mockEvents = [
  {
    id: 1,
    title: "白亜の予告状～虚飾の館と美学の在り処～",
    type: "ストーリーイベント",
    startDate: "2026-04-22T11:00:00+09:00",
    endDate: "2026-05-06T10:59:59+09:00",
    description: "怪盗団C&Cとゲーム開発部の奇妙な依頼——謎の館に隠された秘密とは？",
    bannerColor: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483)"
  },
];

export const mockCampaigns = [
  {
    id: 1,
    name: "任務（Normal）ドロップ量2倍",
    startDate: "2026-04-24T04:00:00+09:00",
    endDate: "2026-04-28T03:59:59+09:00",
    color: "#00AEEF",
    icon: "⚡"
  },
  {
    id: 2,
    name: "任務（Hard）ドロップ量2倍",
    startDate: "2026-04-28T04:00:00+09:00",
    endDate: "2026-05-02T03:59:59+09:00",
    color: "#FF6699",
    icon: "💎"
  },
  {
    id: 3,
    name: "スペシャルクエスト開放",
    startDate: "2026-04-22T11:00:00+09:00",
    endDate: "2026-05-06T10:59:59+09:00",
    color: "#FFD700",
    icon: "🌟"
  },
];
