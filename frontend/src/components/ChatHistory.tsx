import React from 'react';
import { useGetConversationsQuery } from '../store/api/chatApi';

interface ChatHistoryProps {
  onSelectConversation: (id: string) => void;
  activeConversationId?: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ onSelectConversation, activeConversationId }) => {
  const { data: conversations, isLoading } = useGetConversationsQuery(undefined);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-h-[500px] overflow-auto">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Conversations</h3>
      <div className="space-y-2">
        {conversations && conversations.length > 0 ? (
          conversations.map((conversation: any) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeConversationId === conversation.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {conversation.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(() => {
                  try {
                    const date = new Date(conversation.updatedAt);
                    if (isNaN(date.getTime())) {
                      return 'Recently';
                    }
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 0) return 'Today';
                    if (diffDays === 1) return 'Yesterday';
                    if (diffDays < 7) return `${diffDays}d ago`;
                    return date.toLocaleDateString();
                  } catch (error) {
                    return 'Recently';
                  }
                })()}
              </p>
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No conversations yet
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
