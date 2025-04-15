import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error('Error fetching user:', error);
      setUser(user);
      fetchMessages();
    }
    getUserData();

    // Set up a subscription to listen for new messages
    const messagesSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      // Clean up subscription when component unmounts
      messagesSubscription.unsubscribe();
    };
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      console.log('Fetching messages...');
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        console.log('Messages fetched:', data);
        console.log('Messages count:', data ? data.length : 0);
        console.log('First message (if any):', data && data.length > 0 ? data[0] : 'No messages');
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Exception when fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !message.trim()) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ 
          content: message, 
          user_id: user.id,
          created_at: new Date().toISOString() 
        }]);
        
      if (error) {
        console.error('Error sending message:', error);
      } else {
        setMessage('');
        fetchMessages(); // Refresh messages after sending
      }
    } catch (err) {
      console.error('Exception when sending message:', err);
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
      <div style={{ marginBottom: '20px' }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ marginRight: '10px' }}
        />
        <button onClick={handleSubmit}>Send</button>
      </div>

      <h3>Messages:</h3>
      {loading ? (
        <p>Loading messages...</p>
      ) : messages.length === 0 ? (
        <p>No messages yet. Be the first to post!</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {messages.map((msg) => (
            <li key={msg.id} style={{ marginBottom: '10px', padding: '10px', borderRadius: '5px', backgroundColor: '#f5f5f5' }}>
              <strong>{msg.user_id ? msg.user_id.slice(0, 6) : 'Unknown'}:</strong> {msg.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}