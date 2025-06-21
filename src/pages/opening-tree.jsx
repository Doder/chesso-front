import classNames from "classnames";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SquareChevronUp,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { getNextPositions, commentPosition, deleteMove } from "@/api/positions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import moveSound from "@/assets/move.mp3";

function getSanMoveFromFens(fromFen, toFen) {
  const chess = new Chess(fromFen);
  const moves = chess.moves({ verbose: true });
  for (const move of moves) {
    if (move.after === toFen) {
      return move.san;
    }
  }
  console.warn("No move found from FEN:", fromFen, "to FEN:", toFen);
  return null;
}

export function OpeningTree({ openingId, openingName, repertoireId, side }) {
  const [game, setGame] = useState(() => new Chess());
  const [position, setPosition] = useState(game.fen());
  const prevPosition = useRef(null);
  const [history, setHistory] = useState([]);
  const [currentMove, setCurrentMove] = useState(-1);
  const [nextMoves, setNextMoves] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [moveEvaluations, setMoveEvaluations] = useState({});
  const [openDropdownMoveId, setOpenDropdownMoveId] = useState(null);
  const [moveComments, setMoveComments] = useState({});
  const [editingCommentMoveId, setEditingCommentMoveId] = useState(null);
  const [positionComment, setPositionComment] = useState("");
  const [currentPositionId, setCurrentPositionId] = useState(null);

  const moveSoundRef = useRef(null);
  useEffect(() => {
    moveSoundRef.current = new Audio(moveSound);
  }, []);

  const processAndSetNextMoves = useCallback(
    (apiNextMoves) => {
      const processedMoves = apiNextMoves.map((nm) => ({
        ...nm,
        last_move: getSanMoveFromFens(position, nm.fen),
      }));
      setNextMoves(
        processedMoves?.sort((a, b) => {
          if (
            a.opening_name === openingName &&
            b.opening_name !== openingName
          ) {
            return -1;
          } else if (
            b.opening_name === openingName &&
            a.opening_name !== openingName
          ) {
            return 1;
          } else if (
            a.opening_name !== openingName &&
            b.opening_name !== openingName
          ) {
            return a.opening_name.localeCompare(b.opening_name);
          } else if (a.order === 0 && b.order !== 0) {
            return 1;
          } else if (b.order === 0 && a.order !== 0) {
            return -1;
          }
          return a.order - b.order;
        })
      );
      setMoveEvaluations((prev) => ({
        ...prev,
        ...processedMoves.reduce((acc, nm) => {
          acc[nm.ID] = nm.eval;
          return acc;
        }, {}),
      }));
      setMoveComments((prev) => ({
        ...prev,
        ...processedMoves.reduce((acc, nm) => {
          acc[nm.ID] = nm.comment;
          return acc;
        }, {}),
      }));
    },
    [position]
  );

  const updateArrows = useCallback(() => {
    if (!game || !nextMoves || nextMoves.length === 0) {
      setArrows([]);
      return;
    }

    const newArrows = [];
    const legalMoves = game.moves({ verbose: true });

    for (const nm of nextMoves) {
      const lastMove = legalMoves.find((m) => m.san === nm.last_move);
      if (lastMove) {
        const moveId = nm.ID;
        const evaluation = moveEvaluations[moveId] || "=";
        const index = nextMoves.indexOf(nm);

        const lightness = Math.min(80, 50 + index * 10);
        let hue;

        if (evaluation === "+" || evaluation === "+=") {
          hue = 120; // Green
        } else if (evaluation === "-" || evaluation === "-=") {
          hue = 0; // Red
        } else {
          // evaluation === '=' or other
          hue = 230; // Blue
        }
        const arrowColor = `hsla(${hue}, 75%, ${lightness}%, 1)`;
        newArrows.push([lastMove.from, lastMove.to, arrowColor]);
      }
    }
    setArrows(newArrows);
  }, [nextMoves, moveEvaluations, game]);

  useEffect(() => {
    updateArrows();
  }, [updateArrows]);

  const handleNewMove = (newFen) => {
    prevPosition.current = position;
    setPosition(newFen);
  };

  const fetchPositions = useCallback(
    async (fromFen, fen) => {
      try {
        const { data } = await getNextPositions(
          fromFen,
          fen,
          repertoireId,
          openingId
        );
        if (data.current_position) {
          setCurrentPositionId(data.current_position.ID);
          setPositionComment(data.current_position.comment);
        }

        if (data.message) {
          setNextMoves([]); // Clear next moves
          return;
        }
        if (data.positions.length >= 0) {
          processAndSetNextMoves(data.positions); // Use the new function for processing moves
        }
      } catch (error) {
        console.error("Error fetching positions:", error);
        setNextMoves([]);
        setPositionComment("");
      }
    },
    [repertoireId, processAndSetNextMoves]
  ); // Updated dependencies

  useEffect(() => {
    fetchPositions(prevPosition.current, position);
  }, [position]);

  const handleEvaluationChange = (moveId, evaluation) => {
    setMoveEvaluations((prev) => ({
      ...prev,
      [moveId]: evaluation,
    }));
    setOpenDropdownMoveId(null); // Close dropdown after selection
    commentPosition(moveId, evaluation, "");
  };

  const toggleDropdown = (moveId) => {
    setOpenDropdownMoveId((prev) => (prev === moveId ? null : moveId));
  };

  const handleCommentChange = (moveId, comment) => {
    setMoveComments((prev) => ({
      ...prev,
      [moveId]: comment,
    }));
  };

  const toggleCommentEdit = (moveId) => {
    if (moveId === editingCommentMoveId) {
      commentPosition(moveId, "", moveComments[moveId]);
    }
    setEditingCommentMoveId((prev) => (prev === moveId ? null : moveId));
  };

  const handleDeleteMove = async (moveId) => {
    await deleteMove(moveId);
    fetchPositions(prevPosition.current, position);
    setHistory((prev) => prev.slice(0, currentMove + 1));
  };

  const evaluationOptions = [
    { value: "=", label: "=" },
    { value: "+=", label: "+=" },
    { value: "-=", label: "-=" },
    { value: "+", label: "+" },
    { value: "-", label: "-" },
  ];

  const goToMove = (moveIndex) => {
    const newGame = new Chess();
    prevPosition.current = null;
    for (let i = 0; i <= moveIndex && i < history.length; i++) {
      newGame.move(history[i]);
      if (i === moveIndex - 1) {
        prevPosition.current = newGame.fen();
      }
    }
    setPosition(newGame.fen());
    setCurrentMove(moveIndex);
    setGame(newGame);
  };

  const goToPrevMove = () => {
    if (currentMove >= 0) {
      goToMove(currentMove - 1);
    }
  };

  const goToNextMove = () => {
    if (currentMove < history.length - 1) {
      goToMove(currentMove + 1);
    }
  };

  const goToStart = () => {
    goToMove(-1);
  };

  const goToEnd = () => {
    goToMove(history.length - 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        goToPrevMove();
      } else if (e.key === "ArrowRight") {
        goToNextMove();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextMove, goToPrevMove]);

  const [copySuccess, setCopySuccess] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState(
    side === "b" ? "black" : "white"
  );

  function onDrop(sourceSquare, targetSquare) {
    try {
      let move;

      if (
        typeof sourceSquare === "string" &&
        typeof targetSquare === "undefined"
      ) {
        // If only one parameter is passed, treat it as SAN notation
        move = game.move(sourceSquare);
      } else {
        // Otherwise treat as coordinate notation (from-to squares)
        move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
      }

      if (move === null) return false;
      handleNewMove(game.fen());
      const newHistory = game.history();
      setHistory(newHistory);
      setCurrentMove(newHistory.length - 1);
      if (moveSoundRef.current) {
        moveSoundRef.current.currentTime = 0;
        moveSoundRef.current.play();
      }
      return true;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    nextMoves.forEach((move, index) => {
      if (
        move.opening_name === openingName &&
        (!move.order || move.order === 0 || move.order !== index + 1)
      ) {
        commentPosition(move.ID, "", "", index + 1).catch((e) => {
          console.error(e);
        });
      }
    });
  }, [nextMoves, openingName]);

  const handleMoveUp = (moveId) => {
    setNextMoves((prev) => {
      const newNextMoves = [...prev];
      const moveIndex = prev.findIndex((nm) => nm.ID === moveId);
      const move = prev[moveIndex];
      newNextMoves.splice(moveIndex, 1);
      newNextMoves.splice(moveIndex - 1, 0, move);
      if (moveIndex === -1 || moveIndex === 0) {
        return prev;
      }
      return newNextMoves;
    });
  };

  return (
    <div className="lg:container">
      <div className="lg:flex gap-6">
        <div className="flex-1 mb-4">
          <Chessboard
            position={position}
            onPieceDrop={onDrop}
            boardOrientation={boardOrientation}
            customDarkSquareStyle={{ backgroundColor: "#D3D3D3" }}
            customLightSquareStyle={{ backgroundColor: "#EBEBEB" }}
            customBoardStyle={{
              margin: "0 auto",
              borderRadius: "5px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
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
                    const pgn = game.pgn();
                    navigator.clipboard.writeText(pgn);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {copySuccess ? "Copied!" : "Copy PGN"}
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {history.map((move, index) => {
                  const moveNumber = Math.floor(index / 2) + 1;
                  const isWhiteMove = index % 2 === 0;
                  return (
                    <div key={index} className="flex items-center">
                      {isWhiteMove && (
                        <span className="text-sm text-muted-foreground mr-1">
                          {moveNumber}.
                        </span>
                      )}
                      <button
                        onClick={() => goToMove(index)}
                        className={`px-2 py-1 rounded text-sm font-mono ${
                          currentMove === index
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary/20"
                        }`}
                      >
                        {move}
                      </button>
                    </div>
                  );
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
              onClick={() =>
                setBoardOrientation((current) =>
                  current === "white" ? "black" : "white"
                )
              }
              className="p-2 rounded hover:bg-secondary/20"
              title="Flip board"
            >
              ↻
            </button>
          </div>

          {/* Next Moves  */}
          <div className="border border-border rounded-lg">
            <div className="bg-secondary/5 border-b border-border px-4 py-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Next Moves</h2>
              </div>
            </div>
            <div>
              <div>
                {nextMoves.map((move, index, arr) => {
                  const moveId = move.ID;
                  const currentEvaluation = moveEvaluations[moveId] || "=";
                  const isDropdownOpen = openDropdownMoveId === moveId;
                  const currentComment = moveComments[moveId] || "";
                  const isEditingComment = editingCommentMoveId === moveId;
                  const isSecondaryOpening = move.opening_name !== openingName;
                  return (
                    <motion.div
                      layout
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      key={moveId}
                      className={classNames(
                        "flex items-center justify-between py-2 px-4 hover:bg-secondary/50",
                        isSecondaryOpening &&
                          arr[index - 1] &&
                          move.opening_name !== arr[index - 1].opening_name &&
                          "border-t"
                      )}
                    >
                      <div className="w-full grid grid-cols-6 gap-2">
                        <span
                          className="font-mono col-span-1 cursor-pointer"
                          onClick={() => onDrop(move.last_move)}
                        >
                          {move.last_move}
                        </span>
                        <div className="col-span-1 relative">
                          <div className="text-sm cursor-pointer relative">
                            <span
                              className="hover:bg-secondary/30 px-1 py-0.5 rounded"
                              onClick={() => toggleDropdown(moveId)}
                            >
                              {currentEvaluation}
                            </span>
                            {isDropdownOpen && (
                              <div className="absolute left-0 top-full mt-1 bg-background border border-border rounded shadow-lg z-10">
                                <div className="p-1">
                                  {evaluationOptions.map((option) => (
                                    <div
                                      key={option.value}
                                      className="px-3 py-1 hover:bg-secondary/30 cursor-pointer"
                                      onClick={() =>
                                        handleEvaluationChange(
                                          moveId,
                                          option.value
                                        )
                                      }
                                    >
                                      {option.label}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {isEditingComment ? (
                          <input
                            type="text"
                            value={currentComment}
                            onChange={(e) =>
                              handleCommentChange(moveId, e.target.value)
                            }
                            onBlur={() => toggleCommentEdit(moveId)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                toggleCommentEdit(moveId);
                              }
                            }}
                            autoFocus
                            className="col-span-3 text-sm bg-transparent border-b border-border focus:outline-none"
                            placeholder="Add comment..."
                          />
                        ) : (
                          <span
                            className={classNames(
                              "text-sm text-muted-foreground cursor-pointer hover:bg-secondary/30 px-1 py-0.5 rounded",
                              isSecondaryOpening ? "col-span-3" : "col-span-3"
                            )}
                            onClick={() => toggleCommentEdit(moveId)}
                          >
                            {currentComment || "Add comment..."}
                          </span>
                        )}
                        <span className="ml-auto flex gap-4">
                        {isSecondaryOpening ? (
                          <span className="col-span-1 text-xs text-muted-foreground bg-black/80 px-1 py-0.5 rounded text-white text-center leading-[2]">
                            {move.opening_name}
                          </span>
                        ) : (
                          index > 0 && (
                            <span title="Promote move" className="flex justify-center items-center">
                              <SquareChevronUp
                                className="w-5 h-5 cursor-pointer ml-auto text-primary"
                                onClick={() => handleMoveUp(moveId)}
                              />
                            </span>
                          )
                        )}
                          <AlertDialog>
                            <AlertDialogTrigger>
                              <Trash2 className="w-5 h-5 min-w-5 text-red-500 cursor-pointer ml-auto text-primary" />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete your opening line from this move.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMove(moveId)}
                                >
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </span>
                        
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Position comment  */}
          <div className="border border-border rounded-lg">
            <div className="bg-secondary/5 border-b border-border px-4 py-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Current Position Comment</h2>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={positionComment}
                onChange={(e) => setPositionComment(e.target.value)}
                onBlur={() => {
                  if (currentPositionId) {
                    commentPosition(
                      currentPositionId,
                      "",
                      positionComment
                    ).catch((error) =>
                        console.error("Error saving position comment:", error)
                      );
                  }
                }}
                className="w-full p-2"
                placeholder="Add position comment..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
