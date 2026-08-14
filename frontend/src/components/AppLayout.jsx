import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PageHeader from './PageHeader';
import TopNav from './TopNav';
import StatusCards from './StatusCards';

export default function AppLayout() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="app-shell">
      <TopNav />
      <main className="main-content">
        <PageHeader onRefresh={() => setRefreshKey((key) => key + 1)} />
        <StatusCards refreshKey={refreshKey} />
        <Outlet />
      </main>
    </div>
  );
}
