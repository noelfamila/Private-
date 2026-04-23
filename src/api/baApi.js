/**
 * ブルーアーカイブ 情報取得APIクライアント (v4)
 *
 * データソース:
 *   [メイン]  arona-archive/blue-archive-event-calendar → notices.json
 *             JP公式ニュースAPIを自動収集したコミュニティDB (JP専用)
 *             → イベント・ガチャ・総力戦・大決戦・制約解除決戦
 *
 *   [キャンペーン] 公式ニュースAPI (typeId=3: メンテナンス告知)
 *             → 告知本文から「○倍キャンペーン」をパースして取得
 */

// ── エンドポイント ──
const ARONA_NOTICES_URL = '/api/arona/notices.json';
const NEWS_API_BASE = '/api/news/list';

// ───────────────────────────────────────────────────
// notices.json フェッチ（キャッシュ10分）
// ───────────────────────────────────────────────────
let _noticesCache = null;
let _noticesCachedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10分

async function fetchNotices() {
  const now = Date.now();
  if (_noticesCache && now - _noticesCachedAt < CACHE_TTL_MS) {
    return _noticesCache;
  }
  const res = await fetch(ARONA_NOTICES_URL);
  if (!res.ok) throw new Error(`notices.json 取得エラー: ${res.status}`);
  _noticesCache = await res.json();
  _noticesCachedAt = now;
  return _noticesCache;
}

// ───────────────────────────────────────────────────
// 公式ニュースAPI: メンテナンス告知取得
// ───────────────────────────────────────────────────
let _newsCache = null;
let _newsCachedAt = 0;

async function fetchMaintenanceNews() {
  const now = Date.now();
  if (_newsCache && now - _newsCachedAt < CACHE_TTL_MS) {
    return _newsCache;
  }
  // typeId=3: メンテナンス告知（最新5件）
  const res = await fetch(`${NEWS_API_BASE}?typeId=3&pageNum=5&pageIndex=1`);
  if (!res.ok) throw new Error(`公式ニュース取得エラー: ${res.status}`);
  const data = await res.json();
  _newsCache = data?.data?.rows ?? [];
  _newsCachedAt = now;
  return _newsCache;
}

// ───────────────────────────────────────────────────
// 日付ユーティリティ
// ───────────────────────────────────────────────────

/**
 * "YYYY-MM-DDTHH:mm" (JST) → ISO 8601 文字列
 * notices.json は JST なのでオフセットを付与する
 */
function toIso(jstStr) {
  if (!jstStr) return null;
  if (jstStr.includes('+') || jstStr.endsWith('Z')) return jstStr;
  return `${jstStr}:00+09:00`;
}

/**
 * "YYYY年M月D日(曜) HH:MM" 形式 → ISO 8601 文字列 (JST)
 * 公式ニュースのHTML内の日付テキストをパースする
 */
