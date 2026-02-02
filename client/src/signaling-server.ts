export type Message = {
  msgType: "ice_candidate" | "answer" | "offer";
  value: string;
};

type ListenerID = string;

export class SignalingServer {
  private socket: WebSocket;
  private listeners: Map<ListenerID, (message: Message) => void>;

  constructor() {
    this.listeners = new Map();

    this.socket = new WebSocket("ws://localhost:8080/ws");

    this.socket.onopen = () => {
      console.log("Connected to signaling server");
    };

    this.socket.onclose = () => {
      console.log("Disconnected from signaling server");
    };

    this.socket.onerror = (error: unknown) => {
      console.error("Signaling server error:", error);
    };

    this.socket.onmessage = (event: MessageEvent<Message>) => {
      const message = event.data;
      for (const callback of this.listeners.values()) {
        callback(message);
      }
    };
  }

  send(message: Message) {
    this.socket.send(JSON.stringify(message));
  }

  addMessageEventListener(callback: (message: Message) => void): ListenerID {
    const listenerId = Math.random().toString(36);
    this.listeners.set(listenerId, callback);

    return listenerId;
  }

  removeEventListener(id: ListenerID) {
    this.listeners.delete(id);
  }
}
