import { useState } from "react";
import CloseButton from "../assets/CloseButton";

interface CreateRoomProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  roomId: string;
  onCreateRoom: () => void;
}

export function CreateRoom({ isOpen, setIsOpen, roomId, onCreateRoom }: CreateRoomProps) {
  const [copied, setCopied] = useState(false);

  return <div className="h-9">
    <button className="px-4 py-1 h-full rounded-lg bg-white text-black cursor-pointer" onClick={onCreateRoom}>
      Create Room
    </button>

    {isOpen && <div className="fixed left-0 top-0 h-screen w-screen flex flex-col justify-center items-center">
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="border bg-neutral-900 rounded-lg flex flex-col px-8 pb-8 pt-5 relative z-10">

        <button onClick={() => {
          setIsOpen(false);
          setCopied(false);
        }} className="cursor-pointer absolute top-2 right-2">
          <CloseButton />
        </button>
        <div className="text-xl px-4 pb-6 pt-2 font-bold">Your new room code:</div>
        <div className="flex justify-center items-center gap-4">

          <div className="border border-neutral-500 px-4 py-1 rounded-lg">
            {roomId}
          </div>
          <button className="px-4 py-1 rounded-lg bg-white text-black cursor-pointer" onClick={() => {
            if (roomId) {
              navigator.clipboard.writeText(roomId);
              setCopied(true);
            }
          }}>
            {copied ? <>Copied!</> : <>Copy</>}
          </button>

        </div>

      </div>

    </div>}
  </div>
}