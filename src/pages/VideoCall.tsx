import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Video, VideoOff, Mic, MicOff, Phone, MessageSquare, FileText, Monitor, Send, Paperclip, Smile } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const VideoCall = () => {
  const [searchParams] = useSearchParams();
  const consultationType = searchParams.get('type') || 'video';
  const doctorName = searchParams.get('doctor') || 'Dr. Sarah Johnson';
  const doctorSpecialty = searchParams.get('specialty') || 'Cardiologist';
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hello! I'm ${doctorName}. How can I help you today?`,
      sender: "doctor",
      timestamp: new Date(Date.now() - 300000),
      status: "read"
    },
    {
      id: 2,
      text: "Hi Doctor, I've been experiencing some chest discomfort for the past few days.",
      sender: "patient",
      timestamp: new Date(Date.now() - 240000),
      status: "read"
    },
    {
      id: 3,
      text: "I understand your concern. Can you describe the type of discomfort? Is it a sharp pain, dull ache, or pressure?",
      sender: "doctor",
      timestamp: new Date(Date.now() - 180000),
      status: "read"
    },
    {
      id: 4,
      text: "It feels like a dull ache, especially when I take deep breaths. It's not constant but comes and goes.",
      sender: "patient",
      timestamp: new Date(Date.now() - 120000),
      status: "read"
    },
    {
      id: 5,
      text: "Thank you for that information. Have you experienced any shortness of breath, dizziness, or nausea along with this discomfort?",
      sender: "doctor",
      timestamp: new Date(Date.now() - 60000),
      status: "read"
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulate call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        sender: "patient" as const,
        timestamp: new Date(),
        status: "sent" as const
      };
      setMessages([...messages, newMessage]);
      setMessage("");
      
      // Simulate doctor response
      setTimeout(() => {
        const doctorResponse = {
          id: messages.length + 2,
          text: "Thank you for that information. I'm reviewing your symptoms...",
          sender: "doctor" as const,
          timestamp: new Date(),
          status: "read" as const
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

  if (consultationType === 'chat') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Chat Header */}
        <div className="bg-green-600 text-white p-4 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Link to="/patient-dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 p-2">
                  ←
                </Button>
              </Link>
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg" />
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
              <Badge variant="outline" className="bg-green-500/20 border-green-300 text-green-100">
                {formatDuration(callDuration)}
              </Badge>
              <Button variant="ghost" size="sm" className="text-white hover:bg-green-700 p-2">
                <Phone className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'patient'
                    ? 'bg-green-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <div className="flex items-center justify-end mt-1 space-x-1">
                  <span className={`text-xs ${msg.sender === 'patient' ? 'text-green-100' : 'text-gray-500'}`}>
                    {formatTime(msg.timestamp)}
                  </span>
                  {msg.sender === 'patient' && (
                    <div className="flex">
                      <div className={`w-1 h-1 rounded-full ${msg.status === 'read' ? 'bg-blue-300' : 'bg-gray-300'} mr-0.5`}></div>
                      <div className={`w-1 h-1 rounded-full ${msg.status === 'read' ? 'bg-blue-300' : 'bg-gray-300'}`}></div>
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
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:bg-gray-100 p-2">
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full rounded-full border-gray-300 pr-12"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:bg-gray-100 p-1.5"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              className="bg-green-600 hover:bg-green-700 rounded-full p-2.5"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Patient Info Side Panel - Hidden on mobile, shown on larger screens */}
        <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <h3 className="font-semibold text-lg">Patient Information</h3>
          </div>
          
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Patient:</span>
                <span className="text-sm font-medium">John Smith</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Age:</span>
                <span className="text-sm font-medium">35</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Consultation:</span>
                <span className="text-sm font-medium">Chat</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                View Records
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Video className="w-3 h-3 mr-1" />
                Switch to Video
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4">
            <h4 className="font-medium mb-2">Consultation Notes</h4>
            <textarea
              className="w-full h-32 resize-none border border-gray-300 rounded-lg p-3 text-sm"
              placeholder="Add consultation notes here..."
              defaultValue="Patient reports chest discomfort for several days. Described as dull ache, intermittent, worsens with deep breathing."
            />
          </div>

          <div className="p-4 border-t border-gray-200">
            <Button className="w-full" size="sm">
              Add Prescription
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Original video call interface for video consultations
  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/patient-dashboard">
              <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2 bg-black/50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">{formatDuration(callDuration)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-500/20 border-green-500 text-green-300">
              Connected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => setIsRecording(!isRecording)}
            >
              {isRecording ? 'Stop Recording' : 'Record'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex h-screen">
        {/* Doctor's Video (Main) */}
        <div className="flex-1 relative">
          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="text-2xl">
                  {doctorName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-white mb-2">{doctorName}</h2>
              <p className="text-blue-200">{doctorSpecialty}</p>
            </div>
          </div>
          
          {/* Patient's Video (Picture-in-Picture) */}
          <div className="absolute top-20 right-4 w-64 h-48 bg-gray-800 rounded-lg border-2 border-white/20 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
              {isVideoOn ? (
                <div className="text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-2">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <p className="text-white text-sm">You</p>
                </div>
              ) : (
                <div className="text-center">
                  <VideoOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Camera Off</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Chat/Notes Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg">Consultation Notes</h3>
          </div>
          
          {/* Patient Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Patient:</span>
                <span className="text-sm font-medium">John Smith</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Age:</span>
                <span className="text-sm font-medium">35</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Appointment:</span>
                <span className="text-sm font-medium">Follow-up</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Records
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Monitor className="w-3 h-3 mr-1" />
                Share Screen
              </Button>
            </div>
          </div>

          {/* Notes Area */}
          <div className="flex-1 p-4">
            <textarea
              className="w-full h-full resize-none border border-gray-300 rounded-lg p-3 text-sm"
              placeholder="Add consultation notes here..."
              defaultValue="Patient reports feeling better since last visit. Blood pressure readings have improved. Continue current medication regimen."
            />
          </div>

          {/* Prescription Quick Add */}
          <div className="p-4 border-t border-gray-200">
            <Button className="w-full" size="sm">
              Add Prescription
            </Button>
          </div>
        </div>
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-4 bg-white/20 backdrop-blur-sm rounded-full px-6 py-4">
          <Button
            variant="outline"
            size="lg"
            className={`rounded-full w-14 h-14 ${isAudioOn ? 'bg-white/20 border-white/30 text-white hover:bg-white/30' : 'bg-red-500 border-red-500 text-white hover:bg-red-600'}`}
            onClick={() => setIsAudioOn(!isAudioOn)}
          >
            {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className={`rounded-full w-14 h-14 ${isVideoOn ? 'bg-white/20 border-white/30 text-white hover:bg-white/30' : 'bg-red-500 border-red-500 text-white hover:bg-red-600'}`}
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
          
          <Link to="/patient-dashboard">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-14 h-14"
            >
              <Phone className="w-6 h-6" />
            </Button>
          </Link>
          
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14 bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
