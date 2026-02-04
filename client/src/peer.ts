import { SignalingServer, type Message } from "./signaling-server";
import {
  messageBox,
  messagesTextArea,
  messagingStatus,
  sendMessageButton,
  deactivateVideo,
  initiateOfferBtn,
  screenSharingBtn,
} from "./ui-elements";

const CONFIGURATION = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // {
    //   urls: "turn:192.168.1.118:3478",
    //   username: "turnuser",
    //   credential: "turnpass",
    // },
  ],
};

const signalingChannel = new SignalingServer();
export const peerConnection = new RTCPeerConnection(CONFIGURATION);
let dataChannel: RTCDataChannel | undefined = undefined;

export const initPeer = () => {
  // Creates the data channel
  createDataChannel();
  // Handle automatic negotiation when data channels are created
  onNegotiationNeeded();
  // Someone sent us a response to our offering
  onRemoteAnswer();
  // Someone sent us an offering
  onRemoteOffer();
  // Someone sent us an ICE candidate
  onRemoteIceCandidate();
  // Listen for local ICE candidates on the local RTCPeerConnection
  onLocalIceCandidate();
  // Listen for successfully connected peers
  onConnectionCompleted();
  // Listen to remote data channel creation
  onRemoteDataChannel();
};

// Offering is an active process. Answering is passive.
export const sendOffer = async () => {
  // SDP: Session Description Protocol
  console.info("Sending `offer` SDP message...");
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  signalingChannel.send({ msgType: "offer", value: JSON.stringify(offer) });
};

const createDataChannel = () => {
  try {
    dataChannel = peerConnection.createDataChannel("messages");
    listenToDataChannelEvents();
    console.info("Data channel created!");
  } catch (err) {
    console.error("Error creating data channel: ", err);
  }
};

export type DataChannelMessageType =
  | "message"
  | "video_track_added"
  | "audio_track_added"
  | "screen_track_added"
  | "video_track_removed"
  | "audio_track_removed"
  | "screen_track_removed";

type DataChannelMessage = {
  type: DataChannelMessageType;
  value: string;
};

type TrackID = string;
export const ReceivedTracksSignals: Map<
  TrackID,
  Exclude<DataChannelMessageType, "message">
> = new Map();

export const sendToDataChannel = (message: DataChannelMessage) => {
  if (!dataChannel) return;

  dataChannel.send(JSON.stringify(message));

  if (message.type === "message") {
    messagesTextArea.textContent += `Me: ${message.value}\n`;
    messagesTextArea.scrollTop = messagesTextArea.scrollHeight;
  }
};

const onRemoteDataChannel = () => {
  peerConnection.addEventListener("datachannel", (event) => {
    console.info(
      "Received a new data channel from the peer connection: ",
      event,
    );
    dataChannel = event.channel;
    listenToDataChannelEvents();
  });
};

const listenToDataChannelEvents = () => {
  // Enable textarea and button when opened
  dataChannel?.addEventListener("open", () => {
    console.info("Data channel opened!");
    messageBox.disabled = false;
    messageBox.focus();
    sendMessageButton.disabled = false;
    messagingStatus.classList.add("active");
  });

  // Disable input when closed
  dataChannel?.addEventListener("close", () => {
    console.info("Data channel closed!");
    messageBox.disabled = true;
    sendMessageButton.disabled = true;
    messagingStatus.classList.remove("active");
  });

  dataChannel?.addEventListener("message", (event: MessageEvent<string>) => {
    const { type, value } = JSON.parse(event.data) as DataChannelMessage;

    if (type === "message") {
      messagesTextArea.textContent += `Peer: ${value}\n`;
      messagesTextArea.scrollTop = messagesTextArea.scrollHeight;
      return;
    }

    if (
      ["video_track_added", "audio_track_added", "screen_track_added"].includes(
        type,
      )
    ) {
      ReceivedTracksSignals.set(value, type);
      return;
    }

    ReceivedTracksSignals.delete(value);

    if (type === "video_track_removed") {
      deactivateVideo("remote");
    } else if (type === "screen_track_removed") {
      deactivateVideo("screen");
    }
  });
};

const onRemoteAnswer = () => {
  console.info("Initiating listener for remote `answer` SDP messages...");
  signalingChannel.addMessageEventListener(async (message: Message) => {
    if (message.msgType === "answer") {
      console.info("Received remote answer: ", message);
      try {
        const answer = JSON.parse(message.value) as RTCSessionDescriptionInit;

        const remoteDesc = new RTCSessionDescription(answer);
        await peerConnection.setRemoteDescription(remoteDesc);
        console.info("Added remote description from `answer` message!");
      } catch (err) {
        console.error(
          "Something went wrong while handling the msgType answer: ",
          err,
        );
      }
    }
  });
};

const onRemoteOffer = () => {
  console.info("Initiating listener for remote `offer` SDP messages...");
  signalingChannel.addMessageEventListener(async (message: Message) => {
    if (message.msgType === "offer") {
      console.info("Received remote offer: ", message);
      try {
        const offer = JSON.parse(message.value) as RTCSessionDescriptionInit;

        const remoteDesc = new RTCSessionDescription(offer);
        peerConnection.setRemoteDescription(remoteDesc);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        signalingChannel.send({
          msgType: "answer",
          value: JSON.stringify(answer),
        });
        console.info("Sent `answer` message based on an `offer` event!");
      } catch (err) {
        console.error(
          "Something went wrong while handling the msgType offer: ",
          err,
        );
      }
    }
  });
};

const onRemoteIceCandidate = () => {
  console.info("Initiating listener for remote `ice_candidate` messages...");
  signalingChannel.addMessageEventListener(async (message: Message) => {
    if (message.msgType === "ice_candidate") {
      console.info("Received remote ICE candidate: ", message);
      try {
        const iceCandidate = JSON.parse(message.value) as RTCIceCandidateInit;
        await peerConnection.addIceCandidate(iceCandidate);
      } catch (err) {
        console.error(
          "Something went wrong while handling the msgType offer: ",
          err,
        );
      }
    }
  });
};

const onLocalIceCandidate = () => {
  peerConnection.addEventListener("icecandidate", (event) => {
    if (event.candidate) {
      console.info(
        "Received local ICE candidate. Sending it to remote peer...",
      );
      signalingChannel.send({
        msgType: "ice_candidate",
        value: JSON.stringify(event.candidate),
      });
    }
  });
};

const onConnectionCompleted = () => {
  peerConnection.addEventListener("connectionstatechange", (event) => {
    console.info("Connection state changed: ", peerConnection.connectionState);
    if (peerConnection.connectionState === "connected") {
      console.log("Peer connected: ", event);

      initiateOfferBtn.textContent = "Connection established";
      initiateOfferBtn.disabled = true;

      screenSharingBtn.disabled = false;
    }
  });
};

const onNegotiationNeeded = () => {
  peerConnection.addEventListener("negotiationneeded", async () => {
    console.info("Negotiation needed - creating offer...");
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      signalingChannel.send({ msgType: "offer", value: JSON.stringify(offer) });
    } catch (err) {
      console.error("Error during negotiation needed:", err);
    }
  });
};
