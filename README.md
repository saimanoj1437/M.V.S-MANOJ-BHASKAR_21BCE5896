# M.V.S-MANOJ-BHASKAR_21BCE5896

Here’s a structured README that includes setup and run instructions for both the client and server:

Overview:

This project is a turn-based game played on a 5x5 grid where two players control teams of characters. Each player’s team includes Pawns, Hero1, and Hero2 with specific movement rules. The game uses WebSocket for real-time communication between the client and server.

Setup and Run Instructions

1)Server Setup
Prerequisites:

Ensure you have Node.js installed.

2)Clone the Repository:

git clone <repository_url>
cd <repository_directory>


3)Install Dependencies:

npm install
Run the Server:
npm start


4)Web Client Setup
  Build the Client:
Navigate to the client directory if separate from the server.
npm install
Run the Client:
npm start
Open your web browser and go to http://localhost:8000(EXample)
Build the Client:

Navigate to the client directory if separate from the server.
Ensure all dependencies are installed by running:

npm install
npm start


WebSocket Communication
Event Types:
Game Initialization: Initializes the game and sets up player connections.
Player Move: Handles move commands and updates game state.
Game State Update: Broadcasts the updated game state to all connected clients.
Invalid Move Notification: Informs players of invalid moves.
Game Over Notification: Announces the end of the game and the winner.
Game Rules
Characters and Movement:

Pawn: Moves one block in any direction (L, R, F, B).
Hero1: Moves two blocks straight in any direction (L, R, F, B) and can remove opponent's characters in its path.
Hero2: Moves two blocks diagonally in any direction (FL, FR, BL, BR) and can remove opponent's characters in its path.
Game Flow:

Players arrange characters on their starting row.
Players alternate turns, making one move per turn.
Combat occurs if a character moves to an occupied space, removing the opponent’s character.
Invalid Moves:

Moves are invalid if the character doesn’t exist, goes out of bounds, isn’t valid for the character type, or targets a friendly character.
Winning the Game:

The game ends when one player eliminates all opponent’s characters.


