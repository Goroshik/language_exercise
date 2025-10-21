'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from 'src/components/Header';
import LoadingOverlay from 'src/components/LoadingOverlay';
import { useAppStore } from 'src/store/appStore';
import 'src/app/globals.css';

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { state, isNavigating, setIsNavigating } = useAppStore();

  // Reset navigation state when route changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, setIsNavigating]);

  const isLoading = state === 'loading-exercises' || state === 'loading-topics' || isNavigating;

  return (
    <>
      <Header />
      <div className="global-container">{children}</div>
      <LoadingOverlay open={isLoading} message={isNavigating ? 'Переход...' : 'Загрузка...'} />
    </>
  );
}
