import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type PendingDelivery = {
  deliveryAddress: string;
  deliveryMapsLink: string;
} | null;

type PendingDeliveryContextType = {
  pending: PendingDelivery;
  setPendingFromMap: (deliveryAddress: string, deliveryMapsLink: string) => void;
  takePending: () => PendingDelivery;
};

const Context = createContext<PendingDeliveryContextType | undefined>(undefined);

export function PendingDeliveryProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingDelivery>(null);

  const setPendingFromMap = useCallback((deliveryAddress: string, deliveryMapsLink: string) => {
    setPending({ deliveryAddress, deliveryMapsLink });
  }, []);

  const takePending = useCallback(() => {
    const value = pending;
    setPending(null);
    return value;
  }, [pending]);

  return (
    <Context.Provider value={{ pending, setPendingFromMap, takePending }}>
      {children}
    </Context.Provider>
  );
}

export function usePendingDelivery() {
  const ctx = useContext(Context);
  if (ctx === undefined) throw new Error('usePendingDelivery must be used within PendingDeliveryProvider');
  return ctx;
}
