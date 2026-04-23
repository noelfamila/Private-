import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import EventCard from './components/EventCard';
import GachaCard from './components/GachaCard';
import CampaignCard from './components/CampaignCard';
import RaidCard from './components/RaidCard';
import LoadingSpinner from './components/LoadingSpinner';
import { fetchAllSchedule } from './api/baApi';
import { isEnded } from './utils/dataUtils';
import './App.css';
import { Megaphone, Star, Zap, Swords, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react';

function App() {
  // ──────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────
  const [scheduleData, setScheduleData] = useState(null); // 公式ニュース・arona-archiveから解析
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // 終了済みを非表示にするフィルター（LocalStorageで状態を保存）
  const [hideEnded, setHideEnded] = useState(() => {
    const saved = localStorage.getItem('ba-tracker-hide-ended');
    // 保存された設定がなければデフォルトは true
    return saved !== null ? JSON.parse(saved) : true;
  });

  // hideEnded が変更されたら LocalStorage に保存
  useEffect(() => {
    localStorage.setItem('ba-tracker-hide-ended', JSON.stringify(hideEnded));
  }, [hideEnded]);

  // ──────────────────────────────────────────────
  // APIフェッチ
  // ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrors({});

    const newErrors = {};

    const scheduleResult = await fetchAllSchedule().catch(e => {
      console.warn('スケジュール取得失敗:', e);
      newErrors.schedule = e.message;
      return null;
    });

    if (scheduleResult) {
      setScheduleData(scheduleResult);
    }

    setErrors(newErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ──────────────────────────────────────────────
  // データ統合・整形
  // ──────────────────────────────────────────────

  // ガチャ
  const allGachaGroups = scheduleData?.gachas ?? [];

  // 総力戦・大決戦・制約解除決戦・合同火力演習
  const allRaids = scheduleData?.raids ?? [];

  // イベント・キャンペーン（公式ニュース解析）
  const allEvents = scheduleData?.events ?? [];
  const allCampaigns = scheduleData?.campaigns ?? [];

  // ──────────────────────────────────────────────
  // フィルタリング
  // ──────────────────────────────────────────────
  const filteredEvents = hideEnded
    ? allEvents.filter(e => !isEnded(e.endDate))
    : allEvents;

  const filteredCampaigns = hideEnded
    ? allCampaigns.filter(c => !isEnded(c.endDate))
    : allCampaigns;

  const filteredGachaGroups = hideEnded
    ? allGachaGroups.filter(g => !isEnded(g.endDate))
    : allGachaGroups;

  const filteredRaids = hideEnded
    ? allRaids.filter(r => !isEnded(r.endAt))
    : allRaids;

  const hasErrors = Object.keys(errors).length > 0;

  // ──────────────────────────────────────────────
  // UI
  // ──────────────────────────────────────────────
  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        {/* ── フィルターツールバー ── */}
        <div className="toolbar">
          <button
            className={`filter-btn ${hideEnded ? 'active' : ''}`}
            onClick={() => setHideEnded(v => !v)}
            id="filter-hide-ended"
          >
            <EyeOff size={16} />
            {hideEnded ? '終了済みを非表示中' : '終了済みも表示'}
          </button>

          <button
            className="reload-btn"
            onClick={loadData}
            disabled={loading}
            id="btn-reload"
            title="APIデータを再取得する"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            更新
          </button>

          {/* データソース表示 */}
          <span className="data-source-label">
            データ: arona-archive / 公式ニュース
          </span>
        </div>

        {/* ── エラー表示 ── */}
        {hasErrors && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            <span>
              スケジュールデータの取得に失敗しました。時間をおいて再読み込みしてください。
            </span>
          </div>
        )}

        {/* ── ダッシュボードグリッド ── */}
        <div className="dashboard-grid">
          {/* 左カラム: イベント & ガチャ */}
          <div className="left-column">
            {/* イベント */}
            <section className="section">
              <h2 className="section-title">
                <Megaphone size={20} color="var(--ba-primary)" />
                開催中のイベント
              </h2>
              {loading && !scheduleData ? (
                <LoadingSpinner label="イベント情報を取得中..." />
              ) : filteredEvents.length === 0 ? (
                <p className="empty-msg">
                  {scheduleData
                    ? '現在開催中のイベントはありません'
                    : '公式ニュースから情報を取得できませんでした'}
                </p>
              ) : (
                filteredEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </section>

            {/* ガチャ */}
            <section className="section" style={{ marginTop: '28px' }}>
              <h2 className="section-title">
                <Star size={20} color="var(--ba-accent-pink)" />
                ピックアップ募集
              </h2>
              {loading && !scheduleData ? (
                <LoadingSpinner label="ガチャ情報を取得中..." />
              ) : filteredGachaGroups.length === 0 ? (
                <p className="empty-msg">現在開催中のピックアップはありません</p>
              ) : (
                <div className="gacha-grid">
                  {filteredGachaGroups.map(group => (
                    <GachaCard key={group.id} group={group} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 右カラム: キャンペーン & 総力戦 */}
          <div className="right-column">
            {/* キャンペーン */}
            <section className="section">
              <h2 className="section-title">
                <Zap size={20} color="#FFD700" />
                開催中のキャンペーン
              </h2>
              {loading && !scheduleData ? (
                <LoadingSpinner label="キャンペーン情報を取得中..." />
              ) : filteredCampaigns.length === 0 ? (
                <p className="empty-msg">現在開催中のキャンペーンはありません</p>
              ) : (
                <CampaignCard campaigns={filteredCampaigns} />
              )}
            </section>

            {/* 総力戦・大決戦・制約解除決戦 */}
            <section className="section" style={{ marginTop: '28px' }}>
              <h2 className="section-title">
                <Swords size={20} color="var(--ba-text-sub)" />
                総力戦 / 大決戦 / 制約解除決戦
              </h2>
              {loading && !scheduleData ? (
                <LoadingSpinner label="レイド情報を取得中..." />
              ) : filteredRaids.length === 0 ? (
                <p className="empty-msg">現在開催中の総力戦・大決戦・制約解除決戦はありません</p>
              ) : (
                <RaidCard raids={filteredRaids} />
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <span>
          データ提供:&nbsp;
          <a href="https://github.com/arona-archive/blue-archive-event-calendar" target="_blank" rel="noreferrer">arona-archive</a>
          &nbsp;/&nbsp;ブルーアーカイブ公式ニュース
        </span>
      </footer>
    </div>
  );
}

export default App;
