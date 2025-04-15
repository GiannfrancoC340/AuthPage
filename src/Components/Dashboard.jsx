import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Store user details from initial login
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  useEffect(() => {
    async function getUserData() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      } else {
        setUser(user);
        setCurrentUserEmail(user.email);
        
        // Store this user's email in localStorage for display purposes
        try {
          // Get existing users from localStorage
          const storedUsers = JSON.parse(localStorage.getItem('chatUsers') || '{}');
          
          // Add or update this user
          storedUsers[user.id] = {
            email: user.email,
            lastSeen: new Date().toISOString()
          };
          
          // Save back to localStorage
          localStorage.setItem('chatUsers', JSON.stringify(storedUsers));
        } catch (err) {
          console.error('Error updating localStorage:', err);
        }
      }
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
          created_at: new Date().toISOString(),
          // Store the email directly in the message for easy retrieval
          user_email: user.email
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

  // Function to get display name for a user
  const getDisplayName = (msg) => {
    // First priority: current user
    if (msg.user_id === user?.id) {
      return 'You';
    }
    
    // Second priority: email stored with message
    if (msg.user_email) {
      return msg.user_email.split('@')[0];
    }
    
    // Third priority: check localStorage history
    try {
      const storedUsers = JSON.parse(localStorage.getItem('chatUsers') || '{}');
      if (storedUsers[msg.user_id]?.email) {
        return storedUsers[msg.user_id].email.split('@')[0];
      }
    } catch (err) {
      console.error('Error reading from localStorage:', err);
    }
    
    // Fallback to user ID
    return msg.user_id.slice(0, 6);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Welcome, {currentUserEmail}</h2>
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
            <li key={msg.id} style={{ marginBottom: '10px', padding: '10px', borderRadius: '5px', backgroundColor: msg.user_id === user?.id ? '#e6f7ff' : '#f5f5f5' }}>
              <strong>{getDisplayName(msg)}:</strong> {msg.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}