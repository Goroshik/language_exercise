'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import 'src/app/globals.css';
import Header from 'src/components/Header';
import LoadingOverlay from 'src/components/LoadingOverlay';
import { useAppStore } from 'src/store/appStore';

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { state, isNavigating, setIsNavigating, setState } = useAppStore();

  // Reset navigation state when route changes
  useEffect(() => {
    setIsNavigating(false);
    setState('topics-loaded');
  }, [pathname, setIsNavigating, setState]);

  const isLoading = state === 'loading-exercises' || state === 'loading-topics' || isNavigating;

  console.log(state, isNavigating);

  return (
    <>
      <Header />
      <div className="global-container">{children}</div>
      <LoadingOverlay open={isLoading} message={isNavigating ? 'Переход...' : 'Загрузка...'} />
    </>
  );
}
