import api from '@/lib/axios'

export const getPositions = (fen) => {
  return api.get('/positions/search?fen=' + fen)
}

export const getNextPositions = (fen) => {
  return api.get('/positions/search-candidate?fen=' + fen)
}

export const createPosition = (fen, last_move, opening_id) => {
  return api.post('/positions/', { fen, last_move, opening_id })
}
