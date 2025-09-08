import { useState } from 'react'
import { createPortal } from 'react-dom'
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

      {isOpen && createPortal(
        <div className="lg:hidden">
          {/* Full screen backdrop */}
          <div 
            className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50"
            onClick={closeMenu}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              zIndex: 2147483646,
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
          />
          
          {/* Full screen menu */}
          <div 
            className="fixed inset-0 w-full h-full flex flex-col"
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              width: '100vw',
              height: '100vh',
              backgroundColor: '#ffffff',
              zIndex: 2147483647,
              opacity: 1
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200" style={{ backgroundColor: '#ffffff', opacity: 1 }}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-medium">
                  {user?.Username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-lg">{user?.Username || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.Email || 'user@example.com'}</p>
                </div>
              </div>
              <button
                onClick={closeMenu}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 p-6" style={{ backgroundColor: '#ffffff', opacity: 1 }}>
              <div className="space-y-4">
                <Link
                  to="/repertoires"
                  onClick={closeMenu}
                  className={`block px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                    location.pathname.startsWith('/repertoire')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Repertoires
                </Link>
                <Link
                  to="/train"
                  onClick={closeMenu}
                  className={`block px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                    location.pathname === '/train'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Train
                </Link>
              </div>
            </nav>
            
            {/* Footer */}
            <div className="p-6 border-t border-gray-200" style={{ backgroundColor: '#ffffff', opacity: 1 }}>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-3 text-lg font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}