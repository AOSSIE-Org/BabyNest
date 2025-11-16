import { Sparkles, Heart } from 'lucide-react';

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-8">
          <Sparkles size={16} className="text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium">AI-Powered Pregnancy Companion</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Your Journey to Parenthood,
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-pink-400">
            Simplified & Guided
          </span>
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Never miss a crucial appointment or milestone. BabyNest is your intelligent pregnancy planner
          that tracks trimester-specific care, provides country-specific healthcare guidance, and offers
          personalized AI recommendations.
        </p>

     

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="https://github.com/AOSSIE-Org/BabyNest/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30 relative"
            aria-label="Download for iOS - Coming Soon"
          >
            Download for iOS
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              Coming Soon
            </span>
          </a>

          <a
            href="https://github.com/AOSSIE-Org/BabyNest/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 border border-gray-700 relative"
            aria-label="Download for Android - Coming Soon"
          >
            Download for Android
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
               Coming Soon
            </span>
          </a>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          🚧 App launching soon! Click to follow progress on GitHub
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400 mb-2">Our 2025 Goals:</div>
             <div className="text-gray-400 text-xl">is to reach </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">50K+ </div>
            <div className="text-gray-400 text-lg">Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">30+</div>
            <div className="text-gray-400 text-lg">Countries</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart size={24} className="text-pink-400 fill-pink-400" />
            </div>
            <div className="text-gray-400 text-sm">Made with Love!! Trusted by Healthcare Professionals</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
