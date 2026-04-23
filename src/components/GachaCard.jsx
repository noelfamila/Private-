import React from 'react';
import { Calendar, Star, Sparkles } from 'lucide-react';
import { GACHA_TYPE_COLORS } from '../utils/dataUtils';
import { isEnded, isOngoing } from '../utils/dataUtils';

function formatDate(dateStr) {
  const opts = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateStr).toLocaleDateString('ja-JP', opts);
}

/**
 * 同一期間ごとにグループ化されたガチャバナー1件を表示するカード
 */
export default function GachaCard({ group }) {
  const ongoing = isOngoing(group.startDate, group.endDate);
  const ended = isEnded(group.endDate);
  const color = GACHA_TYPE_COLORS[group.gachaType] ?? '#00AEEF';

  // 残り日数
  const diffMs = new Date(group.endDate) - new Date();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return (
    <div className={`card gacha-card fade-in ${ended ? 'card-ended' : ''}`}
      style={{ borderTop: `3px solid ${color}` }}>

      <div className="gacha-header">
        <span className="gacha-type-badge" style={{ background: color }}>
          {group.typeLabel}
        </span>
        {ongoing && <span className="status-badge status-ongoing">開催中</span>}
        {!ongoing && !ended && <span className="status-badge status-upcoming">予定</span>}
        {ended && <span className="status-badge status-ended">終了</span>}
      </div>

      <div className="gacha-pickups">
        {group.pickups.map((name, i) => (
          <div key={i} className="pickup-item">
            <Star size={14} color={color} fill={color} />
            <span>{name}</span>
          </div>
        ))}
      </div>

      <div className="card-footer">
        <span className="date-badge">
          <Calendar size={13} />
          {formatDate(group.startDate)} 〜 {formatDate(group.endDate)}
        </span>
        {ongoing && diffDays > 0 && (
          <span className="days-remaining">残り {diffDays} 日</span>
        )}
      </div>
    </div>
  );
}
