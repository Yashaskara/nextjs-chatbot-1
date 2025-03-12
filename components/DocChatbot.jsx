'use client'
// components/DocChatbot.jsx
import { useState } from 'react';
import styles from './DocChatbot.module.css';

export default function DocChatbot() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return;

    // Append the user's message to the chat log
    const userMessage = { role: 'user', text: question };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      const assistantMessage = { role: 'assistant', text: data.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error fetching answer:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Sorry, there was an error processing your question.' },
      ]);
    }
    setQuestion('');
    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.role === 'user' ? styles.userMsg : styles.assistantMsg}
          >
            {msg.text}
          </div>
        ))}
        {loading && <div className={styles.assistantMsg}>Loading...</div>}
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className={styles.input}
        />
        <button type="submit" disabled={loading} className={styles.button}>
          Send
        </button>
      </form>
    </div>
  );
}