import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, User, Cpu, RefreshCw } from 'lucide-react';

type Player = 'X' | 'O' | null;
type GameMode = 'pvp' | 'pve';
type Difficulty = 'easy' | 'medium' | 'hard';

const SOUNDS = {
  win: '/tumb.mp3',
  lose: '/fahhhhh-3.mp3',
  draw: '/rom-rom-bhaiyo.mp3',
  move: 'https://actions.google.com/sounds/v1/cartoon/pop.ogg'
};

function calculateWinner(squares: Player[]) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: lines[i] };
    }
  }
  if (!squares.includes(null)) {
    return { winner: 'Draw', line: [] };
  }
  return null;
}

function minimax(squares: Player[], depth: number, isMaximizing: boolean): number {
  const result = calculateWinner(squares);
  if (result?.winner === 'O') return 10 - depth;
  if (result?.winner === 'X') return depth - 10;
  if (result?.winner === 'Draw') return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'O';
        const score = minimax(squares, depth + 1, false);
        squares[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        squares[i] = 'X';
        const score = minimax(squares, depth + 1, true);
        squares[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function getBestMove(squares: Player[]): number {
  let bestScore = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      squares[i] = 'O';
      const score = minimax(squares, 0, false);
      squares[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

function getRandomMove(squares: Player[]): number {
  const available = squares.map((val, idx) => val === null ? idx : null).filter(val => val !== null) as number[];
  if (available.length === 0) return -1;
  return available[Math.floor(Math.random() * available.length)];
}

function getAIMove(squares: Player[], difficulty: Difficulty): number {
  if (difficulty === 'easy') {
    return getRandomMove(squares);
  } else if (difficulty === 'medium') {
    return Math.random() > 0.5 ? getBestMove(squares) : getRandomMove(squares);
  } else {
    return getBestMove(squares);
  }
}

export default function App() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [gameMode, setGameMode] = useState<GameMode>('pve');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  const result = calculateWinner(board);
  const winner = result?.winner;
  const winningLine = result?.line || [];

  const playSound = useCallback((type: keyof typeof SOUNDS) => {
    if (!soundEnabled) return;
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play failed:", e));
  }, [soundEnabled]);

  useEffect(() => {
    if (winner) {
      if (winner === 'Draw') {
        playSound('draw');
      } else if (gameMode === 'pve' && winner === 'O') {
        playSound('lose'); // AI wins
      } else {
        playSound('win'); // Player wins or Pvp win
      }
    }
  }, [winner, gameMode, playSound]);

  const handleClick = (i: number) => {
    if (board[i] || winner) return;

    // If playing against AI and it's O's turn, ignore clicks
    if (gameMode === 'pve' && !xIsNext) return;

    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
    playSound('move');
  };

  useEffect(() => {
    if (gameMode === 'pve' && !xIsNext && !winner) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(board, difficulty);
        if (aiMove !== -1) {
          const newBoard = [...board];
          newBoard[aiMove] = 'O';
          setBoard(newBoard);
          setXIsNext(true);
          playSound('move');
        }
      }, 500); // Small delay for realism
      return () => clearTimeout(timer);
    }
  }, [xIsNext, gameMode, board, winner, difficulty, playSound]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center py-12 px-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Tic Tac Toe
          </h1>
          <p className="text-slate-400 font-medium h-6">
            {gameMode === 'pve' ? 'Beat the AI if you can!' : 'Challenge a friend!'}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => { setGameMode('pve'); resetGame(); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${gameMode === 'pve' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Cpu size={16} /> vs AI
              </button>
              <button 
                onClick={() => { setGameMode('pvp'); resetGame(); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${gameMode === 'pvp' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <User size={16} /> vs Friend
              </button>
            </div>

            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>

          {gameMode === 'pve' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex justify-center gap-2 pt-2 border-t border-slate-800 overflow-hidden"
            >
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => { setDifficulty(diff); resetGame(); }}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    difficulty === diff 
                      ? diff === 'easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                        : diff === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                      : 'bg-slate-800 text-slate-500 border border-transparent hover:bg-slate-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Status */}
        <div className="text-center h-8 flex items-center justify-center">
          {winner ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-2xl font-bold ${winner === 'Draw' ? 'text-slate-300' : winner === 'X' ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`}
            </motion.div>
          ) : (
            <div className="text-lg font-medium text-slate-300 flex items-center gap-2">
              <span className={xIsNext ? 'text-emerald-400' : 'text-rose-400'}>
                {xIsNext ? 'X' : 'O'}
              </span>
              's turn
            </div>
          )}
        </div>

        {/* Board */}
        <div className="bg-slate-800 p-3 rounded-2xl shadow-2xl border border-slate-700 mx-auto w-full max-w-[340px]">
          <div className="grid grid-cols-3 gap-2">
            {board.map((cell, i) => {
              const isWinningCell = winningLine.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleClick(i)}
                  disabled={!!winner || !!cell || (gameMode === 'pve' && !xIsNext)}
                  className={`h-24 sm:h-28 rounded-xl flex items-center justify-center text-5xl sm:text-6xl font-black transition-all duration-200
                    ${!cell && !winner && (gameMode === 'pvp' || xIsNext) ? 'hover:bg-slate-700 active:scale-95 cursor-pointer' : 'cursor-default'}
                    ${isWinningCell ? 'bg-slate-700 shadow-inner' : 'bg-slate-900 shadow-sm'}
                  `}
                >
                  {cell && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cell === 'X' ? 'text-emerald-400' : 'text-rose-400'}
                    >
                      {cell}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        <div className="flex justify-center pt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors shadow-lg border border-slate-700"
          >
            <RefreshCw size={18} />
            Play Again
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
