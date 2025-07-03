import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { logout, getCurrentUser } from '@/api/auth'
import { getUser, setUser, removeUser } from '@/lib/storage'
import { useEffect, useState } from 'react'

export function Navbar() {
  const [user, setCurrentUser] = useState(getUser());

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setCurrentUser(userData);
        setUser(userData);
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

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

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
          <Link to="/opening-tree" className="text-sm font-medium text-muted-foreground hover:text-primary">
            Opening Tree
          </Link>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {user && <span className="text-sm font-medium">{user.Username}</span>}
          <Button variant="ghost" size="icon">
            <User className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}