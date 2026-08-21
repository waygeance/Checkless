# Game Rules

Checkless is a fast-paced, real-time variant of chess where both players move simultaneously. It removes the concept of turns and checkmate, replacing them with independent cooldown timers and a singular win condition: capturing the opponent's king.

## Core Mechanics

### 1. No Turns (Simultaneous Play)
Players do not take turns. Instead, both players can move at the same time, provided their personal cooldown timer has reached zero.
- You can move any of your pieces if your timer is ready (0.0s).
- Your opponent can move their pieces at the exact same time.

### 2. Independent Timers
Each player has a personal timer. The timer acts as a cooldown mechanism.
- The game offers three casual variants: **1-second**, **3-second**, and **5-second** cooldowns.
- When you make a move, your timer resets to the maximum value of the variant (e.g., 3 seconds).
- You cannot make another move until your timer ticks down back to zero.

### 3. Premoves
Because speed and timing are critical, you can queue up your next move while your timer is still counting down.
- Select a piece and its destination while your timer is active.
- The board will highlight your intended premove.
- The moment your timer reaches zero, the server will automatically attempt to execute your premoved action.
- If the move is no longer valid (e.g., the piece was captured, or the destination is blocked), the premove is cancelled.

### 4. Winning (King Capture)
Check and checkmate do not exist in Checkless.
- The game ends immediately when a player captures the opponent's King.
- You do not have to warn the opponent that they are in "check."
- If you move your King into danger, the opponent can capture it on their next available move.

## Move Validation
All standard chess piece movement rules apply (e.g., Knights move in L-shapes, Bishops diagonally, etc.). 
- The server validates every move to prevent illegal moves.
- Castling, en passant, and pawn promotion rules are maintained, though their strategic value changes significantly in a real-time environment.
