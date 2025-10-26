'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HelpingHand,
  Twitter,
  Wallet,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthQueries } from '@/api';
import { useGetCurrentUser } from '@/hooks';
import { useAuthState } from '@/store';
import TokenManager from '@/utils/cookies';
import { useRouter } from 'next/navigation';

const Auth_Links = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Activity', href: '/activity' },
  { name: 'Settings', href: '/settings' },
];

const NOTAuth_Links = [
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
  const { userData } = useGetCurrentUser();
  const { user, setUser, setIsAuthenticated, isAuthenticated } = useAuthState();

  const handleInitiateTwitterAuth = async () => {
    const res = await initiateTwitterAuth();

    if (res?.data?.url) {
      window.location.href = res.data.url;
    }
  };

  const handleConnectWallet = () => {
    if (!isAuthenticated) {
      return;
    }
    console.log('Connect wallet');
  };

  const handleLogout = async () => {
    TokenManager.removeTokens();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/');
  };

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href.startsWith('/#')) {
      return pathname === '/' && window.location.hash === href.substring(1);
    }
    return pathname.startsWith(href);
  };

  const links = isAuthenticated ? Auth_Links : NOTAuth_Links;

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="cursor-pointer flex items-center gap-2">
            <button className="flex items-center gap-4 h-14 w-14 bg-primary text-white justify-center rounded-full">
              <HelpingHand size={30} />
            </button>
            <span className="text-xl text-primary font-bold">TipJar</span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            {links.map((link) => {
              const active = isActiveLink(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors relative pb-1 ${
                    active ? 'text-primary' : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  {link.name}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={handleConnectWallet}
                        variant="outline"
                        disabled={!isAuthenticated}
                        className="hidden sm:flex gap-2"
                      >
                        <Wallet className="w-4 h-4" />
                        Connect Wallet
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Please connect your Twitter account first</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button onClick={handleInitiateTwitterAuth} className="gap-2">
                <Twitter className="w-4 h-4" />
                Connect Twitter
              </Button>
            </>
          ) : (
            <>
              {!userData?.wallet_address && (
                <Button
                  onClick={handleConnectWallet}
                  variant="outline"
                  className="hidden sm:flex gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </Button>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => router.push('/settings')}
                    >
                      <SettingsIcon className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Logout</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Avatar className="h-9 w-9 border-2 border-slate-200">
                <AvatarImage
                  src={user?.profile_image_url || ''}
                  alt={user?.twitter_handle || 'User'}
                />
                <AvatarFallback className="bg-slate-200 text-slate-700">
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
