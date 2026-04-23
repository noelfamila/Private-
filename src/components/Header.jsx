import React from 'react';
import { LayoutDashboard } from 'lucide-react';

export default function Header() {
  return (
    <header className="header">
      <div className="header-title">
        <LayoutDashboard size={28} />
        <span>Blue Archive Info Tracker</span>
      </div>
    </header>
  );
}
