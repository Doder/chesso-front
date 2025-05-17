import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { logout } from '@/api/auth'

export function Navbar() {
  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link to="/" className="font-semibold">
            Chesso
          </Link>
          <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Dashboard
          </Link>
          <Link to="/games" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Games
          </Link>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <User className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
