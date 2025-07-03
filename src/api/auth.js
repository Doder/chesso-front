import api from '@/lib/axios'
import {setToken, removeToken} from '@/lib/storage'

export const login = async (email, password) => {
  const response = await api.post('/login', {email, password})
  const {token} = response.data
  if (token) {
    setToken(token)
  }
  return response.data
}

export const register = async (username, email, password, rating) => {
  const payload = {username, email, password};
  if (rating) {
    payload.rating = parseInt(rating, 10);
  }
  const response = await api.post('/register', payload);

  const {token} = response.data;
  if (token) {
    setToken(token);
  }
  return response.data;
};

export const logout = () => {
  removeToken()
  window.location.href = '/'
}

export const getCurrentUser = async () => {
  const response = await api.get('/me');
  return response.data;
}