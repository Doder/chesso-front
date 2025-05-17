import api from '@/lib/axios'
import { setToken, removeToken } from '@/lib/storage'

export const login = async (email, password) => {
  const response = await api.post('/login', { email, password })
  const { token } = response.data
  if (token) {
    setToken(token)
  }
  return response.data
}

export const logout = () => {
  removeToken()
  window.location.href = '/login'
}
