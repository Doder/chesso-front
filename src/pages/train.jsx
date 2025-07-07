import React, { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, Play, ArrowLeft, SkipForward, CheckCircle, XCircle } from 'lucide-react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { getRepertoires } from '@/api/repertoire'
import { getAllOpenings } from '@/api/openings'
import { getPositionsByOpeningIds } from '@/api/positions'
import { Button } from '@/components/ui/button'
import moveSound from '@/assets/move.mp3'

export function Train() {
  const [repertoires, setRepertoires] = useState([])
  const [openings, setOpenings] = useState([])
  const [expandedRepertoires, setExpandedRepertoires] = useState(new Set())
  const [selectedRepertoires, setSelectedRepertoires] = useState(new Set())
  const [selectedOpenings, setSelectedOpenings] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingPositions, setTrainingPositions] = useState([])
  const [currentPosition, setCurrentPosition] = useState(null)
  const [currentGame, setCurrentGame] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [showHint, setShowHint] = useState(false)
  const [highlightedSquares, setHighlightedSquares] = useState({})
  const moveSoundRef = React.useRef(null)

  useEffect(() => {
    moveSoundRef.current = new Audio(moveSound)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [repertoireRes, openingsRes] = await Promise.all([
        getRepertoires(),
        getAllOpenings()
      ])
      setRepertoires(repertoireRes.data)
      setOpenings(openingsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOpeningsForRepertoire = (repertoireId) => {
    return openings.filter(opening => opening.repertoire_id === repertoireId)
  }

  const toggleRepertoireExpansion = (repertoireId) => {
    const newExpanded = new Set(expandedRepertoires)
    if (newExpanded.has(repertoireId)) {
      newExpanded.delete(repertoireId)
    } else {
      newExpanded.add(repertoireId)
    }
    setExpandedRepertoires(newExpanded)
  }

  const toggleRepertoireSelection = (repertoireId) => {
    const newSelected = new Set(selectedRepertoires)
    const repertoireOpenings = getOpeningsForRepertoire(repertoireId)
    
    if (newSelected.has(repertoireId)) {
      newSelected.delete(repertoireId)
      // Also deselect all openings from this repertoire
      const newSelectedOpenings = new Set(selectedOpenings)
      repertoireOpenings.forEach(opening => {
        newSelectedOpenings.delete(opening.ID)
      })
      setSelectedOpenings(newSelectedOpenings)
    } else {
      newSelected.add(repertoireId)
      // Also select all openings from this repertoire
      const newSelectedOpenings = new Set(selectedOpenings)
      repertoireOpenings.forEach(opening => {
        newSelectedOpenings.add(opening.ID)
      })
      setSelectedOpenings(newSelectedOpenings)
    }
    setSelectedRepertoires(newSelected)
  }

  const toggleOpeningSelection = (openingId, repertoireId) => {
    const newSelectedOpenings = new Set(selectedOpenings)
    
    if (newSelectedOpenings.has(openingId)) {
      newSelectedOpenings.delete(openingId)
    } else {
      newSelectedOpenings.add(openingId)
    }
    
    setSelectedOpenings(newSelectedOpenings)
    
    // Check if all openings for this repertoire are selected
    const repertoireOpenings = getOpeningsForRepertoire(repertoireId)
    const allOpeningsSelected = repertoireOpenings.every(opening => 
      newSelectedOpenings.has(opening.ID)
    )
    
    const newSelectedRepertoires = new Set(selectedRepertoires)
    if (allOpeningsSelected) {
      newSelectedRepertoires.add(repertoireId)
    } else {
      newSelectedRepertoires.delete(repertoireId)
    }
    setSelectedRepertoires(newSelectedRepertoires)
  }

  const isRepertoirePartiallySelected = (repertoireId) => {
    const repertoireOpenings = getOpeningsForRepertoire(repertoireId)
    const selectedCount = repertoireOpenings.filter(opening => 
      selectedOpenings.has(opening.ID)
    ).length
    return selectedCount > 0 && selectedCount < repertoireOpenings.length
  }

  const getSelectedCount = () => {
    return selectedOpenings.size
  }

  const startTraining = async () => {
    if (selectedOpenings.size > 0) {
      setLoading(true)
      try {
        const response = await getPositionsByOpeningIds(Array.from(selectedOpenings))
        const positions = response.data.filter(pos => pos.fen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
        setTrainingPositions(positions)
        setIsTraining(true)
        setScore({ correct: 0, total: 0 })
        loadRandomPosition(positions)
      } catch (error) {
        console.error('Error fetching training positions:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const loadRandomPosition = (positions) => {
    if (positions.length === 0) return
    
    const randomIndex = Math.floor(Math.random() * positions.length)
    const position = positions[randomIndex]
    setCurrentPosition(position)
    setCurrentGame(new Chess(position.fen))
    setFeedback(null)
    setShowHint(false)
    setHighlightedSquares({})
  }

  const handleMove = useCallback((sourceSquare, targetSquare) => {
    if (!currentGame || !currentPosition) return false

    try {
      const move = currentGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      })

      if (move) {
        const newFen = currentGame.fen()
        
        // Check if this move leads to any of the next positions
        const isCorrect = currentPosition.NextPositions?.some(nextPos => 
          nextPos.fen === newFen
        )

        if (isCorrect) {
          setFeedback({ type: 'success', message: 'Correct move!' })
          setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }))
          moveSoundRef.current?.play()
          setHighlightedSquares({})
          
          // Load next position after a short delay
          setTimeout(() => {
            loadRandomPosition(trainingPositions)
          }, 1500)
        } else {
          setFeedback({ type: 'error', message: 'Incorrect move. Try again!' })
          setScore(prev => ({ ...prev, total: prev.total + 1 }))
          setHighlightedSquares({})
          // Reset the game state
          setCurrentGame(new Chess(currentPosition.fen))
        }

        return true
      }
    } catch (error) {
      console.error('Invalid move:', error)
      return false
    }

    return false
  }, [currentGame, currentPosition, trainingPositions])

  const skipPosition = () => {
    setFeedback({ type: 'info', message: 'Position skipped' })
    setScore(prev => ({ ...prev, total: prev.total + 1 }))
    loadRandomPosition(trainingPositions)
  }

  const showHintHandler = () => {
    setShowHint(true)
    if (currentPosition?.NextPositions?.length > 0 && currentGame) {
      // Get all legal moves from current position
      const legalMoves = currentGame.moves({ verbose: true })
      
      // Find moves that lead to correct next positions
      const correctMoves = []
      for (const move of legalMoves) {
        const tempGame = new Chess(currentPosition.fen)
        tempGame.move(move)
        const resultFen = tempGame.fen()
        
        if (currentPosition.NextPositions.some(nextPos => nextPos.fen === resultFen)) {
          correctMoves.push(move)
        }
      }
      
      // Highlight source squares of correct moves
      const highlights = {}
      correctMoves.forEach(move => {
        highlights[move.from] = {
          backgroundColor: 'rgba(255, 255, 0, 0.4)',
          border: '2px solid #FFD700'
        }
      })
      
      setHighlightedSquares(highlights)
      
      const hint = currentPosition.NextPositions[0]
      setFeedback({ 
        type: 'info', 
        message: `Hint: ${correctMoves.length} piece${correctMoves.length === 1 ? '' : 's'} highlighted can make the correct move${correctMoves.length === 1 ? '' : 's'}` 
      })
    }
  }

  const exitTraining = () => {
    setIsTraining(false)
    setCurrentPosition(null)
    setCurrentGame(null)
    setTrainingPositions([])
    setFeedback(null)
    setScore({ correct: 0, total: 0 })
    setHighlightedSquares({})
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  // Training Mode UI
  if (isTraining) {
    return (
      <div className="lg:container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button 
              onClick={exitTraining}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit Training
            </Button>
            <h2 className="text-2xl font-semibold">Training Mode</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">
              Score: {score.correct}/{score.total} 
              {score.total > 0 && (
                <span className="text-muted-foreground">
                  ({Math.round((score.correct / score.total) * 100)}%)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={showHintHandler} variant="outline" size="sm">
                Hint
              </Button>
              <Button onClick={skipPosition} variant="outline" size="sm">
                <SkipForward className="w-4 h-4" />
                Skip
              </Button>
            </div>
          </div>
        </div>

        {/* Chess Board and Info */}
        {currentGame && (
          <div className="lg:flex gap-6">
            <div className="flex-1 mb-4">
              <Chessboard 
                position={currentGame.fen()}
                onPieceDrop={handleMove}
                arePiecesDraggable={true}
                customDarkSquareStyle={{ backgroundColor: '#D3D3D3' }}
                customLightSquareStyle={{ backgroundColor: '#EBEBEB' }}
                customBoardStyle={{
                  margin: '0 auto',
                  borderRadius: '5px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                customSquareStyles={highlightedSquares}
              />
            </div>
            
            <div className="flex-1 space-y-4">
              {/* Position Info */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-secondary/5 border-b border-border px-4 py-3">
                  <h2 className="text-lg font-semibold">Position Info</h2>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {currentPosition?.opening_name} - Find the best move
                  </p>
                  {currentPosition?.comment && (
                    <p className="text-sm mt-2 italic">
                      {currentPosition.comment}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Training Stats */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-secondary/5 border-b border-border px-4 py-3">
                  <h2 className="text-lg font-semibold">Training Stats</h2>
                </div>
                <div className="p-4">
                  <div className="text-sm font-medium">
                    Score: {score.correct}/{score.total}
                    {score.total > 0 && (
                      <span className="text-muted-foreground ml-2">
                        ({Math.round((score.correct / score.total) * 100)}%)
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Positions remaining: {trainingPositions.length}
                  </div>
                </div>
              </div>
              
              {/* Feedback Notification */}
              {feedback && (
                <div className={`mt-4 mb-4 p-4 rounded-lg flex items-center gap-2 ${
                  feedback.type === 'success' ? 'bg-green-100 text-green-800' :
                  feedback.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {feedback.type === 'success' && <CheckCircle className="w-5 h-5" />}
                  {feedback.type === 'error' && <XCircle className="w-5 h-5" />}
                  {feedback.message}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    )
  }

  return (
    <div className="lg:container py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Train</h2>
        <Button 
          onClick={startTraining}
          disabled={selectedOpenings.size === 0}
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Start Training ({getSelectedCount()} openings)
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/5 border-b border-border">
              <th className="px-4 py-3 text-left font-semibold">
                <input
                  type="checkbox"
                  className="mr-3"
                  checked={selectedRepertoires.size === repertoires.length && repertoires.length > 0}
                  onChange={() => {
                    if (selectedRepertoires.size === repertoires.length) {
                      setSelectedRepertoires(new Set())
                      setSelectedOpenings(new Set())
                    } else {
                      setSelectedRepertoires(new Set(repertoires.map(r => r.ID)))
                      setSelectedOpenings(new Set(openings.map(o => o.ID)))
                    }
                  }}
                />
                Repertoire / Opening
              </th>
              <th className="px-4 py-3 text-left font-semibold">Side</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
            </tr>
          </thead>
          <tbody>
            {repertoires.map((repertoire) => {
              const repertoireOpenings = getOpeningsForRepertoire(repertoire.ID)
              const isExpanded = expandedRepertoires.has(repertoire.ID)
              const isSelected = selectedRepertoires.has(repertoire.ID)
              const isPartiallySelected = isRepertoirePartiallySelected(repertoire.ID)
              
              return (
                <React.Fragment key={repertoire.ID}>
                  <tr className="border-b border-border hover:bg-secondary/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-3"
                          checked={isSelected}
                          ref={input => {
                            if (input) input.indeterminate = isPartiallySelected && !isSelected
                          }}
                          onChange={() => toggleRepertoireSelection(repertoire.ID)}
                        />
                        <button
                          onClick={() => toggleRepertoireExpansion(repertoire.ID)}
                          className="mr-2 p-1 hover:bg-gray-100 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <span className="font-medium">{repertoire.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">-</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        Repertoire ({repertoireOpenings.length})
                      </span>
                    </td>
                  </tr>
                  {isExpanded && repertoireOpenings.map((opening) => (
                    <tr key={opening.ID} className="border-b border-border hover:bg-secondary/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center ml-8">
                          <input
                            type="checkbox"
                            className="mr-3"
                            checked={selectedOpenings.has(opening.ID)}
                            onChange={() => toggleOpeningSelection(opening.ID, repertoire.ID)}
                          />
                          <span>{opening.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          opening.side === 'w' 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-gray-800 text-white'
                        }`}>
                          {opening.side === 'w' ? 'White' : 'Black'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          Opening
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )
            })}
            {repertoires.length === 0 && (
              <tr>
                <td colSpan="3" className="px-4 py-3 text-center text-muted-foreground">
                  No repertoires found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}