import { useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'

export function OpeningTree() {
  const [game, setGame] = useState(new Chess())

  function onDrop(sourceSquare, targetSquare) {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      })

      if (move === null) return false
      setGame(new Chess(game.fen()))
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-4">Opening Tree</h1>
      <div className="flex gap-6">
        <div className="w-2/3">
          <div className="aspect-square">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              boardWidth={800}
            />
          </div>
        </div>
        <div className="w-1/3 bg-secondary/10 rounded-lg p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Opening Explorer</h2>
              <span className="text-sm text-muted-foreground">Master Games</span>
            </div>
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
      </div>
    </div>
  )
}
