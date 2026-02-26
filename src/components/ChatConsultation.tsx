
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Message {
  id: number;
  text: string;
  sender: "patient" | "doctor";
  timestamp: Date;
  status: "sent" | "delivered" | "read";
}

interface ChatConsultationProps {
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar?: string;
  patientName: string;
  patientRelationship: string;
}

const ChatConsultation = ({ 
  doctorName, 
  doctorSpecialty, 
  doctorAvatar = "/placeholder.svg",
  patientName,
  patientRelationship
}: ChatConsultationProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `Hello! I'm ${doctorName}. I understand this consultation is for ${patientName}. How can I help today?`,
      sender: "doctor",
      timestamp: new Date(Date.now() - 300000),
      status: "read"
    },
    {
      id: 2,
      text: `Hi Doctor, yes this is regarding ${patientName === "John Smith (You)" ? "myself" : `my ${patientRelationship}`}. We've been experiencing some discomfort and would like to discuss the symptoms.`,
      sender: "patient",
      timestamp: new Date(Date.now() - 240000),
      status: "read"
    },
    {
      id: 3,
      text: "I understand. Please describe the symptoms in detail so I can better assist you.",
      sender: "doctor",
      timestamp: new Date(Date.now() - 180000),
      status: "read"
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: message,
        sender: "patient",
        timestamp: new Date(),
        status: "sent"
      };
      setMessages([...messages, newMessage]);
      setMessage("");
      
      // Simulate doctor response
      setTimeout(() => {
        const doctorResponse: Message = {
          id: messages.length + 2,
          text: "Thank you for sharing that information. Let me review the symptoms...",
          sender: "doctor",
          timestamp: new Date(),
          status: "read"
        };
        setMessages(prev => [...prev, doctorResponse]);
      }, 2000);
    }
  };

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
            <Link to="/patient-dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Avatar className="w-10 h-10">
              <AvatarImage src={doctorAvatar} />
              <AvatarFallback className="bg-green-400 text-white">
                {doctorName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{doctorName}</h2>
              <p className="text-sm text-green-100">Online • {doctorSpecialty}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link to={`/video-call?type=video&patient=${encodeURIComponent(patientName)}`}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 p-2">
                <Video className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={`/video-call?type=audio&patient=${encodeURIComponent(patientName)}`}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 p-2">
                <Phone className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 p-2">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Patient Info Bar */}
        <div className="mt-3 pt-3 border-t border-green-500">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="text-sm">
              Consultation for: <span className="font-medium">{patientName}</span>
              {patientRelationship !== "self" && (
                <span className="text-green-200 ml-1">({patientRelationship})</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                msg.sender === 'patient'
                  ? 'bg-green-500 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <div className="flex items-center justify-end mt-2 space-x-1">
                <span className={`text-xs ${msg.sender === 'patient' ? 'text-green-100' : 'text-gray-500'}`}>
                  {formatTime(msg.timestamp)}
                </span>
                {msg.sender === 'patient' && (
                  <div className="flex">
                    <div className={`w-1 h-1 rounded-full ${
                      msg.status === 'read' ? 'bg-blue-300' : 
                      msg.status === 'delivered' ? 'bg-gray-300' : 'bg-gray-400'
                    } mr-0.5`}></div>
                    <div className={`w-1 h-1 rounded-full ${
                      msg.status === 'read' ? 'bg-blue-300' : 
                      msg.status === 'delivered' ? 'bg-gray-300' : 'bg-gray-400'
                    }`}></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:bg-gray-100 p-2">
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full rounded-full border-gray-300 pr-12 py-3"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:bg-gray-100 p-1.5"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-green-600 hover:bg-green-700 rounded-full p-3"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatConsultation;
