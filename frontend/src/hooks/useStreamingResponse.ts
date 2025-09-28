import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface StreamingMessage {
  type: 'chunk' | 'recommendation' | 'campaign' | 'campaign_recommendation' | 'intent' | 'complete';
  content?: string;
  data?: any;
}

export const useStreamingResponse = (conversationId: string, onComplete?: (message: string) => void) => {
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignRecommendations, setCampaignRecommendations] = useState<any>(null);
  const [intent, setIntent] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const timeoutRef = useRef<number | undefined>(undefined);
  const currentConversationIdRef = useRef<string>(conversationId);
  
  // Get access token from Redux store
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  // Update the ref when conversationId changes
  useEffect(() => {
    currentConversationIdRef.current = conversationId;
  }, [conversationId]);

  const startStreaming = async () => {
    const currentConvId = currentConversationIdRef.current;
    console.log('startStreaming called with conversationId:', currentConvId);
    if (!currentConvId) {
      console.log('No conversationId, returning early');
      return;
    }
    
    // Abort existing request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsStreaming(true);
    setStreamingMessage('');
    setRecommendations([]);
    setCampaigns([]);
    setCampaignRecommendations(null);
    setIntent(null);

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Set a timeout to prevent infinite streaming
    timeoutRef.current = setTimeout(() => {
      console.log('Streaming timeout reached');
      setIsStreaming(false);
      abortController.abort();
    }, 30000); // 30 seconds timeout

    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5900'}/conversations/${currentConvId}/stream`;
      console.log('Starting fetch stream with URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream completed');
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          // Skip SSE event type and id lines
          if (line.startsWith('event:') || line.startsWith('id:')) continue;
          
          // Process data lines
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6); // Remove 'data: ' prefix
            if (dataStr.trim() === '') continue;
            
            try {
              const data: StreamingMessage = JSON.parse(dataStr);
              console.log('Parsed streaming data:', data);
              
              switch (data.type) {
                case 'chunk':
                  if (data.content) {
                    console.log('Adding chunk:', data.content);
                    setStreamingMessage(prev => prev + data.content);
                  }
                  break;
                case 'recommendation':
                  if (data.data) {
                    console.log('Adding recommendation:', data.data);
                    setRecommendations(prev => [...prev, data.data]);
                  }
                  break;
                case 'campaign':
                  if (data.data) {
                    console.log('Adding campaign:', data.data);
                    setCampaigns(prev => [...prev, data.data]);
                  }
                  break;
                case 'campaign_recommendation':
                  if (data.data) {
                    console.log('Setting campaign recommendation:', data.data);
                    setCampaignRecommendations(data.data);
                  }
                  break;
                case 'intent':
                  if (data.data) {
                    console.log('Setting intent:', data.data);
                    setIntent(data.data);
                  }
                  break;
                case 'complete':
                  console.log('Streaming complete');
                  setIsStreaming(false);
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                  }
                  if (onComplete && streamingMessage) {
                    onComplete(streamingMessage);
                  }
                  return;
              }
            } catch (error) {
              console.error('Error parsing streaming data:', error);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Streaming aborted');
      } else {
        console.error('Streaming failed:', error);
      }
      setIsStreaming(false);
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    streamingMessage,
    isStreaming,
    recommendations,
    campaigns,
    campaignRecommendations,
    intent,
    startStreaming,
    stopStreaming,
  };
};
