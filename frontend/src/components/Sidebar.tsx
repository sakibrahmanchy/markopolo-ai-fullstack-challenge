import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import ChatHistory from './ChatHistory';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import { logout } from '../store/slices/authSlice';

interface SidebarProps {
  activePanel: 'chat' | 'data-sources';
  setActivePanel: (panel: 'chat' | 'data-sources') => void;
  onSelectConversation: (id: string) => void;
  currentConversationId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activePanel, 
  setActivePanel, 
  onSelectConversation,
  currentConversationId
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const isAnonymous = !user;
  const dispatch = useDispatch();

  console.log({
    user
  })
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col justify-between hidden sm:block">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-gray-900">PulseHub</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {/* New Chat - only show for authenticated users */}
          {!isAnonymous && (
            <button
              onClick={() => {
                setActivePanel('chat');
                onSelectConversation('');
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span>New Chat</span>
            </button>
          )}

          {/* Data Sources - only show for authenticated users */}
          {!isAnonymous && (
            <button
              onClick={() => setActivePanel('data-sources')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activePanel === 'data-sources' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span>Data Sources</span>
            </button>
          )}
        </nav>
        
        {/* Chat History - only show for authenticated users */}
        {!isAnonymous && activePanel === 'chat' && (
          <div className="mt-6">
            <ChatHistory 
              onSelectConversation={onSelectConversation}
              activeConversationId={currentConversationId}
            />
          </div>
        )}
      </div>

      {/* User Profile / Auth Buttons */}
      <div className="p-4 border-t border-gray-200">
        {isAnonymous ? (
          <div className="space-y-2">
            {/* <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Guest User</p>
                <p className="text-xs text-gray-500">Anonymous</p>
              </div>
            </div> */}
            <div className="space-y-2">
              <button
                onClick={() => setShowSignupModal(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Sign Up
              </button>
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Log In
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user ? `${user.firstName} ${user.lastName}`.trim() : 'User'}
              </p>
              <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
              {/**Logout */}
              <button
                onClick={() => dispatch(logout())}
                className="cursor-pointer text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        )}
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

export default Sidebar;
