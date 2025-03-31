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
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            const parsedMessage = JSON.parse(message);
            console.log(parsedMessage);
            if (parsedMessage.type === "create") {
                const roomId = parsedMessage.payload.roomId;
                const senderId = socketToUserId.get(socket);
                console.log(`User ${senderId} created room: ${roomId}`);
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
                    const newRoom = new Set([socket]);
                    roomMap.set(roomId, newRoom);
                }
                else {
                    (_c = roomMap.get(roomId)) === null || _c === void 0 ? void 0 : _c.add(socket);
                }
                socketRoomMap.set(socket, roomId);
                console.log(`Room ${roomId} members after creation: ${(_d = roomMap.get(roomId)) === null || _d === void 0 ? void 0 : _d.size}`);
                console.log(`Creator's room mapping: ${socketRoomMap.get(socket)}`);
            }
            if (parsedMessage.type === "join") {
                const roomId = parsedMessage.payload.roomId;
                console.log(`User trying to join room: ${roomId}`);
                if (roomMap.has(roomId)) {
                    // remove from old room
                    const oldRoomId = socketRoomMap.get(socket);
                    if (oldRoomId) {
                        (_e = roomMap.get(oldRoomId)) === null || _e === void 0 ? void 0 : _e.delete(socket);
                        if (((_f = roomMap.get(oldRoomId)) === null || _f === void 0 ? void 0 : _f.size) === 0) {
                            roomMap.delete(oldRoomId);
                        }
                    }
                    (_g = roomMap.get(roomId)) === null || _g === void 0 ? void 0 : _g.add(socket);
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
                console.log(`Chat attempt from user ${senderId} in room ${roomId}`);
                console.log(`Socket exists in socketRoomMap: ${socketRoomMap.has(socket)}`);
                console.log(`Socket exists in socketToUserId: ${socketToUserId.has(socket)}`);
                console.log(`Actual roomId from map: ${socketRoomMap.get(socket)}`);
                console.log(`Actual senderId from map: ${socketToUserId.get(socket)}`);
                // Let's try to get the values directly from the maps
                const directRoomId = socketRoomMap.get(socket);
                const directSenderId = socketToUserId.get(socket);
                // Check specifically for undefined, as 0 is a valid senderId
                if (directRoomId === undefined || directSenderId === undefined) {
                    // Log the specific missing value for clarity
                    if (directRoomId === undefined) {
                        console.log(`Missing roomId. Socket not found in socketRoomMap.`);
                    }
                    if (directSenderId === undefined) {
                        console.log(`Missing senderId. Socket not found in socketToUserId.`);
                    }
                    return;
                }
                const getRoomMembers = roomMap.get(directRoomId);
                if (!getRoomMembers) {
                    console.log(`Room ${directRoomId} not found in roomMap`);
                    return;
                }
                console.log(`Room ${directRoomId} members: ${getRoomMembers.size}`);
                console.log(`Current member's socket in room: ${getRoomMembers.has(socket)}`);
                getRoomMembers.forEach(client => {
                    if (client.readyState === ws_1.WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "chat",
                            payload: {
                                senderId: directSenderId,
                                message: textData
                            }
                        }));
                    }
                    else {
                        console.log(`There was an error connecting to the WSS`);
                    }
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
