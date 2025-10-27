import Link from 'next/link';
import { Twitter, Check } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui/button';

const Hero = () => {
  return (
    <section className="w-full min-h-[70vh] px-6">
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 grid-cols-1 py-6 gap-5">
        <div className="flex items-center">
          <div className="flex flex-col gap-4">
            <h1 className="md:text-5xl text-4xl font-bold text-primary md:leading-[60px] leading-[35px]">
              TipJar Send Tokens <br /> Spread Kindness
            </h1>
            <div className="mt-4 ">
              <p className="text-lg  text-gray-700">
                Seamlessly send and receive micro or macro tips with <br /> your
                Twitter community. Fast, friendly, and built on trust.
              </p>
              <Button size="lg" className="text-lg mt-6">
                <Twitter />
                Get Started
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[1200px] mx-auto md:mt-10 mt-4">
          <Image
            src="/tipJarApp.png"
            width={1200}
            height={400}
            alt="App Screenshot"
            className="rounded-2xl shadow-md border"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
