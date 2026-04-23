import React from 'react';
import { ShieldAlert, Map, Calendar } from 'lucide-react';
import { isEnded, isOngoing, resolveBossInfo } from '../utils/dataUtils';

function formatDate(dateStr) {
  const opts = { month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('ja-JP', opts);
}

/**
 * 総力戦・大決戦カードコンポーネント
 * 公式ニュース解析データ（displayName/terrain/armor）と
 * 非公式APIデータ（boss）両方に対応する
 */
export default function RaidCard({ raids }) {
  return (
    <div className="raid-list">
      {raids.map((raid, index) => {
        const ongoing = isOngoing(raid.startAt, raid.endAt);
        const ended = isEnded(raid.endAt);
        const diffMs = new Date(raid.endAt) - new Date();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const isGrand = raid.isGrand ?? false;

        // 公式ニュース解析データ優先、なければ非公式APIのboss名を解決
        let bossName, terrain, armor;
        if (raid.displayName) {
          bossName = raid.displayName;
          terrain = raid.terrain ?? '不明';
          armor = raid.armor ?? '不明';
        } else {
          const info = resolveBossInfo(raid.boss ?? '');
          bossName = info.name;
          terrain = info.terrain;
          armor = info.armor;
        }

        return (

          <React.Fragment key={raid.id}>
            <div className={`card raid-item fade-in ${ended ? 'card-ended' : ''}`}
              style={{ borderLeft: `4px solid ${isGrand ? 'var(--ba-accent-pink)' : 'var(--ba-primary)'}` }}>

              <div className="raid-header">
                <h3 className="raid-boss-name">{bossName}</h3>
                <div className="raid-badges">
                  <span className={`raid-type-badge ${isGrand ? 'grand' : ''}`}>
                    {isGrand ? '大決戦' : '総力戦'}
                  </span>
                  {ongoing && <span className="status-badge status-ongoing">開催中</span>}
                  {!ongoing && !ended && <span className="status-badge status-upcoming">予定</span>}
                  {ended && <span className="status-badge status-ended">終了</span>}
                </div>
              </div>

              <div className="raid-info">
                <div className="raid-info-item">
                  <Map size={14} />
                  <span>{terrain}</span>
                </div>
                <div className="raid-info-item">
                  <ShieldAlert size={14} />
                  <span>{armor}</span>
                </div>
              </div>

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
