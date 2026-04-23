import React from 'react';

/**
 * ローディングスピナーコンポーネント
 */
export default function LoadingSpinner({ label = "読み込み中..." }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <span className="loading-label">{label}</span>
    </div>
  );
}
