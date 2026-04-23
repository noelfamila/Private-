import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { isOngoing, isEnded } from '../utils/dataUtils';

/**
 * 日付を日本語表示にフォーマットする
 */
function formatDate(dateStr) {
  const opts = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateStr).toLocaleDateString('ja-JP', opts);
}

/**
 * イベントカードコンポーネント
 */
export default function EventCard({ event }) {
  const ongoing = isOngoing(event.startDate, event.endDate);
  const ended = isEnded(event.endDate);

  // 残り日数計算
  const diffMs = new Date(event.endDate) - new Date();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return (
    <div className={`card event-card fade-in ${ended ? 'card-ended' : ''}`}>
      {/* バナー画像の代わりにグラデーション背景 */}
      <div className="event-banner" style={{ background: event.bannerColor }}>
        <div className="event-banner-content">
          <span className="event-type-badge">{event.type}</span>
          {ongoing && (
            <span className="status-badge status-ongoing">開催中</span>
          )}
          {!ongoing && !ended && (
            <span className="status-badge status-upcoming">まもなく開始</span>
          )}
          {ended && (
            <span className="status-badge status-ended">終了</span>
          )}
        </div>
      </div>

      <div className="card-body">
        <h3 className="card-title">{event.title}</h3>
        <p className="card-desc">{event.description}</p>
        <div className="card-footer">
          <span className="date-badge">
            <Calendar size={13} />
            {formatDate(event.startDate)} 〜 {formatDate(event.endDate)}
          </span>
          {ongoing && diffDays > 0 && (
            <span className="days-remaining">残り {diffDays} 日</span>
          )}
        </div>
      </div>
    </div>
  );
}
