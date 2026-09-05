export class NetworkManager {
  constructor(serverUrl = 'ws://localhost:8081') {
    this.serverUrl = serverUrl;
    this.ws = null;
    this.connected = false;
    this.playerId = null;
    this.messageHandlers = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('Connected to server');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._handleMessage(message);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connected = false;
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from server');
        this.connected = false;
        this.emit('disconnected');
        this._attemptReconnect();
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      this._attemptReconnect();
    }
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.connected = false;
    }
  }

  send(type, data) {
    if (!this.connected) {
      console.warn('Not connected to server');
      return;
    }
    const message = { type, data, timestamp: performance.now() };
    try {
      this.ws.send(JSON.stringify(message));
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  }

  sendPlayerState(position, rotation, health, weapon) {
    this.send('playerState', {
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: rotation.x, y: rotation.y },
      health,
      weapon,
    });
  }

  sendFireEvent(position, direction) {
    this.send('fire', {
      position: { x: position.x, y: position.y, z: position.z },
      direction: { x: direction.x, y: direction.y, z: direction.z },
    });
  }

  sendPlantEvent(siteName) {
    this.send('plant', { siteName });
  }

  sendDefuseEvent(siteName) {
    this.send('defuse', { siteName });
  }

  on(type, handler) {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    this.messageHandlers[type].push(handler);
  }

  emit(type, data) {
    if (this.messageHandlers[type]) {
      this.messageHandlers[type].forEach(handler => handler(data));
    }
  }

  _handleMessage(message) {
    if (message.type === 'playerId') {
      this.playerId = message.data.id;
      console.log('Your player ID:', this.playerId);
    } else if (this.messageHandlers[message.type]) {
      this.messageHandlers[message.type].forEach(handler => handler(message.data));
    }
  }
}

export class GameServer {
  constructor(port = 8081) {
    this.port = port;
    this.players = new Map();
    console.log(`Game server would run on ws://localhost:${port}`);
  }

  // Stub server methods for reference
  broadcast(type, data, excludeId = null) {
    console.log(`[Server] Broadcasting: ${type}`, data);
  }

  addPlayer(id) {
    this.players.set(id, {
      id,
      position: { x: 0, y: 1.6, z: 5 },
      rotation: { x: 0, y: 0 },
      health: 100,
      team: 'terrorists',
    });
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  getPlayerState(id) {
    return this.players.get(id);
  }
}
