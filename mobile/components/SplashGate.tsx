import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedSplash } from './AnimatedSplash';

type Phase = 'waiting' | 'showing' | 'done';

/**
 * Hides the native splash only after auth state is restored, then shows
 * the animated splash overlay once. Animation runs only on cold app start.
 */
export function SplashGate({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>('waiting');

  useEffect(() => {
    if (authLoading) return;
    if (phase !== 'waiting') return;

    SplashScreen.hideAsync();
    setPhase('showing');
  }, [authLoading, phase]);

  const handleSplashFinish = () => setPhase('done');

  return (
    <>
      {children}
      {phase === 'showing' && (
        <AnimatedSplash onFinish={handleSplashFinish} />
      )}
    </>
  );
}
