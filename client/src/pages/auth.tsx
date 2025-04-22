import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { initRecaptchaVerifier, sendOTP, verifyOTP } from "@/lib/auth";
import { useAuth } from "@/lib/contexts/auth-context";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and limit to 10 digits
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(value);
  };

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      if (!recaptchaContainerRef.current) {
        throw new Error("Recaptcha container not found");
      }
      
      const recaptchaVerifier = initRecaptchaVerifier('recaptcha-container');
      const result = await sendOTP(phoneNumber, recaptchaVerifier);

      if (result.success) {
        setOtpSent(true);
        setTimer(60);
        toast({
          title: "OTP Sent",
          description: "A verification code has been sent to your phone.",
        });
      } else {
        toast({
          title: "Failed to send OTP",
          description: "There was a problem sending the verification code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/\D/g, "");
    
    if (value.length > 1) {
      // If pasting multiple digits, distribute them across fields
      const digits = value.split('').slice(0, 6 - index);
      const newOtp = [...otp];
      
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      
      setOtp(newOtp);
      
      // Focus on the next empty field or the last field
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    } else {
      // Handle single digit input
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input if current one is filled
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace to clear current field and focus previous field
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join("");
    
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await verifyOTP(otpValue);

      if (result.success && result.user) {
        setUser(result.user);
        toast({
          title: "Verification successful",
          description: "You have been successfully logged in.",
        });
        setLocation("/");
      } else {
        toast({
          title: "Verification failed",
          description: "The verification code is invalid or has expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Error",
        description: "Failed to verify the code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (timer === 0) {
      handleSendOTP();
    }
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, timer]);

  // Format timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white shadow-md">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">TaskHub</h1>
              <p className="text-gray-600">Collaborative task management</p>
            </div>

            {!otpSent ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Log in with your phone</h2>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="flex">
                    <div className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +91
                    </div>
                    <Input
                      type="tel"
                      id="phone"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      className="flex-1 rounded-l-none"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">We'll send you a verification code</p>
                </div>

                <Button 
                  onClick={handleSendOTP}
                  disabled={loading || phoneNumber.length !== 10}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>

                {/* Invisible reCAPTCHA container */}
                <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Enter verification code</h2>
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit code to <span className="font-medium">+91 {phoneNumber}</span>
                </p>

                <div className="flex justify-between space-x-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      type="text"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOTPChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      className="w-12 h-12 text-center text-lg p-0"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="link" 
                    onClick={handleResendOTP}
                    disabled={timer > 0 || loading}
                    className="text-sm p-0 h-auto"
                  >
                    Resend code
                  </Button>
                  <span className="text-sm text-gray-500">{formatTime(timer)}</span>
                </div>

                <Button 
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => setOtpSent(false)}
                  disabled={loading}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
