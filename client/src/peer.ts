import { SignalingServer, type Message } from "./signaling-server";

const CONFIGURATION = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const signalingChannel = new SignalingServer();

const peerConnection = new RTCPeerConnection(CONFIGURATION);

export const initPeer = () => {
  // Someone sent us a response to our offering
  onAnswer();
  // Someone sent us an offering
  onOffer();
};

// Offering is an active process. Answering is passive.
export const sendOffer = async () => {
  console.info("Sending `offer` SDP message...");
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  signalingChannel.send({ msgType: "offer", value: JSON.stringify(offer) });
};

const onAnswer = () => {
  console.info("Initiating listener for `answer` SDP messages...");
  signalingChannel.addMessageEventListener(async (message: Message) => {
    if (message.msgType === "answer") {
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

const onOffer = () => {
  console.info("Initiating listener for `offer` SDP messages...");
  signalingChannel.addMessageEventListener(async (message: Message) => {
    if (message.msgType === "offer") {
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
