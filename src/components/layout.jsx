import { useState, useEffect } from 'react'
import { getUser, setUser, removeUser } from '@/lib/storage'
import { getCurrentUser, logout } from '@/api/auth'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { LogOut, User, Settings } from 'lucide-react'
import HamburgerMenu from './hamburger-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Layout() {
  const [user, setCurrentUser] = useState(getUser());
  const location = useLocation();
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setCurrentUser(userData.user);
        setUser(userData.user);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        removeUser();
        setCurrentUser(null);
      }
    };

    if (!user) {
      fetchUser();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <img src="/logo.svg" className="size-10" />
            <Link to="/" className="hover:text-foreground/80 transition-colors">
              <h1 className="text-xl font-bold">Chesso</h1>
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              to="/repertoires"
              className={`text-sm font-medium transition-colors hover:text-foreground/80 relative ${
                location.pathname.startsWith('/repertoire') 
                  ? 'text-foreground after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full' 
                  : 'text-foreground/60'
              }`}
            >
              Repertoires
            </Link>
            <Link 
              to="/train"
              className={`text-sm font-medium transition-colors hover:text-foreground/80 relative ${
                location.pathname === '/train' 
                  ? 'text-foreground after:absolute after:bottom-[-6px] after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full' 
                  : 'text-foreground/60'
              }`}
            >
              Train
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-3">
            {/* Desktop User Dropdown */}
            <div className="hidden lg:block">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {user.Username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-medium">{user.Username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.Username}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.Email || 'user@example.com'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem disabled>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* Mobile Hamburger Menu */}
            <HamburgerMenu user={user} />
          </div>
        </div>
      </header>
      <main className="container mx-auto flex-grow">
        <Outlet />
      </main>
      <footer className="bg-zinc-900 text-gray-300 py-6 mt-auto border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="mb-2 md:mb-0">© 2025 Chesso. Open Source Chess Opening Repertoire Tool.</p>
          <a
            href="https://www.buymeacoffee.com/doder"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              style={{height: '35px', width: '132px'}}
            />
          </a>
        </div>
      </footer>
    </div>
  )
}
