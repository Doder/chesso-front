import api from '@/lib/axios'

export const getRepertoires = () => {
  return api.get('/repertoires/')
}

export const createRepertoire = (data) => {
  return api.post('/repertoires/', data)
}

export const deleteRepertoire = (id) => {
  return api.delete(`/repertoires/${id}`)
}
