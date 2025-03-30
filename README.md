## Project Structure

- **Client (Frontend):** Located in the `client` directory, built with React and Vite.
- **Server (Backend):** Located in the `server` directory, built with Node.js and WebSocket.

## Technologies Used

- **Frontend:**
  - React
  - TypeScript
  - Vite
  - Tailwind CSS

- **Backend:**
  - Node.js
  - WebSocket
  - TypeScript

## Key Features

- **Real-time Messaging:** Utilizes WebSocket for real-time communication between clients.
- **Room Management:** Users can create and join chat rooms.
- **User Identification:** Each user is assigned a unique ID upon connection.
- **Message Differentiation:** Messages are displayed differently based on the sender.

## Recent Updates

### WebSocket Management

- **Connection Handling:** Improved WebSocket connection management by ensuring only one active connection per client. Existing connections are closed before establishing new ones.
- **State Management:** WebSocket connections are managed using React state to ensure proper re-rendering and cleanup.

### Message Handling

- **Structured Messages:** Messages are now stored as objects containing both the message and the sender's ID.
- **Rendering Logic:** Updated the rendering logic in `Chats.tsx` to differentiate messages sent by the current user from those sent by others.

### User ID Assignment

- **Backend Changes:** The server assigns a unique user ID to each client upon connection, which is then communicated to the client.
- **Frontend Changes:** The client stores its own user ID upon receiving it from the server, allowing for message differentiation.

### Error Handling

- **Connection State Check:** Added checks to ensure the WebSocket connection is open before attempting to send messages, preventing silent failures.

## How to Run

### Prerequisites

- Node.js
- npm or yarn

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/chat-application.git
   cd chat-application
   ```

2. **Install dependencies:**
   ```bash
   cd client
   npm install
   cd ../server
   npm install
   ```

3. **Run the server:**
   ```bash
   npm run dev
   ```

4. **Run the client:**
   ```bash
   cd ../client
   npm run dev
   ```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:5173`.
