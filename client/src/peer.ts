import { SignalingServer, type Message } from "./signaling-server";

const CONFIGURATION = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const signalingChannel = new SignalingServer();

const peerConnection = new RTCPeerConnection(CONFIGURATION);

export const initPeer = () => {
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
};

// Offering is an active process. Answering is passive.
export const sendOffer = async () => {
  // SDP: Session Description Protocol
  console.info("Sending `offer` SDP message...");
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  signalingChannel.send({ msgType: "offer", value: JSON.stringify(offer) });
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
      console.log("Peers connected!");
      console.log(event);
    }
  });
};
