import Link from 'next/link';
import { Twitter, Github, Mail, HelpingHand } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#howitworks' },
    { name: 'About', href: '#about' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Support', href: '#' },
  ];

  return (
    <footer id="contact" className="bg-primary text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Link href="#home" className="flex items-center gap-3 mb-4 group">
              <div className="flex items-center justify-center h-12 w-12 bg-primary rounded-2xl shadow-lg group-hover:scale-105 transition-transform">
                <HelpingHand size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold">TipJar</span>
            </Link>
            <p className=" leading-relaxed mb-6 max-w-sm">
              Empowering digital generosity one tip at a time. Built for
              creators, by creators who believe in the power of appreciation.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white hover:underline transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex gap-3 text-black">
              <Link
                href="https://twitter.com"
                target="_blank"
                aria-label="Twitter"
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center transition-all duration-300"
              >
                <Twitter size={20} />
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                aria-label="GitHub"
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center transition-all duration-300"
              >
                <Github size={20} />
              </Link>
              <Link
                href="mailto:hello@tipjar.com"
                aria-label="Email"
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center transition-all duration-300"
              >
                <Mail size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© {new Date().getFullYear()} TipJar. All rights reserved.</p>
            <p>
              Built with ❤️ by{' '}
              <span className="text-white font-semibold">
                Hamzat Abdul-muizz
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
