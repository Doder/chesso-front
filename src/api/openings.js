import api from '@/lib/axios'

export const getOpenings = () => {
  return api.get('/openings/')
}

export const getOpening = (id) => {
  return api.get(`/openings/${id}`)
}

export const createOpening = (data) => {
  return api.post('/openings/', data)
}

export const deleteOpening = (id) => {
  return api.delete(`/openings/${id}`)
}
