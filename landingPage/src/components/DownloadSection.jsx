import { Smartphone, Star } from 'lucide-react';

function DownloadSection() {
  return (
    <section id="download" className="py-24 bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-linear-to-b from-emerald-500/10 via-transparent to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-br from-emerald-500 to-pink-500 rounded-3xl p-1">
          <div className="bg-gray-900 rounded-3xl p-12 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center space-x-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-white ml-2 font-semibold">4.9/5 Rating</span>
                </div>

                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                  Ready to Start Your
                  <br />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-pink-400">
                    Pregnancy Journey?
                  </span>
                </h2>

                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Join thousands of expecting parents who trust BabyNest to guide them through every step of their pregnancy with confidence and peace of mind.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3 text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <span>Free to download, no credit card required</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <span>Available on iOS and Android devices</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <span>24/7 AI support whenever you need it</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg">
                    <Smartphone size={20} />
                    <span>Download for iOS
                       <span className="absolute -top-2 -right-2 bg-yellow-400 text-white-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                         Soon
                      </span>
                    </span>
                  </button>
                  <button className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2 border border-gray-700">
                    <Smartphone size={20} />
                    <span>Download for Android
                      <span className="absolute -top-2 -right-2 bg-yellow-400 text-white-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                         Soon
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/30 to-pink-500/30 rounded-full blur-3xl"></div>
                <div className="relative bg-gray-800 rounded-3xl p-8 border border-gray-700">
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-4">📱</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Scan to Download</h3>
                    <p className="text-gray-400">Available on both app stores</p>
                  </div>
                  <div className="bg-white rounded-2xl p-8 mb-6">
                    <div className="aspect-square bg-gray-900 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📲</div>
                        <div className="text-white text-sm">QR Code</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DownloadSection;
