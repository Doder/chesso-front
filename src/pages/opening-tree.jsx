import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { getNextPositions, createPosition } from '@/api/positions'
import { useParams } from 'react-router-dom'

export function OpeningTree({ openingId, side }) {
  const [game, setGame] = useState(() => new Chess())
  const [position, setPosition] = useState(game.fen())
  const [history, setHistory] = useState([])
  const [currentMove, setCurrentMove] = useState(-1)
  const [nextMoves, setNextMoves] = useState([])
  const [prevMoves, setPrevMoves] = useState([])
  const {id: opening_id} = useParams()

  const fetchPositions = async (fen, lastMove) => {
    try {
      const { data } = await getNextPositions(fen)
      console.log('DATA', data)
      if (data.message) return
      if (data.length === 0) {
        addPosition(fen, lastMove)
        setNextMoves(data)
      } else if (data.length > 0) {
        setNextMoves(data)
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const addPosition = async (fen, lastMove) => {
    try {
      const { data } = await createPosition(fen, lastMove, Number(opening_id))
      console.log(data)
    } catch (error) {
      console.error('Error creating position:', error)
    }
  }

  useEffect(() => {
    console.log(currentMove, history[currentMove])
    fetchPositions(position, history[currentMove])
  }, [position, history, currentMove])

  const goToMove = (moveIndex) => {
    const newGame = new Chess()
    for (let i = 0; i <= moveIndex && i < history.length; i++) {
      newGame.move(history[i])
    }
    setPosition(newGame.fen())
    setCurrentMove(moveIndex)
    setGame(newGame);
  }

  const goToPrevMove = () => {
    if (currentMove >= 0) {
      goToMove(currentMove - 1)
    }
  }

  const goToNextMove = () => {
    if (currentMove < history.length - 1) {
      goToMove(currentMove + 1)
    }
  }

  const goToStart = () => {
    goToMove(-1)
  }

  const goToEnd = () => {
    goToMove(history.length - 1)
  }
  const [copySuccess, setCopySuccess] = useState(false)

  function onDrop(sourceSquare, targetSquare) {
    try {
      let move;
      
      if (typeof sourceSquare === 'string' && typeof targetSquare === 'undefined') {
        // If only one parameter is passed, treat it as SAN notation
        move = game.move(sourceSquare)
      } else {
        // Otherwise treat as coordinate notation (from-to squares)
        move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q'
        })
      }

      if (move === null) return false
      setPosition(game.fen())
      const newHistory = game.history()
      setHistory(newHistory)
      setCurrentMove(newHistory.length - 1)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="container">
      <div className="flex gap-6">
        <div className="flex-[2]">
            <Chessboard
              position={position}
              onPieceDrop={onDrop}
              boardOrientation={side === 'b' ? 'black' : 'white'}
              customDarkSquareStyle={{ backgroundColor: '#D3D3D3' }}
              customLightSquareStyle={{ backgroundColor: '#EBEBEB' }}
              customBoardStyle={
                {
                  margin: '0 auto',
                  borderRadius: '5px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }
              }
            />

          {/* Move navigation */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={goToStart}
              disabled={currentMove < 0}
              className="p-2 rounded hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go to start"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToPrevMove}
              disabled={currentMove < 0}
              className="p-2 rounded hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous move"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNextMove}
              disabled={currentMove >= history.length - 1}
              className="p-2 rounded hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next move"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={goToEnd}
              disabled={currentMove >= history.length - 1}
              className="p-2 rounded hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go to end"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          {/* Opening Explorer */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/5 border-b border-border px-4 py-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Next Moves</h2>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                {nextMoves?.map((move, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded cursor-pointer"
                    onClick={() => onDrop(move.last_move)}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-mono">{move.last_move}</span>
                      <span className="text-sm text-muted-foreground">{move.opening_name}</span>
                    </div>
                  </div>
                ))}
              </div>


            </div>
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/5 border-b border-border px-4 py-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Prev Moves</h2>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                {prevMoves.map((move, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded cursor-pointer"
                    onClick={() => onDrop(move.from, move.to)}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-mono">{move.san}</span>
                      <span className="text-sm text-muted-foreground">{move.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Game moves */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/5 border-b border-border px-4 py-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Game Moves</h2>
                <button 
                  onClick={() => {
                    const pgn = game.pgn()
                    navigator.clipboard.writeText(pgn)
                    setCopySuccess(true)
                    setTimeout(() => setCopySuccess(false), 2000)
                  }} 
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {copySuccess ? 'Copied!' : 'Copy PGN'}
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {history.map((move, index) => {
                  const moveNumber = Math.floor(index / 2) + 1
                  const isWhiteMove = index % 2 === 0
                  return (
                    <div key={index} className="flex items-center">
                      {isWhiteMove && (
                        <span className="text-sm text-muted-foreground mr-1">{moveNumber}.</span>
                      )}
                      <button
                        onClick={() => goToMove(index)}
                        className={`px-2 py-1 rounded text-sm font-mono ${currentMove === index ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary/20'}`}
                      >
                        {move}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
