import { useState, useEffect } from 'react'
import { getUser, setUser, removeUser } from '@/lib/storage'
import { getCurrentUser, logout } from '@/api/auth'
import { Outlet, Link} from 'react-router-dom'
import { Button } from './ui/button'
import { LogOut } from 'lucide-react'

export default function Layout() {
  const [user, setCurrentUser] = useState(getUser());
  
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
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <img src="/logo.svg" className="size-12" />
            <Link to="/">
              <h1 className="text-xl font-bold">Chesso</h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <nav>
              <ul className="flex space-x-4">
                {/* <li><Button variant="ghost">Profile</Button></li> */}
                {/* <li><Button variant="ghost">Settings</Button></li> */}
                <li className="hidden lg:block">
                  <Link to="/repertoires">
                    <Button variant="ghost">Repertoires</Button>
                  </Link>
                </li>
              </ul>
            </nav>
            {user && <span className="text-sm font-medium">{user.Username}</span>}
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="size-4" />
            </Button>
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
