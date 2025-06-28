import { useState } from 'react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { register } from '@/api/auth'
import { Link } from "react-router-dom"

export function RegisterForm({
  className,
  onRegister,
  ...props
}) {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const formData = new FormData(e.target)
      const username = formData.get('username')
      const email = formData.get('email')
      const password = formData.get('password')
      const rating = formData.get('rating')
      
      if (username && email && password) {
        await register(username, email, password, rating || undefined) // Pass rating if provided
        if (onRegister) {
          onRegister()
        }
      } else {
        setError('Username, email, and password are required.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your details below to create your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input name="username" id="username" type="text" placeholder="yourusername" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input name="email" id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input name="password" id="password" type="password" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rating">Rating (Optional)</Label>
          <Input name="rating" id="rating" type="number" placeholder="1200" />
        </div>
        {error && (
          <div className="text-sm text-red-500 text-center">{error}</div>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          Create Account
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="underline underline-offset-4">
          Login
        </Link>
      </div>
    </form>
  )
}
