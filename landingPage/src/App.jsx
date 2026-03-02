import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import AppPreview from './components/AppPreview';
import DownloadSection from './components/DownloadSection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <Hero />
      <Features />
      <AppPreview />
      <DownloadSection />
      <Footer />
    </div>
  );
}

export default App;
