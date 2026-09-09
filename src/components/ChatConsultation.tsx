
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, ArrowLeft, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getMessages, sendMessage, ConversationModel } from "@/services/chat";
import { getSocket } from "@/services/socket";
import { getErrorMessage } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessageItem } from "@/types";

interface ChatConsultationProps {
  conversationId: string;
  conversationModel: ConversationModel;
  otherPartyName: string;
  otherPartySubtitle?: string;
  otherPartyAvatar?: string;
  backTo?: string;
  videoCallHref?: string;
}

const ChatConsultation = ({
  conversationId,
  conversationModel,
  otherPartyName,
  otherPartySubtitle,
  otherPartyAvatar = "/placeholder.svg",
  backTo = "/patient-dashboard",
  videoCallHref,
}: ChatConsultationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMessages(conversationModel, conversationId);
        setMessages(data);
      } catch (error) {
        toast({
          title: "Couldn't load messages",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [conversationId, conversationModel, toast]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("chat:join", { conversationId });

    const handleIncoming = (msg: ChatMessageItem) => {
      if (msg.conversation !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
    };

    socket.on("chat:message", handleIncoming);
    return () => {
      socket.emit("chat:leave", { conversationId });
      socket.off("chat:message", handleIncoming);
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSendMessage = useCallback(async () => {
    const text = message.trim();
    if (!text) return;

    setMessage("");
    setIsSending(true);

    const socket = getSocket();
    try {
      if (socket && socket.connected) {
        socket.emit("chat:send", { conversationId, conversationModel, text });
      } else {
        const sent = await sendMessage(conversationModel, conversationId, { text });
        setMessages((prev) => [...prev, sent]);
      }
    } catch (error) {
      toast({
        title: "Message not sent",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [message, conversationId, conversationModel, toast]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to={backTo}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherPartyAvatar} />
              <AvatarFallback className="bg-green-400 text-white">
                {otherPartyName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{otherPartyName}</h2>
              {otherPartySubtitle && <p className="text-sm text-green-100">{otherPartySubtitle}</p>}
            </div>
          </div>
          {videoCallHref && (
            <Link to={videoCallHref}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 p-2">
                <Video className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">
            No messages yet. Say hello to get the conversation started.
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender._id === user?._id;
            return (
              <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                    isMine
                      ? 'bg-green-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex items-center justify-end mt-2 space-x-1">
                    <span className={`text-xs ${isMine ? 'text-green-100' : 'text-gray-500'}`}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full rounded-full border-gray-300 py-3"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="bg-green-600 hover:bg-green-700 rounded-full p-3"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatConsultation;
