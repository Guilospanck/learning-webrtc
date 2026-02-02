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

    let url = "ws://localhost:8080/ws";
    if (import.meta.env.VITE_USE_WS_PROXY === "true") {
      // Get the url dynamically because we are using proxy and the vite port
      // might be different than 3000 if this is not the only client we started.
      const scheme = location.protocol === "https:" ? "wss" : "ws";
      url = `${scheme}://${location.host}/ws`;
    }
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("Connected to signaling server");
    };

    this.socket.onclose = () => {
      console.log("Disconnected from signaling server");
    };

    this.socket.onerror = (error: unknown) => {
      console.error("Signaling server error:", error);
    };

    this.socket.onmessage = (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as Message;
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
