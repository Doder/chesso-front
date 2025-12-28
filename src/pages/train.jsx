import React, { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, Play, ArrowLeft, SkipForward, CheckCircle, XCircle } from 'lucide-react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { getRepertoires } from '@/api/repertoire'
import { getAllOpenings } from '@/api/openings'
import { getPositionsByOpeningIds, updatePositionCorrectGuess, resetPositionProgress, getPositionCountsByOpeningIds } from '@/api/positions'
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
  const scoreNextMoveRef = React.useRef(true)
  const [trainingPositions, setTrainingPositions] = useState([])
  const [solvedPositions, setSolvedPositions] = useState(new Set())
  const [currentPosition, setCurrentPosition] = useState(null)
  const [currentGame, setCurrentGame] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [showHint, setShowHint] = useState(false)
  const [highlightedSquares, setHighlightedSquares] = useState({})
  const [boardOrientation, setBoardOrientation] = useState("white")
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false)
  const [positionCounts, setPositionCounts] = useState({})
  const [nextReviewDays, setNextReviewDays] = useState({})
  const [shufflePositions, setShufflePositions] = useState(false)
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0)
  const [lastMove, setLastMove] = useState(null)
  const [showSuccessBorder, setShowSuccessBorder] = useState(false)
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
      
      // Fetch position counts for all openings
      if (openingsRes.data.length > 0) {
        const openingIds = openingsRes.data.map(opening => opening.ID)
        const countsRes = await getPositionCountsByOpeningIds(openingIds)
        setPositionCounts(countsRes.data.counts || countsRes.data)
        setNextReviewDays(countsRes.data.nextReviewDays || {})
      }
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

  const getRepertoirePositionCount = (repertoireId) => {
    const repertoireOpenings = getOpeningsForRepertoire(repertoireId)
    return repertoireOpenings.reduce((total, opening) => {
      return total + (positionCounts[opening.ID] || 0)
    }, 0)
  }

  const getOpeningPositionCount = (openingId) => {
    return positionCounts[openingId] || 0
  }

  const getTotalTrainablePositions = () => {
    return Object.values(positionCounts).reduce((total, count) => total + count, 0)
  }

  const hasAnyTrainableRepertoires = () => {
    return repertoires.some(repertoire => getRepertoirePositionCount(repertoire.ID) > 0)
  }

  const formatNextReviewText = (days) => {
    if (days === -1) return ''
    if (days === 1) return ' (tomorrow)'
    return ` (in ${days} days)`
  }

  const getRepertoireNextReviewDays = (repertoireId) => {
    const repertoireOpenings = getOpeningsForRepertoire(repertoireId)
    const validDays = repertoireOpenings
      .map(opening => nextReviewDays[opening.ID])
      .filter(days => days > 0)
    return validDays.length > 0 ? Math.min(...validDays) : -1
  }

  const getOpeningNextReviewDays = (openingId) => {
    return nextReviewDays[openingId] || -1
  }

  const startTraining = async () => {
    if (selectedOpenings.size > 0) {
      setLoading(true)
      try {
        const response = await getPositionsByOpeningIds(Array.from(selectedOpenings))
        const positions = response.data
        setTrainingPositions(positions)
        setSolvedPositions(new Set())
        setIsTraining(true)
        setScore({ correct: 0, total: positions.length })
        setShowCompletionOverlay(false)
        setCurrentPositionIndex(0)
        scoreNextMoveRef.current = true
        loadRandomPosition(positions, new Set(), 0)
      } catch (error) {
        console.error('Error fetching training positions:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const loadRandomPosition = useCallback((positions, solved = solvedPositions, posIndex = currentPositionIndex) => {
    if (positions.length === 0) return

    // Filter out solved positions
    const unsolvedPositions = positions.filter(pos => !solved.has(pos.ID))

    // If all positions are solved, show completion message or restart
    if (unsolvedPositions.length === 0) {
      setFeedback(null)
      setShowCompletionOverlay(true)
      return
    }

    let position
    let newIndex = posIndex

    if (shufflePositions) {
      // Random mode - pick a random unsolved position
      const randomIndex = Math.floor(Math.random() * unsolvedPositions.length)
      position = unsolvedPositions[randomIndex]
    } else {
      // Ordered mode - go through positions sequentially
      // Find the next unsolved position starting from current index
      let found = false
      for (let i = 0; i < positions.length; i++) {
        const checkIndex = (posIndex + i) % positions.length
        const pos = positions[checkIndex]
        if (!solved.has(pos.ID)) {
          position = pos
          newIndex = (checkIndex + 1) % positions.length
          found = true
          break
        }
      }

      if (!found) {
        // Shouldn't happen as we already checked unsolvedPositions.length
        setFeedback(null)
        setShowCompletionOverlay(true)
        return
      }
    }

    setCurrentPositionIndex(newIndex)
    setCurrentPosition(position)
    setCurrentGame(new Chess(position.fen))
    setFeedback(null)
    setShowHint(false)
    setHighlightedSquares({})

    // Calculate last move from previous position
    if (position.PrevPositions && position.PrevPositions.length > 0) {
      const prevPosition = position.PrevPositions[0]
      const prevGame = new Chess(prevPosition.fen)
      const currentGameTemp = new Chess(position.fen)

      // Find the move by trying all legal moves in previous position
      const legalMoves = prevGame.moves({ verbose: true })
      for (const move of legalMoves) {
        const testGame = new Chess(prevPosition.fen)
        testGame.move(move)
        if (testGame.fen() === position.fen) {
          // Found the move that led to current position
          setLastMove({ from: move.from, to: move.to })
          break
        }
      }
    } else {
      setLastMove(null)
    }

    // Set board orientation based on the opening side
    if (position.Opening?.side) {
      setBoardOrientation(position.Opening.side === 'b' ? 'black' : 'white')
    } else {
      // Fallback: find the opening from our openings data
      const opening = openings.find(o => o.ID === position.opening_id)
      if (opening) {
        setBoardOrientation(opening.side === 'b' ? 'black' : 'white')
      }
    }
  }, [openings, solvedPositions, shufflePositions, currentPositionIndex])


  const isDraggablePiece = useCallback(({ piece, sourceSquare }) => {
    if (!currentPosition) return false
    
    // Get the opening side (what color the user is playing)
    let openingSide
    if (currentPosition.Opening?.side) {
      openingSide = currentPosition.Opening.side
    } else {
      // Fallback: find the opening from our openings data
      const opening = openings.find(o => o.ID === currentPosition.opening_id)
      openingSide = opening?.side
    }
    
    if (!openingSide) return false
    
    // Check if piece color matches opening side
    const pieceColor = piece[0] // 'w' or 'b' (first character of piece notation like 'wP', 'bK')
    return pieceColor === openingSide
  }, [currentPosition, openings])

  const handleMove = useCallback((sourceSquare, targetSquare) => {
    if (!currentGame || !currentPosition) return false

    try {
      // Create a copy to test the move without affecting display
      const testGame = new Chess(currentGame.fen())
      const move = testGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      })

      if (move) {
        const newFen = testGame.fen()
        
        // Check if this move leads to any of the next positions
        const isCorrect = currentPosition.NextPositions?.some(nextPos => 
          nextPos.fen === newFen
        )

        if (isCorrect) {
          // Apply the move to the display game
          currentGame.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q'
          })

          setFeedback({ type: 'success', message: 'Correct move!' })

          // Check if this move should be scored
          if(scoreNextMoveRef.current){
            setScore(prev => ({ correct: prev.correct + 1, total: prev.total }))
          }

          moveSoundRef.current?.play()
          setHighlightedSquares({})

          // Show green border feedback
          setShowSuccessBorder(true)
          setTimeout(() => setShowSuccessBorder(false), 800)

          // Update spaced repetition progress for correct guess
          if (currentPosition?.ID) {
            updatePositionCorrectGuess(currentPosition.ID).catch(error => {
              console.error('Error updating position progress:', error)
            })
          }

          // Mark position as solved
          const newSolvedPositions = new Set(solvedPositions)
          newSolvedPositions.add(currentPosition.ID)
          setSolvedPositions(newSolvedPositions)

          // Reset scoreNextMove for the next position
          scoreNextMoveRef.current = true

          // Delay loading next position for smooth transition
          setTimeout(() => {
            loadRandomPosition(trainingPositions, newSolvedPositions, currentPositionIndex)
          }, 1000)
        } else {
          setFeedback({ type: 'error', message: 'Incorrect move. Try again!' })
          setHighlightedSquares({})
          scoreNextMoveRef.current = false
          
          // Reset spaced repetition progress for incorrect guess
          if (currentPosition?.ID) {
            resetPositionProgress(currentPosition.ID).catch(error => {
              console.error('Error resetting position progress:', error)
            })
          }
          
          // Don't apply incorrect moves
        }

        return true
      }
    } catch (error) {
      console.error('Invalid move:', error)
      return false
    }

    return false
  }, [currentGame, currentPosition, trainingPositions, solvedPositions, currentPositionIndex])

  const skipPosition = () => {
    setFeedback({ type: 'info', message: 'Position skipped' })

    // Reset spaced repetition progress for skipped position
    if (currentPosition?.ID) {
      resetPositionProgress(currentPosition.ID).catch(error => {
        console.error('Error resetting position progress:', error)
      })
    }

    // Reset scoreNextMove for the next position
    scoreNextMoveRef.current = true
    loadRandomPosition(trainingPositions, solvedPositions, currentPositionIndex)
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

  const exitTraining = async () => {
    setIsTraining(false)
    setCurrentPosition(null)
    setCurrentGame(null)
    setTrainingPositions([])
    setSolvedPositions(new Set())
    setFeedback(null)
    setScore({ correct: 0, total: 0 })
    setHighlightedSquares({})
    setShowSuccessOverlay(false)
    setOverlayFading(false)
    setShowCompletionOverlay(false)
    
    // Refresh position counts after training
    try {
      if (openings.length > 0) {
        const openingIds = openings.map(opening => opening.ID)
        const countsRes = await getPositionCountsByOpeningIds(openingIds)
        setPositionCounts(countsRes.data.counts || countsRes.data)
        setNextReviewDays(countsRes.data.nextReviewDays || {})
      }
    } catch (error) {
      console.error('Error refreshing position counts:', error)
    }
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
      <div className="lg:container py-6 px-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={exitTraining}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit Training
            </Button>
            <h2 className="text-xl lg:text-2xl font-semibold">Training Mode</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={showHintHandler} variant="outline" size="sm" className="flex-1 sm:flex-initial">
                Hint
              </Button>
              <Button onClick={skipPosition} variant="outline" size="sm" className="flex-1 sm:flex-initial">
                <SkipForward className="w-4 h-4" />
                Skip
              </Button>
            </div>
          </div>
        </div>

        {/* Chess Board and Info */}
        {currentGame && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:flex-1 mb-4 relative">
              <div className={`max-w-sm mx-auto lg:max-w-none transition-all duration-300 ${
                showSuccessBorder ? 'ring-4 ring-green-500' : ''
              }`}>
                <Chessboard
                  position={currentGame.fen()}
                  onPieceDrop={handleMove}
                  boardOrientation={boardOrientation}
                  animationDuration={600}
                  areArrowsAllowed={false}
                  arePiecesDraggable={!showCompletionOverlay}
                  isDraggablePiece={isDraggablePiece}
                  customDarkSquareStyle={{ backgroundColor: '#D3D3D3' }}
                  customLightSquareStyle={{ backgroundColor: '#EBEBEB' }}
                  customBoardStyle={{
                    margin: '0 auto',
                    borderRadius: '5px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  customSquareStyles={{
                    ...highlightedSquares,
                    ...(lastMove && {
                      [lastMove.from]: { backgroundColor: 'rgba(155, 199, 0, 0.41)' },
                      [lastMove.to]: { backgroundColor: 'rgba(155, 199, 0, 0.41)' }
                    })
                  }}
                />
              </div>

              {/* Completion Overlay */}
              {showCompletionOverlay && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 rounded-lg">
                  <div className="bg-white rounded-lg p-6 text-center shadow-lg">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Training Complete!</h3>
                    <p className="text-gray-600 mb-4">All positions completed! Great job!</p>
                    <Button onClick={exitTraining} className="bg-blue-500 hover:bg-blue-600 text-white">
                      Back to Selection
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-full lg:flex-1 space-y-4">
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
                    Positions remaining: {trainingPositions.length - solvedPositions.size}
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
    <div className="lg:container py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold">Train</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={shufflePositions}
              onChange={(e) => setShufflePositions(e.target.checked)}
              className="cursor-pointer"
            />
            Shuffle positions
          </label>
          <Button
            onClick={startTraining}
            disabled={selectedOpenings.size === 0}
            className="flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Play className="w-4 h-4" />
            Start Training ({getSelectedCount()} openings)
          </Button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        <div className="border border-border rounded-lg p-4">
          <label className="flex items-center gap-3 font-semibold">
            <input
              type="checkbox"
              className={`${!hasAnyTrainableRepertoires() ? 'opacity-50 cursor-not-allowed' : ''}`}
              checked={selectedRepertoires.size === repertoires.length && repertoires.length > 0 && hasAnyTrainableRepertoires()}
              disabled={!hasAnyTrainableRepertoires()}
              onChange={() => {
                if (!hasAnyTrainableRepertoires()) return
                
                if (selectedRepertoires.size === repertoires.length) {
                  setSelectedRepertoires(new Set())
                  setSelectedOpenings(new Set())
                } else {
                  const trainableRepertoires = repertoires.filter(r => getRepertoirePositionCount(r.ID) > 0)
                  const trainableOpenings = openings.filter(o => getOpeningPositionCount(o.ID) > 0)
                  setSelectedRepertoires(new Set(trainableRepertoires.map(r => r.ID)))
                  setSelectedOpenings(new Set(trainableOpenings.map(o => o.ID)))
                }
              }}
            />
            Select All
          </label>
        </div>

        {repertoires.map((repertoire) => {
          const repertoireOpenings = getOpeningsForRepertoire(repertoire.ID)
          const isExpanded = expandedRepertoires.has(repertoire.ID)
          const isSelected = selectedRepertoires.has(repertoire.ID)
          const isPartiallySelected = isRepertoirePartiallySelected(repertoire.ID)
          const repertoirePositionCount = getRepertoirePositionCount(repertoire.ID)
          const isRepertoireDisabled = repertoirePositionCount === 0
          
          return (
            <div key={repertoire.ID} className="border border-border rounded-lg">
              <div className="p-4 hover:bg-secondary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className={`${isRepertoireDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      checked={isSelected && !isRepertoireDisabled}
                      disabled={isRepertoireDisabled}
                      ref={input => {
                        if (input) input.indeterminate = isPartiallySelected && !isSelected && !isRepertoireDisabled
                      }}
                      onChange={() => !isRepertoireDisabled && toggleRepertoireSelection(repertoire.ID)}
                    />
                    <button
                      onClick={() => toggleRepertoireExpansion(repertoire.ID)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <span className="font-medium">{repertoire.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${repertoirePositionCount === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                      {repertoirePositionCount}
                      {repertoirePositionCount === 0 && formatNextReviewText(getRepertoireNextReviewDays(repertoire.ID))}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {repertoireOpenings.length} openings
                    </div>
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="border-t border-border">
                  {repertoireOpenings.map((opening) => {
                    const openingPositionCount = getOpeningPositionCount(opening.ID)
                    const isOpeningDisabled = openingPositionCount === 0
                    
                    return (
                      <div key={opening.ID} className="p-4 ml-8 border-b border-border last:border-b-0 hover:bg-secondary/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className={`${isOpeningDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                              checked={selectedOpenings.has(opening.ID) && !isOpeningDisabled}
                              disabled={isOpeningDisabled}
                              onChange={() => !isOpeningDisabled && toggleOpeningSelection(opening.ID, repertoire.ID)}
                            />
                            <div>
                              <span className={isOpeningDisabled ? 'text-gray-400' : ''}>{opening.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-block px-2 py-1 rounded text-xs ${
                                  opening.side === 'w' 
                                    ? 'bg-gray-100 text-gray-800' 
                                    : 'bg-gray-800 text-white'
                                }`}>
                                  {opening.side === 'w' ? 'White' : 'Black'}
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  Opening
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`font-medium ${openingPositionCount === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                              {openingPositionCount}
                              {openingPositionCount === 0 && formatNextReviewText(getOpeningNextReviewDays(opening.ID))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        
        {repertoires.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No repertoires found
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/5 border-b border-border">
              <th className="px-4 py-3 text-left font-semibold">
                <input
                  type="checkbox"
                  className={`mr-3 ${!hasAnyTrainableRepertoires() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  checked={selectedRepertoires.size === repertoires.length && repertoires.length > 0 && hasAnyTrainableRepertoires()}
                  disabled={!hasAnyTrainableRepertoires()}
                  onChange={() => {
                    if (!hasAnyTrainableRepertoires()) return
                    
                    if (selectedRepertoires.size === repertoires.length) {
                      setSelectedRepertoires(new Set())
                      setSelectedOpenings(new Set())
                    } else {
                      // Only select repertoires that have trainable positions
                      const trainableRepertoires = repertoires.filter(r => getRepertoirePositionCount(r.ID) > 0)
                      const trainableOpenings = openings.filter(o => getOpeningPositionCount(o.ID) > 0)
                      setSelectedRepertoires(new Set(trainableRepertoires.map(r => r.ID)))
                      setSelectedOpenings(new Set(trainableOpenings.map(o => o.ID)))
                    }
                  }}
                />
                Repertoire / Opening
              </th>
              <th className="px-4 py-3 text-left font-semibold">Side</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Positions to Train</th>
            </tr>
          </thead>
          <tbody>
            {repertoires.map((repertoire) => {
              const repertoireOpenings = getOpeningsForRepertoire(repertoire.ID)
              const isExpanded = expandedRepertoires.has(repertoire.ID)
              const isSelected = selectedRepertoires.has(repertoire.ID)
              const isPartiallySelected = isRepertoirePartiallySelected(repertoire.ID)
              const repertoirePositionCount = getRepertoirePositionCount(repertoire.ID)
              const isRepertoireDisabled = repertoirePositionCount === 0
              
              return (
                <React.Fragment key={repertoire.ID}>
                  <tr className="border-b border-border hover:bg-secondary/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className={`mr-3 ${isRepertoireDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          checked={isSelected && !isRepertoireDisabled}
                          disabled={isRepertoireDisabled}
                          ref={input => {
                            if (input) input.indeterminate = isPartiallySelected && !isSelected && !isRepertoireDisabled
                          }}
                          onChange={() => !isRepertoireDisabled && toggleRepertoireSelection(repertoire.ID)}
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
                    <td className="px-4 py-3">
                      <span className={`font-medium ${repertoirePositionCount === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                        {repertoirePositionCount}
                        {repertoirePositionCount === 0 && formatNextReviewText(getRepertoireNextReviewDays(repertoire.ID))}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && repertoireOpenings.map((opening) => {
                    const openingPositionCount = getOpeningPositionCount(opening.ID)
                    const isOpeningDisabled = openingPositionCount === 0
                    
                    return (
                      <tr key={opening.ID} className="border-b border-border hover:bg-secondary/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center ml-8">
                            <input
                              type="checkbox"
                              className={`mr-3 ${isOpeningDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                              checked={selectedOpenings.has(opening.ID) && !isOpeningDisabled}
                              disabled={isOpeningDisabled}
                              onChange={() => !isOpeningDisabled && toggleOpeningSelection(opening.ID, repertoire.ID)}
                            />
                            <span className={isOpeningDisabled ? 'text-gray-400' : ''}>{opening.name}</span>
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
                      <td className="px-4 py-3">
                        <span className={`font-medium ${openingPositionCount === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                          {openingPositionCount}
                          {openingPositionCount === 0 && formatNextReviewText(getOpeningNextReviewDays(opening.ID))}
                        </span>
                      </td>
                    </tr>
                    )
                  })}
                </React.Fragment>
              )
            })}
            {repertoires.length === 0 && (
              <tr>
                <td colSpan="4" className="px-4 py-3 text-center text-muted-foreground">
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