function parseJpDateStr(str) {
  if (!str) return null;
  // 例: "2026年4月21日(火) 19:00"
  const m = str.match(/(\d{4})年(\d{1,2})月(\d{1,2})日[^]*?(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(h).padStart(2,'0')}:${mi}:00+09:00`;
}

// ───────────────────────────────────────────────────
// バナーカラーパレット
// ───────────────────────────────────────────────────
const PALETTE = [
  'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460, #533483)',
  'linear-gradient(135deg, #0d2137, #1b4f72, #2980b9)',
  'linear-gradient(135deg, #1a0a2e, #2d1b69, #7b2d8b)',
  'linear-gradient(135deg, #0a2e1a, #1b5e3b, #27ae60)',
  'linear-gradient(135deg, #2e1a0a, #5e3b1b, #c0392b)',
  'linear-gradient(135deg, #1a2e2e, #0f3d4e, #1a7a9a)',
];

// ───────────────────────────────────────────────────
// キャンペーンパーサー（公式ニュースAPIのメンテナンス告知から抽出）
// ───────────────────────────────────────────────────

/**
 * キャンペーンパターン定義
 * 正規表現でメンテナンス告知本文から検出する
 */
const CAMPAIGN_PATTERNS = [
  {
    regex: /報酬ドロップ量(\d+)倍UP?キャンペーン/,
    name: (m) => `報酬ドロップ量${m[1]}倍UPキャンペーン`,
    icon: '⚡',
    color: '#00AEEF',
  },
  {
    regex: /先生レベル経験値(\d+)倍UP?キャンペーン/,
    name: (m) => `先生レベル経験値${m[1]}倍UPキャンペーン`,
    icon: '🌟',
    color: '#FFD700',
  },
  {
    regex: /特別依頼ドロップ量(\d+)倍UP?キャンペーン|特別依頼.*?(\d+)倍/,
    name: (m) => `特別依頼ドロップ量${m[1] || m[2]}倍UPキャンペーン`,
    icon: '📋',
    color: '#FF6B35',
  },
  {
    regex: /クレジット(\d+)倍UP?キャンペーン|クレジット.*?(\d+)倍/,
    name: (m) => `クレジット${m[1] || m[2]}倍UPキャンペーン`,
    icon: '💰',
    color: '#2ECC71',
  },
  {
    regex: /学園交流会ドロップ量(\d+)倍UP?キャンペーン/,
    name: (m) => `学園交流会ドロップ量${m[1]}倍UPキャンペーン`,
    icon: '🏫',
    color: '#A855F7',
  },
  {
    regex: /スケジュールドロップ量(\d+)倍UP?キャンペーン/,
    name: (m) => `スケジュールドロップ量${m[1]}倍UPキャンペーン`,
    icon: '📅',
    color: '#EC4899',
  },
  {
    regex: /任務.*?ドロップ量(\d+)倍UP?キャンペーン/,
    name: (m) => `任務ドロップ量${m[1]}倍UPキャンペーン`,
    icon: '⚔️',
    color: '#F59E0B',
  },
];

/**
 * メンテナンス告知HTMLからキャンペーン情報を抽出する
 * 期間はメンテナンス終了〜次のメンテナンス開始まで
 */
function parseCampaignsFromNews(newsRows) {
  const campaigns = [];
  const now = new Date();

  for (const row of newsRows) {
    // summary/contentからプレーンテキストを取得
    const rawText = [row.summary ?? '', row.content ?? ''].join('\n');
    // HTMLタグを除去してテキスト化
    const text = rawText.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');

    if (!text) continue;

    // メンテナンスの開始・終了日時を取得
    let maintStart = null;
    let maintEnd = null;

    // "YYYY年M月D日(曜) HH:MM ～ YYYY年M月D日(曜) HH:MM" 形式
    const periodMatch = text.match(
      /(\d{4}年\d{1,2}月\d{1,2}日[^]*?\d{1,2}:\d{2}).*?～.*?(\d{4}年\d{1,2}月\d{1,2}日[^]*?\d{1,2}:\d{2})/
    );
    if (periodMatch) {
      maintStart = parseJpDateStr(periodMatch[1]);
      maintEnd = parseJpDateStr(periodMatch[2]);
    }

    // キャンペーン終了日: メンテナンス本文から「次のメンテ前」を推定
    // 基本的にキャンペーンは次回メンテまで継続（約2週間）
    const campaignStart = maintEnd ? new Date(maintEnd) : now;
    const campaignEnd = new Date(campaignStart.getTime() + 14 * 24 * 60 * 60 * 1000); // +14日

    // 各キャンペーンパターンを探索
    for (const pattern of CAMPAIGN_PATTERNS) {
      const match = text.match(pattern.regex);
      if (match) {
        const name = pattern.name(match);
        const id = `campaign_${row.id}_${name}`;

        // 重複チェック
        if (!campaigns.some(c => c.id === id)) {
          campaigns.push({
            id,
            name,
            startDate: campaignStart.toISOString(),
            endDate: campaignEnd.toISOString(),
            color: pattern.color,
            icon: pattern.icon,
            source: 'official_news',
            // 元のニュース記事URLをリンクとして保持
            url: row.url ?? null,
          });
        }
      }
    }
  }

  return campaigns;
}

// ───────────────────────────────────────────────────
// メインエクスポート: 全スケジュールを取得して統合
// ───────────────────────────────────────────────────

export async function fetchAllSchedule() {
  // notices.jsonと公式ニュースを並列取得
  const [notices, newsRows] = await Promise.all([
    fetchNotices(),
    fetchMaintenanceNews().catch(e => {
      console.warn('メンテナンス告知取得失敗:', e);
      return [];
    }),
  ]);

  // ── イベント（JP専用: arona-archive）──
  const events = (notices.events ?? [])
    .map((e, i) => ({
      id: e.id,
      title: e.title,
      type: e.title.includes('復刻') ? '復刻イベント' : 'ストーリーイベント',
      startDate: toIso(e.startsAt),
      endDate: toIso(e.endsAt),
      description: '',
      url: e.url,
      bannerColor: PALETTE[i % PALETTE.length],
    }))
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  // ── ガチャ（JP専用: arona-archive）──
  const gachas = (notices.pickUps ?? [])
    .map(e => ({
      id: e.id,
      bannerName: e.title,
      typeLabel: e.title.includes('復刻') ? '復刻ピックアップ' : '期間限定ピックアップ',
      gachaType: e.title.includes('復刻') ? 'LimitedGacha_Rerun' : 'LimitedGacha',
      pickups: extractPickupStudents(e.title),
      startDate: toIso(e.startsAt),
      endDate: toIso(e.endsAt),
      color: '#FF6699',
      url: e.url,
      source: 'arona',
    }))
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  // ── 総力戦（JP専用: arona-archive）──
  const raidList = (notices.totalAssults ?? [])
    .map(e => ({
      id: e.id,
      displayName: e.title,
      type: '総力戦',
      isGrand: false,
      terrain: extractTerrain(e.title),
      armor: '—',
      startAt: toIso(e.startsAt),
      endAt: toIso(e.endsAt),
      url: e.url,
      source: 'arona',
    }))
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  // ── 大決戦（JP専用: arona-archive）──
  const eliminateList = (notices.eliminateRaid ?? [])
    .map(e => ({
      id: e.id,
      displayName: e.title,
      type: '大決戦',
      isGrand: true,
      terrain: extractTerrain(e.title),
      armor: '—',
      startAt: toIso(e.startsAt),
      endAt: toIso(e.endsAt),
      url: e.url,
      source: 'arona',
    }))
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  // ── 合同火力演習（JP専用: arona-archive）──
  const jointList = (notices.jointExcercises ?? [])
    .map(e => ({
      id: e.id,
      displayName: e.title,
      type: '合同火力演習',
      isGrand: false,
      terrain: extractTerrain(e.title),
      armor: '—',
      startAt: toIso(e.startsAt),
      endAt: toIso(e.endsAt),
      url: e.url,
      source: 'arona',
    }))
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  // ── 制約解除決戦（JP専用: arona-archive）──
  const multiFloorList = (notices.multiFloorRaid ?? [])
    .map(e => ({
      id: e.id,
      displayName: e.title,
      type: '制約解除決戦',
      isGrand: false,
      terrain: '—',
      armor: '—',
      startAt: toIso(e.startsAt),
      endAt: toIso(e.endsAt),
      url: e.url,
      source: 'arona',
    }))
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  // 全レイド系をまとめて降順ソート
  const raids = [...raidList, ...eliminateList, ...jointList, ...multiFloorList]
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt));

  // ── キャンペーン（JP公式ニュースAPIのメンテナンス告知からパース）──
  const campaigns = parseCampaignsFromNews(newsRows)
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  return { events, gachas, campaigns, raids };
}

// ───────────────────────────────────────────────────
// ヘルパー関数
// ───────────────────────────────────────────────────

/** タイトルから地形情報を抽出 */
function extractTerrain(title) {
  if (title.includes('屋外戦')) return '屋外戦';
  if (title.includes('屋内戦')) return '屋内戦';
  if (title.includes('市街地戦')) return '市街地戦';
  return '—';
}

/** ガチャタイトルからピックアップ生徒名を抽出 */
function extractPickupStudents(title) {
  // 例: "【ピックアップ募集】★3「ニコ」「クルミ」" → ["ニコ", "クルミ"]
  const matches = [...title.matchAll(/「([^」]+)」/g)];
  const students = matches.map(m => m[1]);
  if (students.length > 0) return students;
  // フォールバック: ★3以降のテキスト
  const fallback = title.replace(/【[^】]+】\s*/, '').replace(/★\d\s*/g, '').trim();
  return [fallback || title];
}

/**
 * groupBannersByPeriod（後方互換用）
 * ennead.cc非公式APIは廃止したが、呼び出し側との互換性を維持
 */
export function groupBannersByPeriod(banners) {
  const groups = {};
  for (const banner of banners ?? []) {
    const key = `${banner.start}_${banner.end}`;
    if (!groups[key]) {
      groups[key] = {
        id: key,
        bannerName: banner.type ?? '期間限定',
        typeLabel: '期間限定ピックアップ',
        gachaType: 'LimitedGacha',
        pickups: [],
        startDate: banner.start ? new Date(banner.start * 1000).toISOString() : new Date().toISOString(),
        endDate: banner.end ? new Date(banner.end * 1000).toISOString() : new Date().toISOString(),
        color: '#FF6699',
        source: 'unofficial',
      };
    }
    if (banner.characters?.length) {
      groups[key].pickups.push(...banner.characters.map(c => c.name ?? c));
    }
  }
  return Object.values(groups);
}
