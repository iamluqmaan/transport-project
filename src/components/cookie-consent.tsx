"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "true");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-lg border-t border-gray-800">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-300">
          <p>
            We use cookies to personalize your experience and improve our services. By continuing to use our website, you agree to our use of cookies.
          </p>
        </div>
        <div className="flex items-center gap-3">
             <Button 
                onClick={acceptCookies} 
                variant="default" 
                className="bg-primary hover:bg-primary/90 text-white whitespace-nowrap"
            >
            Accept Cookies
          </Button>
          <button 
            onClick={() => setShowConsent(false)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
