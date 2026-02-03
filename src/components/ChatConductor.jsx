// src/components/ChatConductor.js
import React, { useState, useEffect, useRef } from 'react';
import './styles/ChatConductor.css';
import { Client } from '@stomp/stompjs';

const ChatConductor = () => {
  const [senders, setSenders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedSender, setSelectedSender] = useState(null);
  const [input, setInput] = useState('');
  const stompClientRef = useRef(null);
  const url = 'http://localhost:8080';

  useEffect(() => {
    const fetchSenders = () => {
      fetch(url + '/api/chats')
        .then(response => response.json())
        .then(data => setSenders(data))
        .catch(error => console.error('Error fetching senders:', error));
    };

    fetchSenders();
    const intervalId = setInterval(fetchSenders, 1000);
    return () => clearInterval(intervalId);
  }, [url]);

  useEffect(() => {
    if (selectedSender) {
      const intervalId = setInterval(() => {
        fetch(url + `/api/messages?sender=${selectedSender}`)
          .then(response => response.json())
          .then(data => setMessages(data))
          .catch(error => console.error('Error fetching messages:', error));
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [selectedSender, url]);

  useEffect(() => {
    const client = new Client({
      brokerURL: 'ws://localhost:8080/websocket',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('Connected: ' + frame);
        client.subscribe('/topic/public', (messageOutput) => {
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
    if (input.trim() !== '' && stompClientRef.current && stompClientRef.current.connected) {
      const message = { content: input, sender: 'conductor', receiver: selectedSender };
      stompClientRef.current.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message),
      });
      setMessages((prevMessages) => [...prevMessages, message]);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-conductor-container">
      <div className="chat-conductor-names">
        <h2>Chats</h2>
        <ul>
          {senders.map((sender, index) => (
            <li key={index} onClick={() => setSelectedSender(sender)} className="chat-conductor-name-item">
              {sender}
            </li>
          ))}
        </ul>
      </div>
      <div className="chat-conductor-messages">
        <div className="chat-conductor-messages-header">
          <h2>{selectedSender || "Selecciona un chat para poder ver los mensajes"}</h2>
        </div>
        <div className="chat-conductor-messages-content">
          {selectedSender ? (
            messages.map((message, index) => (
              <div
                key={index}
                className={`chat-conductor-message-item ${message.sender === 'conductor' ? 'right' : 'left'}`}
              >
                {message.content}
              </div>
            ))
          ) : (
            <div className="chat-conductor-noseleccionado">Ningún chat seleccionado</div>
          )}
        </div>
        {selectedSender && (
          <div className="chat-conductor-input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="chat-conductor-input-field"
              placeholder="Escribe aqui un mensaje al pasajero..."
            />
            <button onClick={sendMessage} className="chat-conductor-send-button">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatConductor;
