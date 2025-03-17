'use client'
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// You can import a theme you like:
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './DocChatbot.module.css';

export default function DocChatbot() {
  const [conversations, setConversations] = useState(() => {
    const savedConversations = localStorage.getItem('conversations');
    return savedConversations ? JSON.parse(savedConversations) : [];
  });
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (currentConversationId !== null) {
      const currentConversation = conversations.find(
        (conv) => conv.id === currentConversationId
      );
      setMessages(currentConversation ? currentConversation.messages : []);
    }
  }, [currentConversationId, conversations]);

  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  const handleNewConversation = () => {
    const newId = Date.now();
    setConversations((prev) => [
      { id: newId, subject: `Conversation ${prev.length + 1}`, messages: [] },
      ...prev,
    ]);
    setCurrentConversationId(newId);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: 'user', text: question };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, conversationId: currentConversationId }),
      });
      const data = await res.json();
      const assistantMessage = { role: 'assistant', text: data.answer };
      setMessages((prev) => [...prev, assistantMessage]);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? { ...conv, messages: [...conv.messages, userMessage, assistantMessage] }
            : conv
        )
      );
    } catch (error) {
      console.error('Error fetching answer:', error);
    }
    setQuestion('');
    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <button 
          className={styles.toggleButton}
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          aria-label="Toggle sidebar"
        >
          {isSidebarCollapsed ? '→' : '←'}
        </button>
        
        <button className={styles.newConversationBtn} onClick={handleNewConversation}>
          <span>+ New Conversation</span>
        </button>
        
        <div className={styles.conversationList}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setCurrentConversationId(conv.id)}
              className={`${styles.conversationItem} ${currentConversationId === conv.id ? styles.active : ''}`}
            >
              {conv.subject}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.chatPanel}>
        <div className={styles.messages}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={msg.role === 'user' ? styles.userMsg : styles.assistantMsg}
            >
              <ReactMarkdown
                children={msg.text}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match ? match[1] : 'plaintext'}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              />
            </div>
          ))}
          {loading && <div className={styles.assistantMsg}>Loading...</div>}
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className={styles.input}
          />
          <button type="submit" disabled={loading} className={styles.button}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}