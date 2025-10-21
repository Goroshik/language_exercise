import Header from 'src/components/Header';
import 'src/app/globals.css';

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <div className="global-container">{children}</div>
    </>
  );
}
