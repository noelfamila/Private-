import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import EventCard from './components/EventCard';
import GachaCard from './components/GachaCard';
import CampaignCard from './components/CampaignCard';
import RaidCard from './components/RaidCard';
import LoadingSpinner from './components/LoadingSpinner';
import { fetchBanners, fetchRaids, fetchAllSchedule, groupBannersByPeriod } from './api/baApi';
import { isEnded } from './utils/dataUtils';
import './App.css';
import { Megaphone, Star, Zap, Swords, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react';

function App() {
  // ──────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────
  const [bannerData, setBannerData] = useState(null);
  const [raidData, setRaidData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null); // 公式ニュースから解析
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // 終了済みを非表示にするフィルター
  const [hideEnded, setHideEnded] = useState(true);

  // ──────────────────────────────────────────────
  // APIフェッチ
  // ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrors({});

    const newErrors = {};

    // 3つのAPIを並列取得（一部失敗しても残りを表示）
    const [bannerResult, raidResult, scheduleResult] = await Promise.allSettled([
      fetchBanners(),
      fetchRaids(),
      fetchAllSchedule(),
    ]);

    if (bannerResult.status === 'fulfilled') {
      setBannerData(bannerResult.value);
    } else {
      newErrors.banner = bannerResult.reason?.message;
      console.warn('バナー取得失敗:', bannerResult.reason);
    }

    if (raidResult.status === 'fulfilled') {
      setRaidData(raidResult.value);
    } else {
      newErrors.raid = raidResult.reason?.message;
      console.warn('レイド取得失敗:', raidResult.reason);
    }

    if (scheduleResult.status === 'fulfilled') {
      setScheduleData(scheduleResult.value);
    } else {
      newErrors.schedule = scheduleResult.reason?.message;
      console.warn('スケジュール取得失敗:', scheduleResult.reason);
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

  // ガチャ: 公式ニュース解析 + 非公式API をマージ（重複除去）
  const allGachaGroups = React.useMemo(() => {
    const groups = [];
    const seenKeys = new Set();

    // 1. 公式ニュース解析ガチャ
    for (const g of scheduleData?.gachas ?? []) {
      const key = g.bannerName;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        groups.push({ ...g, id: key });
      }
    }

    // 2. 非公式APIガチャ（公式で取得できなかった場合の補完）
    if (bannerData) {
      const apiGroups = groupBannersByPeriod([
        ...(bannerData.current ?? []),
        ...(bannerData.upcoming ?? []),
        ...(bannerData.ended ?? []),
      ]);
      for (const g of apiGroups) {
        // 同一期間・同一生徒のガチャが既にあれば追加しない（簡易重複判定）
        const key = `api_${g.startDate}_${g.endDate}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          groups.push(g);
        }
      }
    }

    return groups.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [scheduleData, bannerData]);

  // 総力戦: 公式ニュース解析 + 非公式API をマージ
  const allRaids = React.useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    // 1. 公式ニュース解析の総力戦・大決戦
    for (const r of scheduleData?.raids ?? []) {
      const key = `${r.displayName}_${r.startAt}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        list.push(r);
      }
    }

    // 2. 非公式APIレイド（補完）
    if (raidData) {
      const apiRaids = [
        ...(raidData.current ?? []),
        ...(raidData.upcoming ?? []),
        ...(raidData.ended ?? []),
      ];
      for (const r of apiRaids) {
        const key = `api_${r.boss}_${r.startAt}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({ ...r, source: 'unofficial' });
        }
      }
    }

    return list.sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
  }, [scheduleData, raidData]);

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
            データ: arona-archive / api.ennead.cc
          </span>
        </div>

        {/* ── エラー表示 ── */}
        {hasErrors && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            <span>
              一部データの取得に失敗しました:
              {errors.schedule ? ' [公式スケジュール]' : ''}
              {errors.banner ? ' [ガチャ]' : ''}
              {errors.raid ? ' [総力戦]' : ''}
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
              {loading && !scheduleData && !bannerData ? (
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
          &nbsp;/&nbsp;
          <a href="https://api.ennead.cc/buruaka" target="_blank" rel="noreferrer">api.ennead.cc</a>
        </span>
      </footer>
    </div>
  );
}

export default App;
