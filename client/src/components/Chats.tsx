import { useEffect, useState, useRef } from "react";

interface MessageData{
  senderId: number;
  message: string;
}

interface ChatsProps {
  ownUserId: number | null;
  ws: WebSocket | null;
}

export default function Chats({ ws, ownUserId }: ChatsProps) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ws) {
      console.log("No WebSocket connection available in Chats");
      setMessages([]);
      return;
    }

    console.log("Setting up message listener in Chats");
    
    const handleMessage = (event: MessageEvent) => {

      console.log("Received message:", event.data);

      try {

        const data = JSON.parse(event.data);
        console.log("Parsed data:", data);

        if (data.type === "chat") {
          const newMessage: MessageData = {
            senderId: data.payload.senderId,
            message: data.payload.message
          }

          console.log("Adding new object to state:", newMessage);
          setMessages(prevMessages => {
            return [...prevMessages, newMessage];
          });
        }

      } catch (error) {

        console.error("Error parsing message:", error);
        
      }
    };

    ws.addEventListener('message', handleMessage);
    
    return () => {
      console.log("Cleaning up message listener in Chats");
      ws.removeEventListener('message', handleMessage);
    }
  }, [ws]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  console.log("Current messages in state:", messages);

  return (
    <div ref={messagesContainerRef} className="flex flex-col border border-neutral-700 rounded-lg h-full overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="text-gray-500 self-center my-auto">No messages yet</div>
      ) : (
        messages.map((message, index) => {
          const isOwnMessage = message.senderId === ownUserId;

          return (
          <div key={index} className={`p-2 m-1 rounded-lg max-w-[75%] break-words ${
            isOwnMessage ?
            'bg-blue-500 text-white self-end' :
            'bg-neutral-700 text-white self-start'
          }`}>

            {!isOwnMessage && <div className="text-xs text-neutral-400">User: {message.senderId}</div>}
            {message.message}
          </div>
        )})
      )}
    </div>
  )
}