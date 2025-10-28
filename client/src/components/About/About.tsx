import Image from 'next/image';

const About = () => {
  return (
    <section id="about" className="py-20 px-6 bg-primary">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="relative">
              <Image
                src="/community-support.avif"
                alt="Community supporting creators"
                width={600}
                height={500}
                className="rounded-3xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              About TipJar
            </h2>
            <p className="text-blue-50 text-lg leading-relaxed mb-6">
              TipJar is built to empower creators and communities to appreciate
              each other effortlessly. Whether it&apos;s a thoughtful reply, an
              amazing design, or a random act of kindness — send love instantly
              through tokens and let generosity flow across the web.
            </p>
            <p className="text-blue-100 text-base leading-relaxed">
              We believe that appreciation should be simple, immediate, and
              meaningful. Join thousands of creators who are building stronger
              connections with their communities.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
