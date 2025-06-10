import { Outlet } from 'react-router-dom'
import { Button } from './ui/button'
import { LogOut } from 'lucide-react'
import { logout } from '@/api/auth'
import { Link } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
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
                <li>
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
                </li>
                {/* <li><Button variant="ghost">Profile</Button></li> */}
                {/* <li><Button variant="ghost">Settings</Button></li> */}
                <li className="hidden lg:block">
                  <Link to="/repertoires">
                    <Button variant="ghost">Repertoires</Button>
                  </Link>
                </li>
              </ul>
            </nav>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
