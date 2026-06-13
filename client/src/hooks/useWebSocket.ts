import { useEffect, useRef, useState } from "react";

interface WebSocketData {
  type: string;
  userId?: number;
  healthData?: any;
  vehicleData?: any;
  message?: string;
}

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setConnectionStatus('connected');
        setSocket(ws);
        
        // Subscribe to real-time updates
        ws.send(JSON.stringify({ type: 'subscribe' }));
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setSocket(null);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionStatus('connecting');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [url]);

  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  return {
    socket,
    lastMessage,
    connectionStatus,
    sendMessage
  };
}
