import api from '@/lib/axios'

export const getOpenings = (id) => {
  return api.get(`/repertoires/${id}`)
}

export const getOpening = (id) => {
  return api.get(`/openings/${id}`)
}

export const createOpening = (data, repertoireId) => {
  return api.post('/openings/', {...data, repertoire_id: repertoireId})
}

export const deleteOpening = (id) => {
  return api.delete(`/openings/${id}`)
}
