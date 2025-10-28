'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HelpingHand, Twitter, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthQueries } from '@/api';
import { useAuthState } from '@/store';
import TokenManager from '@/utils/cookies';
import { HashConnectButton } from '../HashConnectButton';

const AUTH_LINKS = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Activity', href: '/activity' },
  { name: 'Settings', href: '/settings' },
];

const PUBLIC_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/#features' },
  { name: 'About', href: '/#about' },
  { name: 'Contact', href: '/#contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { mutateAsync: initiateTwitterAuth } =
    AuthQueries.useInitateTwitterOath();
  const { user, setUser, setIsAuthenticated, isAuthenticated } = useAuthState();

  const handleTwitterAuth = async () => {
    const res = await initiateTwitterAuth();
    if (res?.data?.url) window.location.href = res.data.url;
  };

  const handleLogout = () => {
    TokenManager.removeTokens();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) {
      return (
        pathname === '/' &&
        typeof window !== 'undefined' &&
        window.location.hash === href.substring(1)
      );
    }
    return pathname.startsWith(href);
  };

  const links = isAuthenticated ? AUTH_LINKS : PUBLIC_LINKS;

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-14 w-14 bg-primary text-white flex items-center justify-center rounded-full">
              <HelpingHand size={30} />
            </div>
            <span className="text-xl text-primary font-bold">TipJar</span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors relative pb-1 ${
                  isActive(link.href)
                    ? 'text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
              >
                {link.name}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <Button onClick={handleTwitterAuth} className="gap-2">
              <Twitter className="w-4 h-4" />
              Connect Twitter
            </Button>
          ) : (
            <>
              <HashConnectButton />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/settings')}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
              <Avatar className="h-9 w-9 border-2 border-slate-200">
                <AvatarImage
                  src={user?.profile_image_url || ''}
                  alt={user?.twitter_handle || 'User'}
                />
                <AvatarFallback className="bg-slate-200">
                  <HelpingHand className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
