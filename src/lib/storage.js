const TOKEN_KEY = 'auth_token'
const USER_KEY = 'user_data'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)

export const getUser = () => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};
export const setUser = (userData) => localStorage.setItem(USER_KEY, JSON.stringify(userData));
export const removeUser = () => localStorage.removeItem(USER_KEY);