import React from 'react';
import { ShieldAlert, Map, Calendar } from 'lucide-react';
import { isEnded, isOngoing, resolveBossInfo } from '../utils/dataUtils';

function formatDate(dateStr) {
  const opts = { month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('ja-JP', opts);
}

/**
 * レイド種別ごとのバッジスタイル設定
 */
const RAID_TYPE_CONFIG = {
  '総力戦':       { label: '総力戦',       className: 'raid-type-badge sorveil',   borderColor: 'var(--ba-primary)' },
  '大決戦':       { label: '大決戦',       className: 'raid-type-badge grand',      borderColor: 'var(--ba-accent-pink)' },
  '合同火力演習': { label: '合同火力演習', className: 'raid-type-badge joint',      borderColor: '#A855F7' },
  '制約解除決戦': { label: '制約解除決戦', className: 'raid-type-badge multifloor', borderColor: '#F59E0B' },
};

/**
 * 総力戦・大決戦・合同火力演習・制約解除決戦カードコンポーネント
 * arona-archive の notices.json データに対応
 */
export default function RaidCard({ raids }) {
  return (
    <div className="raid-list">
      {raids.map((raid, index) => {
        const ongoing = isOngoing(raid.startAt, raid.endAt);
        const ended = isEnded(raid.endAt);
        const diffMs = new Date(raid.endAt) - new Date();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // レイド種別を取得（arona-archiveの "type" フィールド優先）
        const raidType = raid.type ?? (raid.isGrand ? '大決戦' : '総力戦');
        const typeConfig = RAID_TYPE_CONFIG[raidType] ?? RAID_TYPE_CONFIG['総力戦'];
        const borderColor = typeConfig.borderColor;

        // ボス名・地形・装甲を取得
        // arona-archiveデータは displayName にタイトル全体が入っている
        let bossName, terrain, armor;
        if (raid.displayName) {
          bossName = raid.displayName;
          terrain = (raid.terrain && raid.terrain !== '—') ? raid.terrain : null;
          armor   = (raid.armor   && raid.armor   !== '—') ? raid.armor   : null;
        } else {
          // 旧非公式APIデータの後方互換
          const info = resolveBossInfo(raid.boss ?? '');
          bossName = info.name;
          terrain  = info.terrain !== '不明' ? info.terrain : null;
          armor    = info.armor   !== '不明' ? info.armor   : null;
        }

        return (
          <React.Fragment key={raid.id ?? index}>
            <div
              className={`card raid-item fade-in ${ended ? 'card-ended' : ''}`}
              style={{ borderLeft: `4px solid ${borderColor}` }}
            >
              <div className="raid-header">
                <h3 className="raid-boss-name">{bossName}</h3>
                <div className="raid-badges">
                  <span className={typeConfig.className}>
                    {typeConfig.label}
                  </span>
                  {ongoing && <span className="status-badge status-ongoing">開催中</span>}
                  {!ongoing && !ended && <span className="status-badge status-upcoming">予定</span>}
                  {ended && <span className="status-badge status-ended">終了</span>}
                </div>
              </div>

              {/* 地形・装甲・攻撃タイプは情報がある場合のみ表示 */}
              {(terrain || armor || raid.attackType) && (
                <div className="raid-info">
                  {terrain && (
                    <div className="raid-info-item">
                      <Map size={14} />
                      <span>{terrain}</span>
                    </div>
                  )}
                  {armor && (
                    <div className="raid-info-item">
                      <ShieldAlert size={14} />
                      <span>{armor}</span>
                    </div>
                  )}
                  {raid.attackType && (
                    <div className="raid-info-item raid-attack-type">
                      <span>⚡ {raid.attackType}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="card-footer">
                <span className="date-badge">
                  <Calendar size={13} />
                  {formatDate(raid.startAt)} 〜 {formatDate(raid.endAt)}
                </span>
                {ongoing && diffDays > 0 && (
                  <span className="days-remaining">残り {diffDays} 日</span>
                )}
              </div>
            </div>
            {index < raids.length - 1 && (
              <div style={{ height: '2px', background: 'rgba(0,0,0,0.04)', margin: '0 0 4px' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
