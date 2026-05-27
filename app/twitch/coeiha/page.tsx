import { AppProvider } from '@/components/AppProvider';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { Ranking } from '@/components/Ranking';
import { Live } from '@/components/Live';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'coeiha — asrus.app',
  description: 'Bata o ponto na live e suba no ranking',
};

export default function Page() {
  return (
    <AppProvider>
      <Header />
      <main>
        <Hero />
        <About />
        <Ranking />
        <Live />
      </main>
      <Footer />
    </AppProvider>
  );
}
