import React from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { isEnded, isOngoing } from '../utils/dataUtils';

function formatDate(dateStr) {
  const opts = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateStr).toLocaleDateString('ja-JP', opts);
}

/**
 * キャンペーン（2倍イベント等）カードコンポーネント
 */
export default function CampaignCard({ campaigns }) {
  return (
    <div className="campaign-list">
      {campaigns.map((camp) => {
        const ongoing = isOngoing(camp.startDate, camp.endDate);
        const ended = isEnded(camp.endDate);
        const diffMs = new Date(camp.endDate) - new Date();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        return (
          <div
            key={camp.id}
            className={`card campaign-item fade-in ${ended ? 'card-ended' : ''}`}
            style={{ '--campaign-color': camp.color }}
          >
            <div className="campaign-icon" style={{ color: camp.color }}>
              {camp.icon ?? <Sparkles size={20} />}
            </div>
            <div className="campaign-details">
              <div className="campaign-name-row">
                <span className="campaign-name">{camp.name}</span>
                {ongoing && <span className="status-badge status-ongoing">開催中</span>}
                {!ongoing && !ended && <span className="status-badge status-upcoming">予定</span>}
                {ended && <span className="status-badge status-ended">終了</span>}
              </div>
              <div className="card-footer" style={{ marginTop: '6px' }}>
                <span className="date-badge">
                  <Calendar size={13} />
                  {formatDate(camp.startDate)} 〜 {formatDate(camp.endDate)}
                </span>
                {ongoing && diffDays > 0 && (
                  <span className="days-remaining">残り {diffDays} 日</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
