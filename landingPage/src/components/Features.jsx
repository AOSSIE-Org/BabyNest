import { Calendar, Globe, Wifi, Brain, Bell, Shield } from 'lucide-react';

function Features() {
  const features = [
    {
      icon: Calendar,
      title: 'Trimester Tracking',
      description: 'Automated tracking of all trimester-specific medical appointments and milestones tailored to your pregnancy journey.',
      linear: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Globe,
      title: 'Country-Specific Care',
      description: 'Get healthcare requirement notifications customized to your country\'s prenatal care standards and guidelines.',
      linear: 'from-pink-500 to-rose-500'
    },
    {
      icon: Wifi,
      title: 'Offline Access',
      description: 'Access pregnancy care guidelines and your schedule anytime, anywhere, even without an internet connection.',
      linear: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Brain,
      title: 'AI Assistant',
      description: 'Get personalized recommendations, answers to your questions, and intelligent insights powered by advanced AI.',
      linear: 'from-purple-500 to-indigo-500'
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Never miss an appointment with intelligent notifications that adapt to your schedule and preferences.',
      linear: 'from-orange-500 to-amber-500'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your health data is encrypted and secure. We prioritize your privacy with industry-leading security measures.',
      linear: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <section id="features" className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Everything You Need,
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-pink-400">
              All in One Place
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            BabyNest combines cutting-edge technology with healthcare expertise to support you throughout your pregnancy.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${feature.linear} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;
