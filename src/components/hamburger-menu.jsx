import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
import { Menu, X, LogOut, User } from 'lucide-react'
import { logout } from '@/api/auth'

export default function HamburgerMenu({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  const handleLogout = () => {
    logout()
    closeMenu()
  }

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="relative z-50"
      >
        {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeMenu}
          />
          
          <div className="fixed top-0 right-0 h-full w-64 bg-background border-l border-border shadow-lg z-50 transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-2">
                  <User className="size-4" />
                  <span className="font-medium">{user?.Username || 'User'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMenu}
                >
                  <X className="size-4" />
                </Button>
              </div>
              
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/repertoires"
                      onClick={closeMenu}
                      className="block w-full"
                    >
                      <Button 
                        variant={location.pathname.startsWith('/repertoire') ? 'default' : 'ghost'}
                        className="w-full justify-start"
                      >
                        Repertoires
                      </Button>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/train"
                      onClick={closeMenu}
                      className="block w-full"
                    >
                      <Button 
                        variant={location.pathname === '/train' ? 'default' : 'ghost'}
                        className="w-full justify-start"
                      >
                        Train
                      </Button>
                    </Link>
                  </li>
                </ul>
              </nav>
              
              <div className="p-4 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="size-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}