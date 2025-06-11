import api from '@/lib/axios'

export const getRepertoires = () => {
  return api.get('/repertoires/')
}

export const getRepertoire = (id) => {
  return api.get(`/repertoires/${id}`)
}

export const createRepertoire = (data) => {
  return api.post('/repertoires/', data)
}

export const updateRepertoire = (data, id) => {
  return api.patch(`/repertoires/${id}`, data)
}

export const deleteRepertoire = (id) => {
  return api.delete(`/repertoires/${id}`)
}
