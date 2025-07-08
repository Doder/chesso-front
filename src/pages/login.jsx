import { GalleryVerticalEnd } from "lucide-react"
import { useLocation } from "react-router-dom"

import { LoginForm } from "@/components/login-form"
import chess_bg from "@/assets/chess_bg.jpg"

export default function LoginPage({ onLogin }) {
  const location = useLocation()
  const message = location.state?.message
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-1 font-medium">
            <img src="/logo.svg" className="size-6" />
            Chesso
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{message}</p>
              </div>
            )}
            <LoginForm onLogin={onLogin} />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src={chess_bg}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
