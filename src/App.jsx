import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom'
import {useEffect, useState} from 'react'
import Layout from './components/layout'
import LoginPage from './pages/login'
import RegisterPage from './pages/register'
import DashboardPage from './pages/dashboard'
import {Repertoires} from './pages/repertoires'
import {Repertoire} from './pages/repertoire'
import {getToken} from './lib/storage'
import {Opening} from './pages/opening'
import {Train} from './pages/train'
import ForgotPasswordPage from './pages/forgot-password'
import ResetPasswordPage from './pages/reset-password'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleRegisterSuccess = () => {
    setIsAuthenticated(true)
  }

  if (isLoading) {
    return null
  }

  return (
    <Router basename="/app">
      <Routes>
        <Route path="/login" element={
          isAuthenticated ?
            <Navigate to="/" /> :
            <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/register" element={
          isAuthenticated ?
            <Navigate to="/" /> :
            <RegisterPage onRegister={handleRegisterSuccess} />
        } />
        <Route path="/forgot-password" element={
          isAuthenticated ?
            <Navigate to="/" /> :
            <ForgotPasswordPage />
        } />
        <Route path="/reset-password/:token" element={
          isAuthenticated ?
            <Navigate to="/" /> :
            <ResetPasswordPage />
        } />
        <Route path="/" element={
          isAuthenticated ?
            <Layout /> :
            <Navigate to="/login" />
        }>
          <Route index element={<Navigate to="/repertoires" />} />
          <Route path="repertoires" element={<Repertoires />} />
          <Route path="repertoire/:id" element={<Repertoire />} />
          <Route path="repertoire/:rid/opening/:oid" element={<Opening />} />
          <Route path="train" element={<Train />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
