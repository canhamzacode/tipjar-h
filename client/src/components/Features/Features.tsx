import { Zap, ShieldCheck, Coins, Heart } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Zap,
      title: 'Fast & Seamless',
      desc: 'Send or receive tokens instantly no extra steps, no friction.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Wallets',
      desc: 'Built with your privacy and safety in mind, every time.',
    },
    {
      icon: Coins,
      title: 'Flexible Tokens',
      desc: 'Support with any token of your choice HBAR or other tokens.',
    },
    {
      icon: Heart,
      title: 'Community Driven',
      desc: 'Built for creators, fans, and kind humans who value appreciation.',
    },
  ];

  return (
    <section id="features" className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-primary bg-blue-50 px-4 py-2 rounded-full">
              FEATURES
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Get Started
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to make giving and receiving appreciation
            seamless
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group bg-white p-8 rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start gap-6">
                {/* Icon Container */}
                <div className="flex-shrink-0 w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                  <feature.icon size={32} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Optional: CTA at bottom */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            Want to see more?{' '}
            <a
              href="#contact"
              className="text-primary font-semibold hover:underline"
            >
              Get in touch
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
