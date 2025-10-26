'use client';
import Link from 'next/link';
import { HelpingHand, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthQueries } from '@/api';

export default function Navbar() {
  const { mutateAsync: initiateTwitterAuth } =
    AuthQueries.useInitateTwitterOath();

  const handleInitiateTwitterAuth = async () => {
    const res = await initiateTwitterAuth();

    if (res?.data?.url) {
      window.location.href = res.data.url;
    }
  };

  const Links = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/#features' },
    { name: 'About', href: '/#about' },
    { name: 'Contact', href: '/#contact' },
  ];

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur">
      <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="cursor-pointer flex items-center gap-2">
            <button className="flex items-center gap-4 h-14 w-14 bg-primary text-white justify-center rounded-full">
              <HelpingHand size={30} />
            </button>
            <span className="text-xl text-primary font-bold">TipJar</span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            {Links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-gray-600 hover:text-primary font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-sm text-slate-600">
            <div className="px-3 py-1 rounded-full bg-slate-100">
              Twitter:{' '}
              <span className="font-medium ml-1 text-slate-800">
                Not connected
              </span>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-100">
              Wallet:{' '}
              <span className="font-medium ml-1 text-slate-800">
                Not connected
              </span>
            </div>
          </div>

          <Button onClick={handleInitiateTwitterAuth}>
            <Twitter />
            Connect
          </Button>
        </div>
      </div>
    </nav>
  );
}
