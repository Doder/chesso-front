import {Chess} from 'chess.js'
import {Chessboard} from 'react-chessboard'
import {useState, useRef, useEffect, useCallback} from 'react'
import {ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight} from 'lucide-react'
import {getNextPositions} from '@/api/positions'

function getSanMoveFromFens(fromFen, toFen) {
  const chess = new Chess(fromFen);
  const moves = chess.moves({verbose: true});
  for (const move of moves) {
    if (move.after === toFen) {
      return move.san;
    }
  }
  console.warn("No move found from FEN:", fromFen, "to FEN:", toFen);
  return null;
}

export function OpeningTree({openingId, repertoireId, side}) {
  const [game, setGame] = useState(() => new Chess())
  const [position, setPosition] = useState(game.fen())
  const prevPosition = useRef(null)
  const [history, setHistory] = useState([])
  const [currentMove, setCurrentMove] = useState(-1)
  const [nextMoves, setNextMoves] = useState([])
  const [arrows, setArrows] = useState([])

  const setNextMovesAndArrows = useCallback((nextMoves) => {
    nextMoves = nextMoves.map(nm => ({...nm, last_move: getSanMoveFromFens(position, nm.fen)}))
    console.log('nextMoves', nextMoves)
    setNextMoves(nextMoves)
    const newArrows = []
    const legalMoves = game.moves({verbose: true})
    for (const nm of nextMoves) {
      const lastMove = legalMoves.find(m => m.san === nm.last_move)
      if (lastMove) {
        newArrows.push([lastMove.from, lastMove.to, `hsla(230, 100%, ${50 + (nextMoves.indexOf(nm) * 10)}%, ${1 - (nextMoves.indexOf(nm) * 0.1)})`])
      }
    }
    setArrows(newArrows)
  }, [position, game])

  const handleNewMove = (newFen) => {
    prevPosition.current = position
    setPosition(newFen)
  }

  const fetchPositions = useCallback(async (fromFen, fen) => {
    try {
      const {data} = await getNextPositions(fromFen, fen, repertoireId)

      if (data.message) {
        return
      }
      if (data.length >= 0) {
        setNextMovesAndArrows(data)
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }, [repertoireId, setNextMovesAndArrows])

  useEffect(() => {
    fetchPositions(prevPosition.current, position)
  }, [position])


  const goToMove = (moveIndex) => {
    const newGame = new Chess()
    prevPosition.current = null
    for (let i = 0; i <= moveIndex && i < history.length; i++) {
      newGame.move(history[i])
      if (i === moveIndex - 1) {
        prevPosition.current = newGame.fen()
      }
    }
    setPosition(newGame.fen())
    setCurrentMove(moveIndex)
    setGame(newGame)
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
  const [boardOrientation, setBoardOrientation] = useState(side === 'b' ? 'black' : 'white')

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
      handleNewMove(game.fen())
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
            boardOrientation={boardOrientation}
            customDarkSquareStyle={{backgroundColor: '#D3D3D3'}}
            customLightSquareStyle={{backgroundColor: '#EBEBEB'}}
            customBoardStyle={
              {
                margin: '0 auto',
                borderRadius: '5px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }
            }
            areArrowsAllowed={false}
            customArrows={arrows}
          />
        </div>
        <div className="flex-1 space-y-2">
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

          {/* Move navigation */}
          <div className="flex gap-2">
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
            <button
              onClick={() => setBoardOrientation(current => current === 'white' ? 'black' : 'white')}
              className="p-2 rounded hover:bg-secondary/20"
              title="Flip board"
            >
              ↻
            </button>
          </div>

          {/* Next Moves  */}
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
                    className="flex items-center justify-between p-2 hover:bg-secondary/50 rounded"
                  >
                    <div className="w-full grid grid-cols-6 gap-2">
                      <span className="font-mono col-span-1 cursor-pointer"
                        onClick={() => onDrop(move.last_move)}
                      >{move.last_move}</span>
                      <span className="col-span-1 text-sm text-muted-foreground">=</span>
                      <span className="col-span-4 text-sm text-muted-foreground">comment here</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
