import React, { useEffect, useState } from 'react';
import ChatArea from './ChatArea';
import { useParams } from 'react-router-dom';

const ChatInterface: React.FC = () => {
  const { id } = useParams();
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(id);

  const handleConversationCreated = (id: string) => {
    setCurrentConversationId(id);
  };

  useEffect(() => {
    setCurrentConversationId(id);
  }, [id])

  return (
    <div className="flex h-screen bg-white w-full">
      {/* Left Sidebar */}

      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
          <ChatArea 
            currentQuery={currentQuery}
            setCurrentQuery={setCurrentQuery}
            conversationId={currentConversationId}
            onConversationCreated={handleConversationCreated}
          />
      </div>
    </div>
  );
};

export default ChatInterface;
