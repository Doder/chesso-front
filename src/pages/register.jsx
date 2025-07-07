import { RegisterForm } from "@/components/register-form"
import chess_bg from "@/assets/chess_bg.jpg"

export default function RegisterPage({ onRegister }) {
  // onRegister could be a function to redirect the user or update UI state after successful registration
  const handleRegister = () => {
    // For example, redirect to login page or dashboard
    // This depends on how you want to handle post-registration flow
    if (onRegister) {
      onRegister();
    } else {
      // Default behavior if no onRegister prop is passed, e.g., redirect to login
      window.location.href = '/app/login'; 
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-1 font-medium">
            <img src="/logo.svg" className="size-6" />
            Chesso
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterForm onRegister={handleRegister} />
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
