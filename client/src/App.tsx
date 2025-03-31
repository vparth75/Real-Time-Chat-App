import { useRef, useState, useEffect } from "react";
import { CreateRoom } from "./components/CreateRoom"
import SendButton from "./assets/SendButton";
import Chats from "./components/Chats";

function App() {
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [roomId, setRoomId] = useState<string>("");
  const inputJoinRef = useRef<HTMLInputElement>(null);
  const inputSendRef = useRef<HTMLInputElement>(null);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const connectWebSocket = (currentRoomId: string, messageType: "create" | "join") => {
    if (webSocket) {
      webSocket.close();
    }

    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({
        type: messageType,
        payload: { roomId: currentRoomId }
      }));
    };
    
    ws.onmessage = (event) => {
      try{
        const data = JSON.parse(event.data);
        if(data.type === "assignId"){
          console.log(`Your user Id is ${data.payload.userId}`)
          setUserId(data.payload.userId);
          setWebSocket(ws);
          ws.onmessage = null;
        }
      } catch (error){
        console.log(`error processing initial message form App: ${error}`)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWebSocket(null);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setWebSocket(null);
    };
  }

  const handleCreateRoom = () => {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const idLength = 8;
    let i = 0;
    let randomRoomId = "";
    while (i <= idLength) {
      randomRoomId += characters.charAt(Math.floor(Math.random() * characters.length));
      i++;
    }
    setRoomId(randomRoomId);
    setIsPopupOpen(true);
    connectWebSocket(randomRoomId, "create");
  };

  const handleJoinRoom = () => {
    if (!inputJoinRef.current?.value) {
      console.log("No room ID entered to join");
      return;
    }
    const roomToJoin = inputJoinRef.current.value;
    setRoomId(roomToJoin);
    connectWebSocket(roomToJoin, "join");

    inputJoinRef.current.value = '';
  };

  const sendMessage = () => {
    if (!inputSendRef.current?.value) {
      console.log("No message to send");
      return;
    }
    if (!webSocket) {
      console.log("No WebSocket connection");
      return;
    }

    if (webSocket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket connection is not open. State:", webSocket.readyState);
      return;
   }

    console.log("Sending message:", inputSendRef.current.value);
    webSocket.send(JSON.stringify({
      type: "chat",
      payload: {
        message: inputSendRef.current.value
      }
    }));
    inputSendRef.current.value = "";
  }

  useEffect(() => {
    return () => {
      webSocket?.close();
    };
  }, [webSocket]);

  return (
    <div className={`${isPopupOpen ? 'bg-neutral-950' : 'bg-neutral-900'} ${isPopupOpen ? 'text-neutral-300' : 'text-white'} h-screen flex flex-col justify-center items-center`}>

      <div className="w-screen flex justify-evenly items-center mb-5">

        <div className="flex justify-evenly w-1/4">
          <input className="border border-neutral-700 h-9 rounded-sm outline-none px-3 py-1" placeholder="Enter a room code" ref={inputJoinRef}></input>
          <button className="px-4 py-1 rounded-lg bg-white h-9 text-black cursor-pointer" onClick={handleJoinRoom}>Join</button>
        </div>
        <div>
          <CreateRoom
            isOpen={isPopupOpen}
            setIsOpen={setIsPopupOpen}
            roomId={roomId}
            onCreateRoom={handleCreateRoom}
          />
        </div>

      </div>

      <div className="h-[600px] w-[600px] rounded-lg flex flex-col justify-between p-4">
        <div className="h-full mb-4">
          <Chats ws={webSocket} ownUserId={userId}/>
        </div>
        <div className="border border-neutral-700 outline-none flex justify-center items-center rounded-lg p-2 gap-2">
          <input className="outline-none w-full" ref={inputSendRef} placeholder='"Hi there"' onKeyDown={(e) => {
            if(e.key === "Enter"){
              sendMessage();
            }
          }}></input>
          <div className="rounded-lg bg-white p-1 flex justify-center items-center">
            <button className="cursor-pointer w-full h-full" onClick={sendMessage}><SendButton /></button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default App