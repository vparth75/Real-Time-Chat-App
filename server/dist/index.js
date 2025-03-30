"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const roomMap = new Map();
const socketRoomMap = new Map();
let userIdCounter = 0;
const socketToUserId = new Map();
wss.on("connection", (socket) => {
    console.log(`user connected`);
    const userId = userIdCounter++;
    socketToUserId.set(socket, userId);
    console.log(`Assigned user ${userId} to new connection`);
    socket.send(JSON.stringify({
        type: "assignId",
        payload: { userId }
    }));
    socket.on("message", (message) => {
        var _a, _b, _c, _d, _e;
        try {
            const parsedMessage = JSON.parse(message);
            console.log(parsedMessage);
            if (parsedMessage.type === "create") {
                const roomId = parsedMessage.payload.roomId;
                console.log(`User created room: ${roomId}`);
                // remove from old room
                const oldRoomId = socketRoomMap.get(socket);
                if (oldRoomId) {
                    (_a = roomMap.get(oldRoomId)) === null || _a === void 0 ? void 0 : _a.delete(socket);
                    if (((_b = roomMap.get(oldRoomId)) === null || _b === void 0 ? void 0 : _b.size) === 0) {
                        roomMap.delete(oldRoomId);
                    }
                }
                // adding to new room
                if (!roomMap.has(roomId)) {
                    roomMap.set(roomId, new Set());
                }
                roomMap.get(roomId).add(socket);
                socketRoomMap.set(socket, roomId);
            }
            if (parsedMessage.type === "join") {
                const roomId = parsedMessage.payload.roomId;
                console.log(`User trying to join room: ${roomId}`);
                if (roomMap.has(roomId)) {
                    // remove from old room
                    const oldRoomId = socketRoomMap.get(socket);
                    if (oldRoomId) {
                        (_c = roomMap.get(oldRoomId)) === null || _c === void 0 ? void 0 : _c.delete(socket);
                        if (((_d = roomMap.get(oldRoomId)) === null || _d === void 0 ? void 0 : _d.size) === 0) {
                            roomMap.delete(oldRoomId);
                        }
                    }
                    (_e = roomMap.get(roomId)) === null || _e === void 0 ? void 0 : _e.add(socket);
                    socketRoomMap.set(socket, roomId);
                    console.log(`User joined room: ${roomId}`);
                }
                else {
                    socket.send(JSON.stringify({
                        type: "error",
                        message: "Room does not exist"
                    }));
                    console.log(`User could not join: ${roomId}`);
                    return;
                }
            }
            if (parsedMessage.type === "chat") {
                const textData = parsedMessage.payload.message;
                const roomId = socketRoomMap.get(socket);
                const senderId = socketToUserId.get(socket);
                if (!roomId || !senderId)
                    return;
                const getRoomMembers = roomMap.get(roomId);
                console.log(`Room ${roomId} members: ${getRoomMembers === null || getRoomMembers === void 0 ? void 0 : getRoomMembers.size}`);
                // if(getRoomMembers?.size === 1){
                //   console.log("Your the only one in your room :(");
                //   return;
                // }
                getRoomMembers === null || getRoomMembers === void 0 ? void 0 : getRoomMembers.forEach(client => {
                    if (client.readyState === ws_1.WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "chat",
                            payload: {
                                senderId,
                                message: textData
                            }
                        }));
                    }
                    else {
                        console.log(`There was an error connecting to the WSS`);
                    }
                    ;
                });
            }
            ;
        }
        catch (error) {
            console.error(`Error processing messgage: ${error}`);
        }
    });
    socket.on("close", () => {
        const userId = socketToUserId.get(socket);
        console.log(`User ${userId} disconnected`);
        const roomId = socketRoomMap.get(socket);
        if (roomId) {
            const roomSet = roomMap.get(roomId);
            if (roomSet) {
                roomSet.delete(socket);
                if (roomSet.size === 0) {
                    roomMap.delete(roomId);
                }
            }
        }
        socketToUserId.delete(socket);
        socketRoomMap.delete(socket);
    });
});
