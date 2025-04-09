import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AtSign, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { login, signup, checkUserExists } = useAuth();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setStep('email');
    setIsNewUser(false);
    setIsChecking(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  //  within the handleEmailSubmit function:

  const handleEmailSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateEmail(email)) {
    toast({
      title: "Invalid email",
      description: "Please enter a valid email address",
      variant: "destructive",
    });
    return;
  }

  setIsChecking(true);
  
  try {
    console.log('Submitting email:', email);
    const exists = await checkUserExists(email);
    console.log('User exists:', exists);
    setIsNewUser(!exists);
    setStep('password');
  } catch (error: any) {
    console.error('Error during email check:', error);
    toast({
      title: "Connection Issue",
      description: "We're having trouble connecting to our servers. Please try again in a moment.",
      variant: "destructive",
    });
  } finally {
    setIsChecking(false);
  }
};

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (isNewUser) {
        await signup(email, password);
        toast({
          title: "Account created",
          description: "Your account has been created successfully!",
        });
      } else {
        await login(email, password);
        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        });
      }
      handleClose();
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message || "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setPassword('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'email' 
              ? 'Sign in to your account' 
              : isNewUser 
                ? 'Create a password' 
                : 'Enter your password'}
          </DialogTitle>
          <DialogDescription>
            {step === 'email' 
              ? 'Enter your email to continue' 
              : isNewUser 
                ? 'Create a password for your new account' 
                : 'Enter your password to sign in'}
          </DialogDescription>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.form 
              key="email-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleEmailSubmit}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isChecking}
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isChecking}>
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </motion.form>
          ) : (
            <motion.form 
              key="password-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handlePasswordSubmit}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isNewUser && (
                    <Button 
                      variant="link" 
                      className="px-0 text-xs"
                      type="button"
                      onClick={() => {
                        toast({
                          title: "Password reset",
                          description: "Password reset functionality would be implemented here",
                        });
                      }}
                    >
                      Forgot password?
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={isNewUser ? "Create a password" : "Enter your password"}
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-between gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBackToEmail}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isNewUser ? 'Creating Account' : 'Signing In'}
                    </>
                  ) : (
                    isNewUser ? 'Create Account' : 'Sign In'
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        
        <DialogFooter className="sm:justify-start">
          <div className="text-xs text-muted-foreground mt-2">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;