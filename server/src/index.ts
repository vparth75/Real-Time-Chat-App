import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const roomMap = new Map<string, Set<WebSocket>>();
const socketRoomMap = new Map<WebSocket, string>();
let userIdCounter = 0;
const socketToUserId = new Map<WebSocket, number>();

wss.on("connection", (socket: WebSocket) => {
  console.log(`user connected`)

  const userId = userIdCounter++;
  socketToUserId.set(socket, userId);
  console.log(`Assigned user ${userId} to new connection`);

  socket.send(JSON.stringify({
    type: "assignId",
    payload: { userId }
  }))

  socket.on("message", (message: string) => {
    try{

      const parsedMessage = JSON.parse(message);
      console.log(parsedMessage);

      if(parsedMessage.type === "create"){
        const roomId = parsedMessage.payload.roomId;
        console.log(`User created room: ${roomId}`);

        // remove from old room
        const oldRoomId = socketRoomMap.get(socket);

        if(oldRoomId){
          roomMap.get(oldRoomId)?.delete(socket)
          
          if(roomMap.get(oldRoomId)?.size === 0){
            roomMap.delete(oldRoomId);
          } 
        }

        // adding to new room
        if(!roomMap.has(roomId)){
          roomMap.set(roomId, new Set())
        }
        roomMap.get(roomId)!.add(socket);
        socketRoomMap.set(socket, roomId);
      }

      if(parsedMessage.type === "join"){
        const roomId = parsedMessage.payload.roomId;
        console.log(`User trying to join room: ${roomId}`)

        if(roomMap.has(roomId)){
          // remove from old room
          const oldRoomId = socketRoomMap.get(socket);

          if (oldRoomId) {
            roomMap.get(oldRoomId)?.delete(socket)

            if (roomMap.get(oldRoomId)?.size === 0) {
              roomMap.delete(oldRoomId);
            }
          }

          roomMap.get(roomId)?.add(socket);
          socketRoomMap.set(socket, roomId);

          console.log(`User joined room: ${roomId}`);

        } else {

          socket.send(JSON.stringify({
            type: "error",
            message: "Room does not exist"
          }));

          console.log(`User could not join: ${roomId}`);

          return;
        }
      }

      if(parsedMessage.type === "chat"){
        const textData = parsedMessage.payload.message;
        const roomId = socketRoomMap.get(socket);
        const senderId = socketToUserId.get(socket);

        if(!roomId || !senderId) return;
        const getRoomMembers = roomMap.get(roomId);
        console.log(`Room ${roomId} members: ${getRoomMembers?.size}`);

        // if(getRoomMembers?.size === 1){
        //   console.log("Your the only one in your room :(");
        //   return;
        // }

        getRoomMembers?.forEach(client => {
          if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify({
              type: "chat",
              payload: {
                senderId,
                message: textData
              }
            }));
          } else {
            console.log(`There was an error connecting to the WSS`)
          };
        });
      };
    } catch(error) {
      console.error(`Error processing messgage: ${error}`)
    }
  })

  socket.on("close", () => {
    const userId = socketToUserId.get(socket);
    console.log(`User ${userId} disconnected`)
    const roomId = socketRoomMap.get(socket);

    if(roomId){
      const roomSet = roomMap.get(roomId);
      if(roomSet){
        roomSet.delete(socket)
        if(roomSet.size === 0){
          roomMap.delete(roomId);
        }
      }
    }
    socketToUserId.delete(socket);
    socketRoomMap.delete(socket);
  })
})