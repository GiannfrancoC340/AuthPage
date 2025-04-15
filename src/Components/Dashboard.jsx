import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function getUserData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error('Error fetching user:', error);
      setUser(user);
      fetchMessages();
    }
    getUserData();
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('id', { ascending: false });

    if (error) console.error('Error fetching messages:', error);
    else setMessages(data);
  };

  const handleSubmit = async () => {
    if (!user || !message.trim()) return;
    const { error } = await supabase
      .from('messages')
      .insert([{ content: message, user_id: user.id }]);
    if (error) console.error('Error sending message:', error);
    else {
      setMessage('');
      fetchMessages();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Welcome, {user?.email}</h2>
      <button onClick={handleLogout}>Logout</button>

      <h3>Post a message:</h3>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSubmit}>Send</button>

      <h3>Messages:</h3>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>
            <strong>{msg.user_id.slice(0, 6)}:</strong> {msg.content}
          </li>
        ))}
      </ul>
    </div>
  );
}

