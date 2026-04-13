'use client';

import { useEffect, useState } from 'react';
import ChessBoard from './ChessBoard';

interface GameState {
  roomId: string;
  color: 'white' | 'black';
  opponentColor: 'white' | 'black';
  timerVariant: number;
  fen: string;
  turn: 'white' | 'black';
  timeLeft: number;
  isMyTurn: boolean;
}

export default function Game() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'waiting' | 'playing' | 'disconnected'>('connecting');
  const [timerVariant, setTimerVariant] = useState<1 | 3 | 5>(3);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Connect to WebSocket server
    const websocket = new WebSocket('ws://localhost:8080');
    
    websocket.onopen = () => {
      setWs(websocket);
      setConnectionStatus('connected');
      console.log('Connected to game server');
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };
    
    websocket.onclose = () => {
      setConnectionStatus('disconnected');
      console.log('Disconnected from game server');
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
    
    return () => {
      websocket.close();
    };
  }, []);

  const handleMessage = (data: any) => {
    switch (data.type) {
      case 'connected':
        console.log('Player ID:', data.playerId);
        break;
        
      case 'waiting':
        setConnectionStatus('waiting');
        setMessage('Waiting for opponent...');
        break;
        
      case 'game-found':
        setGameState({
          roomId: data.roomId,
          color: data.color,
          opponentColor: data.opponentColor,
          timerVariant: data.timerVariant,
          fen: data.fen,
          turn: 'white',
          timeLeft: data.timerVariant,
          isMyTurn: data.color === 'white'
        });
        setConnectionStatus('playing');
        setMessage('');
        break;
        
      case 'move':
        if (gameState) {
          setGameState({
            ...gameState,
            fen: data.fen,
            turn: data.turn,
            isMyTurn: gameState.color === data.turn
          });
        }
        if (data.forced) {
          setMessage('Time expired! Auto-move made.');
          setTimeout(() => setMessage(''), 3000);
        }
        break;
        
      case 'timer':
        if (gameState) {
          setGameState({
            ...gameState,
            timeLeft: data.timeLeft,
            isMyTurn: data.isMyTurn
          });
        }
        break;
        
      case 'game-over':
        setConnectionStatus('disconnected');
        const resultMessage = data.result === 'draw' ? 'Game ended in a draw!' :
                            data.result === 'white-wins' ? 'White wins!' :
                            data.result === 'black-wins' ? 'Black wins!' :
                            'Game over!';
        setMessage(resultMessage);
        break;
        
      case 'opponent-disconnected':
        setConnectionStatus('disconnected');
        setMessage('Opponent disconnected. Game ended.');
        break;
        
      case 'error':
        setMessage(`Error: ${data.message}`);
        setTimeout(() => setMessage(''), 3000);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handleFindGame = () => {
    if (ws && connectionStatus === 'connected') {
      ws.send(JSON.stringify({
        type: 'find-game',
        timerVariant
      }));
    }
  };

  const handleMove = (move: string) => {
    if (ws && gameState) {
      ws.send(JSON.stringify({
        type: 'move',
        move,
        roomId: gameState.roomId
      }));
    }
  };

  const handleNewGame = () => {
    setGameState(null);
    setConnectionStatus('connected');
    setMessage('');
  };

  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-2xl">Connecting to game server...</div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">Disconnected from server</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-400">Simultaneous Chess</h1>
            {gameState && (
              <div className="text-sm">
                <span className="text-gray-400">Room:</span> <span className="text-green-400">{gameState.roomId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {connectionStatus === 'connected' && !gameState && (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Welcome to Simultaneous Chess!</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                In this variant, players can move multiple times in a row! 
                Each player has a timer (1s, 3s, or 5s) that resets after each move.
                Make your move before time runs out or an auto-move will be played!
              </p>
            </div>

            {/* Timer Selection */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Select Timer Variant:</h3>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setTimerVariant(1)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    timerVariant === 1 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  1 Second
                </button>
                <button
                  onClick={() => setTimerVariant(3)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    timerVariant === 3 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  3 Seconds
                </button>
                <button
                  onClick={() => setTimerVariant(5)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    timerVariant === 5 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  5 Seconds
                </button>
              </div>
            </div>

            {/* Find Game Button */}
            <button
              onClick={handleFindGame}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all transform hover:scale-105"
            >
              Find Game
            </button>
          </div>
        )}

        {connectionStatus === 'waiting' && (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Finding Opponent...</h2>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
              <p className="text-gray-300">Looking for a player with {timerVariant}s timer...</p>
            </div>
          </div>
        )}

        {gameState && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Game Board */}
            <div className="flex-1 flex justify-center">
              <ChessBoard
                onMove={handleMove}
                playerColor={gameState.color}
                timer={gameState.timeLeft}
                isMyTurn={gameState.isMyTurn}
              />
            </div>

            {/* Game Info */}
            <div className="lg:w-80 space-y-6">
              {/* Player Info */}
              <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-bold text-center">Game Info</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Color:</span>
                    <span className={`font-semibold capitalize ${gameState.color === 'white' ? 'text-gray-200' : 'text-gray-800 bg-gray-200 px-2 rounded'}`}>
                      {gameState.color}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timer:</span>
                    <span className="font-semibold">{gameState.timerVariant}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Turn:</span>
                    <span className={`font-semibold capitalize ${gameState.turn === 'white' ? 'text-gray-200' : 'text-gray-800 bg-gray-200 px-2 rounded'}`}>
                      {gameState.turn}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rules */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-center mb-4">Rules</h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>Each player has {gameState.timerVariant}s per move</li>
                  <li>Timer resets after each move</li>
                  <li>If time expires, a random move is played</li>
                  <li>Players can move multiple times in a row</li>
                  <li>Standard chess rules apply</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {message}
          </div>
        )}

        {/* Game Over Actions */}
        {connectionStatus === 'disconnected' && gameState && (
          <div className="text-center space-y-4">
            <button
              onClick={handleNewGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all"
            >
              New Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
