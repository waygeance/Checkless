# Simultaneous Chess

A real-time chess game with simultaneous move mechanics, built with Next.js, React, Node.js, and WebSockets. UI/UX inspired by Lichess.

## Game Concept

In this chess variant, players can move multiple times in a row! Each player has a timer (1s, 3s, or 5s) that resets after each move. If time expires, an auto-move is played automatically.

## Features

- **Real-time multiplayer** gameplay using WebSockets
- **Simultaneous move mechanics** - players can move multiple times
- **Timer variants**: 1 second, 3 seconds, or 5 seconds per move
- **Auto-move** when time expires
- **Lichess-inspired UI/UX** with modern design
- **Responsive design** for desktop and mobile
- **TypeScript** for type safety
- **Tailwind CSS** for styling

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, WebSocket (ws library)
- **Chess Logic**: chess.js library
- **Real-time**: WebSocket connections

## Getting Started

### Prerequisites

- Node.js 24+ (recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd simultaneous-chess
```

2. Install dependencies:

```bash
npm install
```

### Running the Application

You need to run both the WebSocket server and the Next.js development server.

#### Option 1: Run both servers simultaneously (recommended)

```bash
npm run dev:full
```

#### Option 2: Run servers separately

1. Start the WebSocket server (in one terminal):

```bash
npm run server
```

2. Start the Next.js development server (in another terminal):

```bash
npm run dev
```

3. Open your browser and navigate to:

```
http://localhost:3000
```

The WebSocket server runs on port 8080, and the Next.js app runs on port 3000.

## How to Play

1. **Select Timer Variant**: Choose between 1s, 3s, or 5s timers
2. **Find Game**: Click "Find Game" to match with another player
3. **Make Moves**: Click on your piece, then click on the destination square
4. **Timer Management**: Make your move before time runs out
5. **Simultaneous Play**: Both players have independent timers and can move multiple times

## Game Rules

- Each player has a timer (1s, 3s, or 5s) per move
- Timer resets after each valid move
- If time expires, a random legal move is automatically played
- Players can move multiple times in a row
- Standard chess rules apply for all moves
- Game ends when checkmate, stalemate, or draw occurs

## Project Structure

```
simultaneous-chess/
src/
  components/
    ChessBoard.tsx    # Chess board component with Lichess-inspired design
    Game.tsx          # Main game logic and WebSocket handling
  app/
    page.tsx          # Main application page
server.js            # WebSocket server for real-time gameplay
```

## Development

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run server` - Start WebSocket server
- `npm run dev:full` - Run both servers simultaneously
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### WebSocket API

The server uses WebSocket connections for real-time gameplay. Message types include:

- `find-game` - Find an opponent
- `move` - Make a chess move
- `timer` - Timer updates
- `game-over` - Game ended
- `opponent-disconnected` - Opponent left the game

## Future Enhancements

- [ ] Player authentication and profiles
- [ ] Game history and replay
- [ ] Tournament mode
- [ ] Chat functionality
- [ ] Different board themes
- [ ] Sound effects
- [ ] Mobile app version

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
# Checkless
