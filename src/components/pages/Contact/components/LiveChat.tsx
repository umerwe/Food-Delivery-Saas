"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import useChat from "@/hooks/useChat";
import type { ChatMessage, ChatMessageCreatedEvent, ChatThread } from "@/services/chat";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";

export default function ChatUI() {
  const { token, user } = useAuth();
  const { createChatThread, fetchChatThreads, fetchChatThreadMessages, sendChatMessage } = useChat(token);
const searchParams = useSearchParams();

const orderId = searchParams.get("orderId");
const [creatingThread, setCreatingThread] = useState(false);
  const [message, setMessage] = useState("");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeThreadRef = useRef<ChatThread | null>(null);
  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  const createGeneralThread = async () => {
  if (creatingThread) return;


  setCreatingThread(true);

  const { response: res, thread: newThread } = await createChatThread({
    payload: {
      message: "Hi, I need support.",
      subject: "General Support",
    },
  });

  if (res?.success && newThread) {

    setThreads([newThread]);
    setActiveThread(newThread);
  }

  setCreatingThread(false);
};


  const ensureOrderThread = async (orderId: string) => {
  if (!orderId || creatingThread) return;

  setCreatingThread(true);

  const existing = threads.find((t) => t.orderId === orderId);

  if (existing) {
    setActiveThread(existing);
    setCreatingThread(false);
    return;
  }

  const shortId = orderId.slice(-6).toUpperCase();
  const subject = `Order #${shortId}`;

  const { response: res, thread: newThread } = await createChatThread({
    payload: {
      message: "Hi, I need help regarding this order.",
      orderId,
      subject,
    },
  });

  if (res?.success && newThread) {
    setThreads((prev) => [newThread, ...prev]);
    setActiveThread(newThread);
  }

  setCreatingThread(false);
};


useEffect(() => {

  if (!token) return;

  if (orderId) {
    ensureOrderThread(orderId);
  }

  else if (threads.length === 0 && !creatingThread) {
    createGeneralThread();
  }

}, [orderId, threads.length, token]);

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

  const fetchThreads = async () => {
    const { response: res, threads: nextThreads } = await fetchChatThreads();
    if (res?.success) {
      setThreads(nextThreads);
     if (nextThreads.length > 0 && !activeThread && !orderId) {
  setActiveThread(nextThreads[0]);
}
    }
  };

const fetchMessages = async (id: string) => {
  const { response: res, messages: nextMessages } = await fetchChatThreadMessages({ threadId: id });
  if (res?.success) {
    setMessages(nextMessages);
  }
};
  const handleSend = async () => {
    if (!message.trim() || !activeThread) return;

    setSending(true);

    await sendChatMessage({ threadId: activeThread.id, message });

    setMessage("");

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (token) fetchThreads();
  }, [token]);

  useEffect(() => {
    if (activeThread?.id) {
      fetchMessages(activeThread.id);
    }
  }, [activeThread]);

  useEffect(() => {
    if (!token) return;

    const socket = io("https://deliveryway.dcodax.co/chat", {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
    });

    socket.on("chat.message.created", (data: ChatMessageCreatedEvent) => {
      const incomingMessage = data.message;
      const threadId = data.threadId;


      //  only update if active thread
      if (threadId === activeThreadRef.current?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMessage.id)) return prev;
          return [...prev, incomingMessage];
        });
      }

      // update sidebar
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, lastMessagePreview: incomingMessage.body }
            : t
        )
      );
    });

    socket.on("chat.thread.updated", (data: ChatThread) => {
      setThreads((prev) =>
        prev.map((t) => (t.id === data.id ? { ...t, ...data } : t))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return (
    <div className="flex h-screen bg-[#f7f6f5] text-[13px] text-[#1f1f1f]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] bg-[#f3f1ef] px-4 py-5">
        <p className="text-[10px] tracking-widest text-gray-400 mb-3">
          USER CONTEXT
        </p>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f4c7b8] text-[12px] font-semibold">
              {user?.profile?.firstName?.[0] || "U"}
            </div>
            <div>
              <p className="font-medium text-[13px]">
                {user?.profile?.firstName}
              </p>
              <p className="text-[11px] text-gray-400">
                Premium Member
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-[11px]">
            <div>
              <p className="text-gray-400 uppercase text-[9px] tracking-wider">
                Account Since
              </p>
              <p className="text-[12px] mt-[2px]">
                {user?.profile?.createdAt
                  ? formatDate(user?.profile?.createdAt)
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[9px] tracking-wider">
                Recent Topic
              </p>
              <p className="text-[12px] mt-[2px]">
                {threads[0]?.subject || "Support Chat"}
              </p>
            </div>
          </div>
        </div>

        {/* THREADS */}
        <div className="mt-6">
          <p className="text-[10px] tracking-widest text-gray-400 mb-3">
            CONVERSATIONS
          </p>

          <div className="space-y-2">
            {threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveThread(t)}
                className={`rounded-lg px-3 py-3 cursor-pointer ${
                  activeThread?.id === t.id
                    ? "bg-[#e7e5e4]"
                    : "bg-[#ecebea]"
                }`}
              >

                <div className="flex justify-between items-center"><p className="text-[12px] font-medium">
                  {t.subject}
                </p>
                 {t.orderId && (
  <span className="text-[9px] px-2 py-[1px] bg-orange-100 text-orange-600 rounded-full">
    Order
  </span>
)}</div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">
                  {t.lastMessagePreview}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex flex-col flex-1">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#f7f6f5] border-b border-gray-200">
         <h2 className="font-medium text-[14px]">
  {activeThread?.orderId
    ? `Order #${activeThread.orderId} • Order Support`
    : activeThread?.subject || "Live Chat"}
</h2>

          <span className="text-[10px] px-3 py-[3px] rounded-full bg-[#e9e7e5] text-gray-500">
            ENCRYPTED
          </span>
        </div>

        {/* CHAT BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <div className="bg-[#2f2f2f] text-white rounded-md px-4 py-3 max-w-[720px]">
            <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1">
              Note
            </p>
            <p className="text-[12px] leading-relaxed">
              Please do not share personal or card details in this chat.
            </p>
          </div>
{creatingThread && (
  <div className="flex items-center gap-3 mt-6">
    <div className="w-8 h-8 rounded-full bg-[#ef5a2a]/20 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#ef5a2a]" size={16} />
    </div>
    <p className="text-[12px] text-gray-500">
      Setting up your order conversation...
    </p>
  </div>
)}
          {messages.map((msg) => {
            const isMe = msg.senderType === "CUSTOMER";

            return isMe ? (
              <div key={msg.id} className="mt-6 flex justify-end">
                <div className="max-w-[420px] text-right">
                  <div className="bg-[#ef5a2a] text-white px-4 py-3 rounded-2xl rounded-br-md inline-block">
                    <p className="text-[12px] leading-relaxed">
                      {msg.body}
                    </p>
                  </div>

                  <p className="text-[10px] text-gray-400 mt-1 mr-1">
                    You · {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="mt-6 max-w-[360px]">
                <div className="bg-[#e9e7e5] px-4 py-2 rounded-2xl rounded-bl-md inline-block">
                  <p className="text-[12px]">{msg.body}</p>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 ml-1">
                  Support · {formatTime(msg.createdAt)}
                </p>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className="border-t border-gray-200 px-4 py-3 bg-[#f7f6f5] ">
          <div className="flex items-center bg-white rounded-full px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-[#ef5a2a]/40
                focus-within:border-[#ef5a2a]
                transition-all duration-200">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-[12px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              onClick={handleSend}
              disabled={sending}
              className="ml-2 bg-[#ef5a2a] hover:bg-[#e14f20] transition p-2 rounded-full text-white"
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
