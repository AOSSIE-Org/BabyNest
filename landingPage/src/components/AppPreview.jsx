import { CheckCircle2, MessageSquare, Calendar as CalendarIcon } from 'lucide-react';

function AppPreview() {
  return (
    <section id="preview" className="py-24 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Experience the
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-pink-400">
              BabyNest Difference
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A beautifully designed interface that makes pregnancy planning effortless and enjoyable.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-start space-x-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Stay Organized</h3>
                <p className="text-gray-400">
                  Keep track of all your appointments, tests, and healthcare requirements in one intuitive dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-pink-500/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-pink-500 to-rose-500 flex items-center justify-center shrink-0">
                <MessageSquare size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">AI Chat Assistant</h3>
                <p className="text-gray-400">
                  Ask questions anytime and get instant, personalized responses from our intelligent AI assistant.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                <CalendarIcon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Smart Calendar</h3>
                <p className="text-gray-400">
                  View all your pregnancy milestones and appointments in a beautiful, easy-to-use calendar interface.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 to-pink-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-2xl">
                <div className="bg-gray-900 rounded-2xl p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-400 to-pink-400"></div>
                      <div>
                        <div className="text-white font-semibold">Sarah's Journey</div>
                        <div className="text-gray-400 text-sm">Week 24 - Second Trimester</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-emerald-400 text-sm font-semibold">Upcoming</span>
                        <span className="text-gray-400 text-xs">Tomorrow</span>
                      </div>
                      <div className="text-white font-medium">Glucose Screening Test</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-pink-400 text-sm font-semibold">Reminder</span>
                        <span className="text-gray-400 text-xs">Week 26</span>
                      </div>
                      <div className="text-white font-medium">Prenatal Checkup</div>
                    </div>
                  </div>
                </div>
                <div className="bg-linear-to-br from-emerald-500 to-pink-500 rounded-2xl p-6 text-white">
                  <div className="text-sm font-semibold mb-2">AI Tip of the Day</div>
                  <div className="text-sm opacity-90">
                    Stay hydrated! Aim for 8-10 glasses of water daily to support your baby's development.
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

export default AppPreview;
