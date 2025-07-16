import React, { useState, useEffect, useRef } from 'react';
import styles from './ChatWidget.module.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  Avatar,
  ConversationHeader
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';

interface MessageType {
  message: string;
  sender: 'user' | 'assistant';
  direction: 'incoming' | 'outgoing';
  position?: 'single' | 'first' | 'normal' | 'last';
  sentTime?: string;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<MessageType[]>([
    {
      message: 'Hello! How can I help you today?',
      sender: 'assistant',
      direction: 'incoming',
      position: 'single'
    }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    // Reset error when opening chat
    if (!isOpen) {
      setError(null);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: MessageType = {
      message: message,
      sender: 'user',
      direction: 'outgoing',
      position: 'single',
      sentTime: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending message to API:', message);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai-chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      console.log('Response status:', response.status);

      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        let errorMessage = `Error: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.message) {
            errorMessage = `Error: ${errorData.message}`;
          }
        } catch (e) {
          // If we can't parse the error response, use the default message
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid response format from server');
      }
      
      // Handle both wrapped (data.data.response) and direct (data.response) response structures
      let botResponse = '';
      if (data.data && data.data.response) {
        // Response is wrapped in a data property (NestJS standard response)
        botResponse = data.data.response;
        console.log('Using nested response:', botResponse);
      } else if (data.response) {
        // Direct response
        botResponse = data.response;
        console.log('Using direct response:', botResponse);
      } else {
        console.error('Unexpected response format:', data);
        throw new Error('Unexpected response format from server');
      }
      
      // Add assistant response to chat
      const assistantMessage: MessageType = {
        message: botResponse,
        sender: 'assistant',
        direction: 'incoming',
        position: 'single',
        sentTime: new Date().toLocaleTimeString()
      };

      setMessages(prev => {
        const updatedMessages = [...prev, assistantMessage];
        console.log('Updated messages array:', updatedMessages);
        return updatedMessages;
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to get a response. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.chatWidgetContainer}>
      {isOpen && (
        <div className={styles.chatbox}>
          <MainContainer className={styles.chatContainer}>
            <ChatContainer>
              <ConversationHeader>
                <ConversationHeader.Content>
                  <div className={styles.chatHeader}>
                    <Avatar name="NA" />
                    <span>Nursing Assistant</span>
                  </div>
                  <button 
                    onClick={toggleChat} 
                    className={styles.closeButton}
                    aria-label="Close chat"
                  >
                    ×
                  </button>
                </ConversationHeader.Content>
              </ConversationHeader>
              <MessageList 
                ref={messageListRef} 
                typingIndicator={isLoading ? <TypingIndicator content="Assistant is typing" /> : null}
              >
                {messages.map((msg, i) => (
                  <Message 
                    key={i} 
                    model={{
                      message: msg.message,
                      sentTime: msg.sentTime,
                      sender: msg.sender,
                      direction: msg.direction,
                      position: msg.position || "single"
                    }}
                  />
                ))}
                {error && (
                  <div className={styles.errorMessage}>
                    {error}
                  </div>
                )}
              </MessageList>
              <MessageInput 
                placeholder="Type your message here..." 
                onSend={handleSendMessage}
                disabled={isLoading} 
                attachButton={false}
              />
            </ChatContainer>
          </MainContainer>
        </div>
      )}
      <button 
        onClick={toggleChat} 
        className={styles.chatButton}
        aria-label="Toggle chat assistant"
      >
        {isOpen ? (
          <span className={styles.chatButtonIcon}>×</span>
        ) : (
          <span className={styles.chatButtonIcon}>💬</span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
