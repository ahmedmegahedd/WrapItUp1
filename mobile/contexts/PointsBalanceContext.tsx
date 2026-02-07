import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLoyaltyBalance } from '@/lib/api';

type PointsBalanceContextType = {
  balance: number | null;
  refetch: () => Promise<void>;
};

const PointsBalanceContext = createContext<PointsBalanceContextType | undefined>(undefined);

export function PointsBalanceProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const accountEmail = session?.user?.email ?? null;
  const [balance, setBalance] = useState<number | null>(null);

  const refetch = useCallback(async () => {
    if (!accountEmail) {
      setBalance(null);
      return;
    }
    try {
      const b = await getLoyaltyBalance(accountEmail);
      setBalance(b.points_balance);
    } catch {
      setBalance(null);
    }
  }, [accountEmail]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <PointsBalanceContext.Provider value={{ balance, refetch }}>
      {children}
    </PointsBalanceContext.Provider>
  );
}

export function usePointsBalance() {
  const ctx = useContext(PointsBalanceContext);
  if (ctx === undefined) throw new Error('usePointsBalance must be used within PointsBalanceProvider');
  return ctx;
}
