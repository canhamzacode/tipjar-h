import { Twitter, Wallet, Zap } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      icon: Twitter,
      title: 'Connect Twitter',
      desc: 'Verify your handle so people can tip you by @handle.',
    },
    {
      number: '02',
      icon: Wallet,
      title: 'Connect Wallet',
      desc: 'Link a Hedera wallet to receive tips on-chain.',
    },
    {
      number: '03',
      icon: Zap,
      title: 'Send & Receive',
      desc: 'Send tips instantly or receive them automatically when someone connects.',
    },
  ];

  return (
    <section id="howitworks" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-primary bg-blue-50 px-4 py-2 rounded-full">
              HOW IT WORKS
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start receiving tips in minutes with our streamlined setup process
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector Line (hidden on mobile, shown between cards on desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(100%+1rem)] w-8 h-0.5 bg-gray-200 z-0"></div>
              )}

              {/* Card */}
              <div className="relative bg-white p-8 rounded-3xl border-2 border-gray-100 hover:border-primary hover:shadow-xl transition-all duration-300">
                {/* Step Number */}
                <div className="absolute -top-4 left-8 bg-primary text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                  <step.icon size={32} strokeWidth={2} />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 text-lg">
            Ready to start?{' '}
            <a
              href="#contact"
              className="text-primary font-semibold hover:underline"
            >
              Create your TipJar now
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
