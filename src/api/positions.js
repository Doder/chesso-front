import api from '@/lib/axios'

export const getPositions = (fen) => {
  return api.get('/positions/search?fen=' + fen)
}

export const getNextPositions = (fromFen, toFen, repertoireId, openingId) => {
  return api.get('/positions/search-candidate', {
    params: {
      from_fen: fromFen,
      to_fen: toFen,
      repertoire_id: repertoireId,
      opening_id: openingId
    }}
  )
}

export const getPrevPositions = (fen, repertoireId) => {
  return api.get('/positions/search-candidate-back?fen=' + fen + '&repertoire_id=' + repertoireId)
}

export const createPosition = (from_fen, to_fen, last_move, opening_id, repertoire_id) => {
  return api.post('/positions/', { from_fen, to_fen, last_move, opening_id, repertoire_id })
}

export const commentPosition = (id, evaluation, comment, order) => {
  return api.patch('/positions/' + id, { eval: evaluation, comment, order })
}

export const deleteMove = (id) => {
  return api.delete('/positions/' + id)
}

export const getPositionsByOpeningIds = (openingIds) => {
  return api.get('/positions/by-openings', {
    params: { opening_ids: openingIds.join(',') }
  })
}
