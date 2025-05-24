import api from '@/lib/axios'

export const getPositions = (fen) => {
  return api.get('/positions/search?fen=' + fen)
}

export const getNextPositions = (fen, repertoireId) => {
  return api.get('/positions/search-candidate?fen=' + fen + '&repertoire_id=' + repertoireId)
}

export const createPosition = (from_fen, to_fen, last_move, opening_id, repertoire_id) => {
  return api.post('/positions/', { from_fen, to_fen, last_move, opening_id, repertoire_id })
}
