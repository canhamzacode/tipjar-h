import {
  About,
  Features,
  Footer,
  Hero,
  HowItWorks,
  Navbar,
} from '@/components';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
