/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import '../index.css';

const Chat = ({userName}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const stompClientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      brokerURL: 'ws://localhost:8080/websocket',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('Connected: ' + frame);
        client.subscribe('/chat/public', (messageOutput) => {
          showMessage(JSON.parse(messageOutput.body));
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  const showMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const sendMessage = () => {
    console.log('user'+userName)
    if (stompClientRef.current && stompClientRef.current.connected && input.trim() !== '') {
      stompClientRef.current.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify({ content: input, sender: userName, receiver : 'conductor' }),
      });
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <header className="header">
        <span className="title">Conductor</span>
      </header>
      <div className="messages-container">
      {messages.map((message, index) => (
  <div
    key={index}
    className={`message ${message.sender === 'conductor' ? 'left' : 'right'}`}
  >
    <strong>{message.sender}:</strong> {message.content}
  </div>
))}
      </div>
      <div className="input-container">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="input"
          placeholder="Escribe un mensaje..."
        />
        <button onClick={sendMessage} className="send-button">
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
};


export default Chat;
