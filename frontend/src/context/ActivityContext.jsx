import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ActivityContext = createContext(null);

const MAX_ENTRIES = 50;

export function ActivityProvider({ children }) {
  const [activities, setActivities] = useState([]);

  const logActivity = useCallback((endpoint, durationMs, status = 'OK') => {
    setActivities((prev) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          endpoint,
          timestamp: new Date(),
          durationMs,
          status,
        },
        ...prev,
      ].slice(0, MAX_ENTRIES),
    );
  }, []);

  const value = useMemo(
    () => ({ activities, logActivity }),
    [activities, logActivity],
  );

  return (
    <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within ActivityProvider');
  }
  return context;
}
