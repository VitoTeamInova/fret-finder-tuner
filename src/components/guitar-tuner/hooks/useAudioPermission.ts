import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useAudioPermission = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const { toast } = useToast();

  const requestPermission = useCallback(async () => {
    if (hasPermission === true) return true;
    
    setIsRequesting(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false
        } 
      });
      
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      toast({
        title: "Microphone Access Granted",
        description: "You can now tune your guitar!",
      });
      
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use the tuner.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, [hasPermission, toast]);

  return {
    hasPermission,
    isRequesting,
    requestPermission
  };
};