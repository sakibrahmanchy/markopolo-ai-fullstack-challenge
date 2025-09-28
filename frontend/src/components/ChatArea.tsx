import React, { useState, useRef, useEffect } from 'react';
import { useSendMessageMutation, useCreateConversationMutation, useGetConversationQuery } from '../store/api/chatApi';
import { useStreamingResponse } from '../hooks/useStreamingResponse';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import { useNavigate } from 'react-router-dom';
import { useAddDummyDataMutation } from '../store/api/dataSourcesApi';

interface ChatAreaProps {
  currentQuery: string;
  setCurrentQuery: (query: string) => void;
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  conversationId?: string;
  metadata?: any;
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  currentQuery, 
  setCurrentQuery, 
  conversationId,
  onConversationCreated 
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sendMessage] = useSendMessageMutation();
  const [createConversation] = useCreateConversationMutation();
  const [addDummyData] = useAddDummyDataMutation();
  
  // Load conversation messages when a conversation is selected
  const { data: conversationData, isLoading: isLoadingConversation } = useGetConversationQuery(
    currentConversationId || '', 
    { skip: !currentConversationId }
  );
  
  const {
    streamingMessage,
    isStreaming,
    recommendations,
    campaigns,
    campaignRecommendations,
    intent,
    startStreaming,
    stopStreaming,
  } = useStreamingResponse(currentConversationId || '');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Update currentConversationId when conversationId prop changes
  useEffect(() => {
    if (conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
      // Clear messages when switching conversations
      setMessages([]);
    }
  }, [conversationId, currentConversationId]);

  // Load messages when conversation data is available
  useEffect(() => {
    if (conversationData && conversationData.messages) {
      // Map backend message format to frontend format
      const mappedMessages = conversationData.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role, // Backend uses 'role', frontend uses 'role'
        content: msg.content,
        timestamp: msg.createdAt, // Backend uses 'createdAt', frontend uses 'timestamp'
        conversationId: msg.conversationId,
        metadata: msg.metadata
      }));
      setMessages(mappedMessages);
    }
  }, [conversationData]);

  // Update the last assistant message with streaming content in real-time
  useEffect(() => {
    if (isStreaming && streamingMessage) {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        console.log('Updating streaming message:', { 
          isStreaming, 
          streamingMessage, 
          lastMessage: lastMessage ? { id: lastMessage.id, role: lastMessage.role, content: lastMessage.content } : null 
        });
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = streamingMessage;
        }
        return newMessages;
      });
    }
  }, [streamingMessage, isStreaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setCurrentQuery(inputValue);
    const messageContent = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      let convId = currentConversationId;
      
      // Create conversation if it doesn't exist
      if (!convId) {
        const convResponse = await createConversation(messageContent).unwrap();
        convId = convResponse.id;
        setCurrentConversationId(convId);
        if (convId) {
          onConversationCreated?.(convId);
        }
        console.log('Created new conversation:', convId);
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: messageContent,
        timestamp: new Date().toISOString(),
        conversationId: convId
      };
      
      // Add placeholder assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        conversationId: convId
      };
      
      // Add both messages atomically
      setMessages(prev => {
        console.log('Adding messages:', { userMessage, assistantMessage });
        return [...prev, userMessage, assistantMessage];
      });

      // Send message to backend first
      if (convId) {
        await sendMessage({ 
          content: messageContent,
          role: 'user',
          conversationId: convId 
        }).unwrap();

        // Start streaming after message is sent
        console.log('Starting streaming for conversation:', convId);
        startStreaming();
      }
      
      // Ensure assistant message exists as placeholder
      setTimeout(() => {
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (!lastMessage || lastMessage.role !== 'assistant') {
            console.log('Adding missing assistant message placeholder');
            const assistantMessage: ChatMessage = {
              id: (Date.now() + 2).toString(),
              role: 'assistant',
              content: '',
              timestamp: new Date().toISOString(),
              conversationId: convId
            };
            return [...prev, assistantMessage];
          }
          return prev;
        });
      }, 100);

    } catch (error) {
      console.error('Failed to send message:', error);
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're asking about "${messageContent}". This is a simulated response. In the real implementation, this would connect to your backend AI service to provide intelligent recommendations based on your connected data sources.`,
        timestamp: new Date().toISOString(),
        conversationId: currentConversationId
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900">
          {currentQuery || 'PulseHub AI Assistant'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Ask me anything about your marketing campaigns and data sources
        </p>
      </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {isLoadingConversation ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to PulseHub</h3>
              <p className="text-gray-600 max-w-md">
                Start a conversation to get AI-powered insights about your marketing campaigns. 
                Connect your data sources to unlock personalized recommendations.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
                const role = message.role;

                 function getDate() {
                     try {
                        // Use timestamp field
                        const timestamp = message.timestamp;
                         
                         if (!timestamp) {
                           return 'Just now';
                         }
                         
                         const date = new Date(timestamp);
                         
                         if (isNaN(date.getTime())) {
                           return 'Just now';
                         }
                         
                         const now = new Date();
                         const diffMs = now.getTime() - date.getTime();
                         const diffMins = Math.floor(diffMs / 60000);
                         
                         // Handle future dates (shouldn't happen but just in case)
                         if (diffMs < 0) {
                           return 'Just now';
                         }
                         
                         if (diffMins < 1) return 'Just now';
                         if (diffMins < 60) return `${diffMins}m ago`;
                         if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
                         return date.toLocaleTimeString();
                       } catch (error) {
                         return 'Just now';
                       }
                 }

                return (
                    <div
                      key={message.id}
                      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} flex-wrap gap-2`}
                    >
                       {(message?.content || '')?.length === 0  && ((isLoading || isStreaming)) && (
                         <span className="relative flex size-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex size-3 rounded-full bg-sky-500"></span>
                       </span>
                       )}
                      {message?.content.length > 0 && <div 
                        className={`max-w-3xl px-4 py-3 rounded-lg ${
                          role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }` }
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {getDate()}
                          {isStreaming && role === 'assistant' && index === messages.length - 1 && (
                            <span className="ml-2 text-blue-500">• Streaming...</span>
                          )}
                        </p>
                        </div>}
                     
                        {(isStreaming && (message?.content || '').length > 0 && index === messages.length - 1) && ( 
                           <div className="basis-full flex ">
                           <button
                               onClick={stopStreaming}
                               className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                           >
                               Stop generating
                           </button>
                          </div>
                      )}
                    </div>
                  )
             })}
             
             {/* Show recommendations if any */}
            {recommendations.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Recommendations</h4>
                {recommendations.map((rec, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2 capitalize">{rec.type} Recommendation</h5>
                    <p className="text-sm text-blue-800 mb-2">{rec.reasoning || rec.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-blue-600">
                        Confidence: {Math.round(rec.confidence * 100)}%
                      </div>
                      <button className="text-xs text-blue-600 hover:text-blue-800 underline">
                        Learn more
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Show campaigns if any */}
            {campaigns.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">🚀 Campaign Ideas</h4>
                {campaigns.map((campaign, index) => (
                  <div key={index} className={`rounded-lg p-4 ${
                    campaign.type === 'guidance' 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    <h5 className={`font-medium mb-2 ${
                      campaign.type === 'guidance' ? 'text-blue-900' : 'text-green-900'
                    }`}>
                      {campaign.name}
                    </h5>
                    <p className={`text-sm mb-2 ${
                      campaign.type === 'guidance' ? 'text-blue-800' : 'text-green-800'
                    }`}>
                      {campaign.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className={`text-xs ${
                        campaign.type === 'guidance' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {campaign.channels && (
                          <>Channels: {campaign.channels.join(', ')} • ROI: {campaign.estimatedROI}</>
                        )}
                        {campaign.action && (
                          <>Action: {campaign.action}</>
                        )}
                      </div>
                      <button className={`text-xs underline ${
                        campaign.type === 'guidance' 
                          ? 'text-blue-600 hover:text-blue-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}>
                        {campaign.action === 'create' ? 'Get started' : 'Create campaign'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Show campaign recommendations if any */}
            {campaignRecommendations && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">🎯 Campaign Recommendations</h4>
                {campaignRecommendations.type === 'no_data_sources' ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="font-medium text-yellow-900 mb-2">No Data Sources Connected</h5>
                    <p className="text-sm text-yellow-800 mb-3">{campaignRecommendations.message}</p>
                    <div className="flex gap-4">
                      <button 
                        className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                        onClick={() => {
                          navigate('/data-sources');
                        }}
                      >
                        Connect Data Sources
                      </button>
                      <button 
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        onClick={() => {
                          addDummyData('gtm').unwrap()
                        }}
                      >
                        Add dummy data
                      </button>
                    </div>
                  </div>
                ) : campaignRecommendations.type === 'campaign_recommendation' && campaignRecommendations.data ? (
                  <div className="space-y-4">
                    <h5 className="font-medium text-purple-900 mb-3">🎯 Right Time, Right Channel, Right Message</h5>
                    
                    {/* Multiple Campaigns */}
                    {campaignRecommendations.data.campaigns && campaignRecommendations.data.campaigns.length > 0 ? (
                      <div className="space-y-4">
                        {campaignRecommendations.data.campaigns.map((campaign: any, campaignIndex: number) => (
                          <div key={campaign.id || campaignIndex} className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h6 className="font-medium text-purple-900">{campaign.name || `Campaign ${campaignIndex + 1}`}</h6>
                              <span className="text-xs text-purple-600">Campaign {campaignIndex + 1}</span>
                            </div>
                            
                            {/* Audience Segment */}
                            {campaign.audience && (
                              <div className="mb-4">
                                <h6 className="text-sm font-medium text-purple-800 mb-2">👥 Target Audience</h6>
                                <div className="bg-white rounded-lg p-3 border border-purple-100">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-gray-900">{campaign.audience.segment}</span>
                                    <span className="text-sm text-gray-600">{campaign.audience.size} users</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{campaign.audience.criteria}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Channels */}
                            {campaign.channels && campaign.channels.length > 0 && (
                              <div className="mb-4">
                                <h6 className="text-sm font-medium text-purple-800 mb-2">📱 Recommended Channels</h6>
                                <div className="space-y-2">
                                  {campaign.channels.map((channel: any, channelIndex: number) => (
                                    <div key={channelIndex} className="bg-white rounded-lg p-3 border border-purple-100">
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium text-gray-900 capitalize">{channel.type}</span>
                                        <span className="text-xs text-gray-500">{channel.timing}</span>
                                      </div>
                                      <p className="text-sm text-gray-700">{channel.message}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center pt-3 border-t border-purple-200">
                              <div className="text-xs text-purple-600">
                                Generated from your connected data sources
                              </div>
                              <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                                Create Campaign
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Fallback for old single campaign format
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                        <h5 className="font-medium text-purple-900 mb-3">🎯 Right Time, Right Channel, Right Message</h5>
                        
                        {/* Audience Segment */}
                        {campaignRecommendations.data.audience && (
                          <div className="mb-4">
                            <h6 className="text-sm font-medium text-purple-800 mb-2">👥 Target Audience</h6>
                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-900">{campaignRecommendations.data.audience.segment}</span>
                                <span className="text-sm text-gray-600">{campaignRecommendations.data.audience.size} users</span>
                              </div>
                              <p className="text-sm text-gray-700">{campaignRecommendations.data.audience.criteria}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Channels */}
                        {campaignRecommendations.data.channels && campaignRecommendations.data.channels.length > 0 && (
                          <div className="mb-4">
                            <h6 className="text-sm font-medium text-purple-800 mb-2">📱 Recommended Channels</h6>
                            <div className="space-y-2">
                              {campaignRecommendations.data.channels.map((channel: any, index: number) => (
                                <div key={index} className="bg-white rounded-lg p-3 border border-purple-100">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-gray-900 capitalize">{channel.type}</span>
                                    <span className="text-xs text-gray-500">{channel.timing}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{channel.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-3 border-t border-purple-200">
                          <div className="text-xs text-purple-600">
                            Generated from your connected data sources
                          </div>
                          <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                            Create Campaign
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
            
            {/* Show intent-based UI */}
            {intent && intent.userContext?.needsAuth && (
              <div className="space-y-3 mt-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">🔐 Authentication Required</h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    To access {intent.module} features, you need to sign up or log in.
                  </p>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setShowSignupModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Sign Up
                    </button>
                    <button 
                      onClick={() => setShowLoginModal(true)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Log In
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {intent && intent.userContext?.isAuthenticated && intent.module === 'campaigns' && campaigns.length === 0 && (
              <div className="space-y-3 mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">📊 No Campaigns Found</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    You don't have any active campaigns yet. Create your first campaign to get started.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    Create Campaign
                  </button>
                </div>
              </div>
            )}
            
            {intent && intent.userContext?.isAuthenticated && intent.module === 'sources' && (
              <div className="space-y-3 mt-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">🔗 Connect Data Sources</h4>
                  <p className="text-sm text-green-800 mb-3">
                    Connect your data sources to unlock powerful analytics and insights.
                  </p>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
                      Google Tag Manager
                    </button>
                    <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
                      Facebook Pixel
                    </button>
                    <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
                      Shopify
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your marketing campaigns, data sources, or get campaign recommendations..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
};

export default ChatArea;
