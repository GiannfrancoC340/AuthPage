import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      fetchMessages()
    }
    getUserData()
  }, [])

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('id', { ascending: false })
    setMessages(data)
  }

  const handleSubmit = async () => {
    if (message) {
      await supabase.from('messages').insert([{ content: message, user_id: user.id }])
      setMessage('')
      fetchMessages()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Welcome, {user?.email}</h2>
      <button onClick={handleLogout}>Logout</button>

      <h3>Post a message:</h3>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={handleSubmit}>Send</button>

      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>{msg.content}</li>
        ))}
      </ul>
    </div>
  )
};
