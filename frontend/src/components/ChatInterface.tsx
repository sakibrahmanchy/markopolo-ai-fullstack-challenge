import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import DataSourcesPanel from './DataSourcesPanel';

const ChatInterface: React.FC = () => {
  const [activePanel, setActivePanel] = useState<'chat' | 'data-sources'>('chat');
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();

  const handleConversationCreated = (id: string) => {
    setCurrentConversationId(id);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    setActivePanel('chat');
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <Sidebar 
        activePanel={activePanel} 
        setActivePanel={setActivePanel}
        onSelectConversation={handleSelectConversation}
        currentConversationId={currentConversationId}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {activePanel === 'chat' ? (
          <ChatArea 
            currentQuery={currentQuery}
            setCurrentQuery={setCurrentQuery}
            conversationId={currentConversationId}
            onConversationCreated={handleConversationCreated}
          />
        ) : (
          <DataSourcesPanel />
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
