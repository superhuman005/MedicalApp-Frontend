
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  name: string;
  relationship: string;
  age?: number;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIChatbotProps {
  selectedPatient: Patient | null;
}

const AIChatbot = ({ selectedPatient }: AIChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI health assistant. I can help answer questions about symptoms, medications, general health information, and wellness tips. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simple keyword-based responses for demonstration
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('headache') || lowerMessage.includes('head pain')) {
      return 'For headaches, consider these general tips: stay hydrated, get adequate rest, manage stress, and maintain regular meals. If headaches persist, are severe, or are accompanied by other symptoms like fever, vision changes, or neck stiffness, please consult with a healthcare professional immediately.';
    }
    
    if (lowerMessage.includes('fever') || lowerMessage.includes('temperature')) {
      return 'For fever management: rest, stay hydrated with plenty of fluids, and monitor your temperature. Adults can consider over-the-counter fever reducers if appropriate. Seek immediate medical attention if fever is over 103°F (39.4°C), persists for more than 3 days, or is accompanied by severe symptoms.';
    }
    
    if (lowerMessage.includes('cold') || lowerMessage.includes('cough') || lowerMessage.includes('sore throat')) {
      return 'For cold symptoms: get plenty of rest, stay hydrated, use a humidifier, and consider warm salt water gargles for sore throat. Most colds resolve within 7-10 days. Consult a healthcare provider if symptoms worsen or persist beyond 10 days.';
    }
    
    if (lowerMessage.includes('medication') || lowerMessage.includes('medicine') || lowerMessage.includes('drug')) {
      return 'For medication questions, I recommend consulting with your healthcare provider or pharmacist who can provide personalized advice based on your medical history. Always follow prescribed dosages and read medication labels carefully.';
    }
    
    if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition') || lowerMessage.includes('food')) {
      return 'A balanced diet includes plenty of fruits, vegetables, whole grains, lean proteins, and adequate hydration. For personalized nutrition advice, consider consulting with a registered dietitian or your healthcare provider.';
    }
    
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
      return 'Regular physical activity is important for overall health. The general recommendation is 150 minutes of moderate aerobic activity per week, plus strength training exercises. Always consult your healthcare provider before starting a new exercise program, especially if you have health conditions.';
    }
    
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
      return 'If this is a medical emergency, please call emergency services (911) immediately or go to the nearest emergency room. For urgent but non-emergency concerns, contact your healthcare provider or visit an urgent care center.';
    }
    
    // Default response
    return 'Thank you for your question. While I can provide general health information, I recommend consulting with a healthcare professional for personalized medical advice. They can properly evaluate your specific situation and provide appropriate guidance. Is there anything else I can help you with regarding general health information?';
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(userMessage.content);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="w-5 h-5 mr-2" />
          AI Health Assistant
        </CardTitle>
        <CardDescription>
          Ask questions about symptoms, medications, and general health information
          {selectedPatient && (
            <span className="block mt-1 text-blue-600">
              Consultation for: {selectedPatient.name}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.type === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.type === 'ai' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                
                {message.type === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="mt-4 flex space-x-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your health concerns..."
            className="flex-1 min-h-[40px] max-h-[100px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          <p>
            ⚠️ This AI assistant provides general health information only. Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatbot;
