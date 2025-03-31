import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

// Maps to manage rooms and user associations
const roomMap = new Map<string, Set<WebSocket>>(); // roomId -> Set<WebSocket>
const socketRoomMap = new Map<WebSocket, string>(); // WebSocket -> roomId
let userIdCounter = 0; // Simple counter for assigning unique user IDs
const socketToUserId = new Map<WebSocket, number>(); // WebSocket -> userId

wss.on("connection", (socket: WebSocket) => {
  console.log(`User connected`);

  const userId = userIdCounter++;
  socketToUserId.set(socket, userId);
  console.log(`Assigned user ${userId} to new connection`);

  // Send the assigned user ID back to the client
  socket.send(JSON.stringify({
    type: "assignId",
    payload: { userId }
  }));

  socket.on("message", (message: string) => {
    try{
      const parsedMessage = JSON.parse(message);

      // Handle room creation
      if(parsedMessage.type === "create"){
        const roomId = parsedMessage.payload.roomId;
        const senderId = socketToUserId.get(socket); // Should always exist here
        console.log(`User ${senderId} created room: ${roomId}`);

        // Remove user from any previous room
        const oldRoomId = socketRoomMap.get(socket);
        if(oldRoomId){
          const oldRoom = roomMap.get(oldRoomId);
          oldRoom?.delete(socket);
          // Clean up empty room
          if(oldRoom?.size === 0){
            roomMap.delete(oldRoomId);
            console.log(`Cleaned up empty room: ${oldRoomId}`);
          }
        }

        // Add user to the new room
        if(!roomMap.has(roomId)){
          // Create room if it doesn't exist
          const newRoom = new Set([socket]);
          roomMap.set(roomId, newRoom);
        } else {
          // Add to existing room
          roomMap.get(roomId)?.add(socket);
        }
        socketRoomMap.set(socket, roomId); // Update user's current room

      }

      // Handle room joining
      else if(parsedMessage.type === "join"){
        const roomId = parsedMessage.payload.roomId;
        const senderId = socketToUserId.get(socket);

        console.log(`User ${senderId} attempting to join room: ${roomId}`);

        if(roomMap.has(roomId)){
          // Remove user from previous room
          const oldRoomId = socketRoomMap.get(socket);
          if (oldRoomId) {
            const oldRoom = roomMap.get(oldRoomId);
            oldRoom?.delete(socket);
             // Clean up empty room
            if (oldRoom?.size === 0) {
              roomMap.delete(oldRoomId);
              console.log(`Cleaned up empty room: ${oldRoomId}`);
            }
          }

          // Add user to the target room
          roomMap.get(roomId)?.add(socket);
          socketRoomMap.set(socket, roomId); // Update user's current room

          console.log(`User ${senderId} successfully joined room: ${roomId}`);

        } else {
          // Room does not exist error
          socket.send(JSON.stringify({
            type: "error",
            message: `Room "${roomId}" does not exist.`
          }));
          console.log(`User ${senderId} failed to join non-existent room: ${roomId}`);
          return; // Stop processing if room doesn't exist
        }
      }

      // Handle chat messages
      else if(parsedMessage.type === "chat"){
        const textData = parsedMessage.payload.message;
        const roomId = socketRoomMap.get(socket);
        const senderId = socketToUserId.get(socket);

        // Validate necessary data exists before proceeding
        // Note: Must check for undefined specifically, as `senderId` can be 0 (falsy)
        if(roomId === undefined || senderId === undefined) {
          console.error(`Error sending chat: Missing roomId (${roomId}) or senderId (${senderId}) for socket.`);
           // Optionally inform the client
           socket.send(JSON.stringify({ type: "error", message: "Could not send message: missing user or room association." }));
          return;
        }

        const roomMembers = roomMap.get(roomId);
        if(!roomMembers) {
           console.error(`Error sending chat: Room ${roomId} not found in roomMap.`);
           // Optionally inform the client
           socket.send(JSON.stringify({ type: "error", message: `Could not send message: room "${roomId}" not found.` }));
          return;
        }

        // send message to all clients in the room
        // console.log(`Broadcasting message from user ${senderId} to room ${roomId} (${roomMembers.size} members)`);
        roomMembers.forEach(client => {
          if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify({
              type: "chat",
              payload: {
                senderId: senderId,
                message: textData
              }
            }));
          } else {
            // Log if a client in the room is not connected (might indicate cleanup needed)
            console.warn(`Skipping message send to non-open socket in room ${roomId}`);
          }
        });
      };

    } catch(error) {
      console.error(`Error processing message: ${error instanceof Error ? error.message : String(error)}`);
    
      socket.send(JSON.stringify({ type: "error", message: "Error processing your request." }));
    }
  })

  socket.on("close", () => {
    const userId = socketToUserId.get(socket);
    const roomId = socketRoomMap.get(socket);
    console.log(`User ${userId !== undefined ? userId : '?'} disconnected (was in room ${roomId ? roomId : 'none'})`);

    // Clean up user from roomMap
    if(roomId){
      const roomSet = roomMap.get(roomId);
      if(roomSet){
        roomSet.delete(socket);
        // Clean up empty room
        if(roomSet.size === 0){
          roomMap.delete(roomId);
          console.log(`Cleaned up empty room: ${roomId}`);
        }
      }
    }
    // Clean up user from tracking maps
    socketToUserId.delete(socket);
    socketRoomMap.delete(socket);
  })

  socket.on('error', (error) => {
    const userId = socketToUserId.get(socket);
    console.error(`WebSocket error for user ${userId !== undefined ? userId : '?'}: ${error.message}`);
    
  });
})

console.log(`WebSocket server started on port ${wss.options.port}`);