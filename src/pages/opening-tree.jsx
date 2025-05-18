import { useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'

export function OpeningTree() {
  const [game] = useState(() => new Chess())
  const [position, setPosition] = useState(game.fen())
  const [history, setHistory] = useState([])
  const [copySuccess, setCopySuccess] = useState(false)

  function onDrop(sourceSquare, targetSquare) {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      })

      if (move === null) return false
      setPosition(game.fen())
      setHistory(game.history())
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="container py-6">
      <div className="flex gap-6">
        <div className="w-2/3">
            <Chessboard
              position={position}
              onPieceDrop={onDrop}
              boardWidth={window.innerHeight - 200}
              customDarkSquareStyle={{ backgroundColor: '#D3D3D3' }}
              customLightSquareStyle={{ backgroundColor: '#EBEBEB' }}
              boardStyle={{
                borderRadius: '5px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            />
        </div>
        <div className="w-1/3 space-y-4">
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/5 border-b border-border px-4 py-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Opening Explorer</h2>
                <span className="text-sm text-muted-foreground">Master Games</span>
              </div>
            </div>
            <div className="p-4 space-y-4">

              <div className="space-y-2">
                {/* Mock opening moves */}
                <div className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">e4</span>
                    <span className="text-sm text-muted-foreground">King's Pawn</span>
                  </div>
                  <span className="text-sm">44%</span>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">d4</span>
                    <span className="text-sm text-muted-foreground">Queen's Pawn</span>
                  </div>
                  <span className="text-sm">35%</span>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">Nf3</span>
                    <span className="text-sm text-muted-foreground">Reti Opening</span>
                  </div>
                  <span className="text-sm">15%</span>
                </div>
              </div>
            </div>
          </div>

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
              <div className="font-mono leading-relaxed flex flex-wrap gap-y-2">
                {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => {
                  const moveNumber = i + 1
                  const whiteMove = history[i * 2]
                  const blackMove = history[i * 2 + 1]
                  
                  return (
                    <span key={i} className="mr-3 inline-flex items-center">
                      <span className="text-sm text-muted-foreground">{moveNumber}.</span>
                      <span className="ml-1">{whiteMove}</span>
                      {blackMove && <span className="ml-2">{blackMove}</span>}
                    </span>
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
