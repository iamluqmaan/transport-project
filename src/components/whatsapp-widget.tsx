"use client";

import { MessageCircle, X, Send } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function WhatsAppWidget() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Slight delay to show animation
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
     if (isOpen && inputRef.current) {
         inputRef.current.focus();
     }
  }, [isOpen]);

  // Hide on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const phoneNumber = "2347037434688";

  const handleSend = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    const finalMessage = message.trim() || "Hello TransportNG, I have an enquiry.";
    const encodedMessage = encodeURIComponent(finalMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
    setMessage("");
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Chat Window */}
        {isOpen && (
            <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden mb-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="bg-green-600 p-4 text-white flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">TransportNG Support</h3>
                        <p className="text-xs text-green-100 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                            Online 24/7
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-green-700 h-8 w-8" onClick={() => setIsOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="p-4 bg-gray-50 h-64 overflow-y-auto flex flex-col gap-3">
                    <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm border self-start max-w-[90%]">
                        Hello! 👋 <br/> How can we help you with your journey today?
                    </div>
                </div>
                <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
                    <Input 
                        ref={inputRef}
                        placeholder="Type a message..." 
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 text-sm"
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                        onClick={handleSend}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        )}

        {/* Toggle Button */}
        <Button
            onClick={() => setIsOpen(!isOpen)}
            className={`group h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${isOpen ? 'bg-gray-600 hover:bg-gray-700 rotate-90' : 'bg-green-500 hover:bg-green-600'}`}
            aria-label="Chat with us"
        >
            {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-7 w-7 text-white fill-current" />}
            
            {/* Pulse effect ring (only when closed) */}
            {!isOpen && (
                <span className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping -z-10"></span>
            )}
        </Button>
    </div>
  );
}
