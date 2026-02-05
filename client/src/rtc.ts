import {
  initPeer,
  peerConnection,
  ReceivedTracksSignals,
  sendOffer,
  sendToDataChannel,
} from "./peer";
import { State } from "./state";
import {
  activateVideo,
  deactivateVideo,
  initiateOfferBtn,
  messageBox,
  screenSharingBtn,
  sendMessageButton,
} from "./ui-elements";

let screenSharingSender: RTCRtpSender | undefined = undefined;

export const initiateWebRTC = async () => {
  await getAudioAndVideoDevices();

  listenForWebAppInputs();

  await getConnectedDevices();
  listenForDevicesChanges;

  // listen to remote tracks
  listenRemoteStreamTrack();

  // Init peer offer/answer SDP events and gather ICE candidates
  initPeer();
};

const listenForWebAppInputs = () => {
  // The screensharing MUST be user initiated.
  screenSharingBtn.addEventListener("click", async () => {
    await startStopScreenSharingAndRecording();
  });

  initiateOfferBtn.addEventListener("click", async () => {
    await sendOffer();
    initiateOfferBtn.textContent = "Connection Started";
    initiateOfferBtn.disabled = true;
  });

  sendMessageButton.addEventListener("click", () => {
    const message = messageBox.value;
    sendToDataChannel({ type: "message", value: message });
    messageBox.value = "";
  });

  messageBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const message = messageBox.value;
      if (message.trim()) {
        sendToDataChannel({ type: "message", value: message });
        messageBox.value = "";
      }
    }
  });
};

const getAudioAndVideoDevices = async (
  // we can ask for specific camera/audio configs here as well.
  constraints: MediaStreamConstraints = { video: true, audio: true },
) => {
  try {
    const stream: MediaStream =
      await navigator.mediaDevices.getUserMedia(constraints);
    console.log("[User media] Got MediaStream:", stream);

    activateVideo("local", stream);

    addLocalUserMediaStreamTracksToPeerConnection(stream);
  } catch (error) {
    console.error("Error accessing media devices.", error);
  }
};

const addLocalUserMediaStreamTracksToPeerConnection = (stream: MediaStream) => {
  stream.getTracks().forEach((track) => {
    const messageType =
      track.kind === "audio" ? "audio_track_added" : "video_track_added";
    sendToDataChannel({
      type: messageType,
      value: track.id,
    });

    peerConnection.addTrack(track, stream);

    track.onended = () => {
      deactivateVideo("local");

      // Send to peers so they know this audio/video has stopped
      const messageType =
        track.kind === "audio" ? "audio_track_removed" : "video_track_removed";
      sendToDataChannel({ type: messageType, value: track.id });
    };
  });
};

const listenRemoteStreamTrack = () => {
  peerConnection.addEventListener("track", async (event) => {
    console.info("Received track: ", event);
    const track = event.track;
    if (track.kind === "audio") return;

    const [remoteStream] = event.streams;
    const trackSignal = ReceivedTracksSignals.get(track.id);

    if (trackSignal && trackSignal === "screen_track_added") {
      activateVideo("screen", remoteStream);
      // Do not allow screen sharing while other peer is doing it
      screenSharingBtn.disabled = true;
    } else {
      activateVideo("remote", remoteStream);
    }
  });
};

const startStopScreenSharingAndRecording = async (
  options?: DisplayMediaStreamOptions,
) => {
  try {
    if (State.isSharingScreen) {
      removeDisplayMediaTrackFromPeerConnection();
      return;
    }

    const stream: MediaStream =
      await navigator.mediaDevices.getDisplayMedia(options);
    console.log("[Display media] Got MediaStream: ", stream);
    addLocalDisplayMediaStreamTracksToPeerConnection(stream);
  } catch (error) {
    console.error("Error accessing display media.", error);
  }
};

const addLocalDisplayMediaStreamTracksToPeerConnection = (
  stream: MediaStream,
) => {
  stream.getTracks().forEach((track) => {
    sendToDataChannel({
      type: "screen_track_added",
      value: track.id,
    });

    activateVideo("screen", stream);
    screenSharingBtn.textContent = "Stop screen sharing";

    screenSharingSender = peerConnection.addTrack(track, stream);

    // This is triggered usually by the "Stop sharing" from the browsers own UI
    track.onended = () => {
      deactivateVideo("screen");
      // Send to peers so they know this screensharing has stopped
      sendToDataChannel({ type: "screen_track_removed", value: track.id });
    };
  });
};

const removeDisplayMediaTrackFromPeerConnection = () => {
  if (!screenSharingSender) return;
  const track = screenSharingSender.track;
  peerConnection.removeTrack(screenSharingSender);
  if (track) {
    track.stop();
    // Send to peers so they know this screensharing has stopped
    sendToDataChannel({ type: "screen_track_removed", value: track.id });
  }

  deactivateVideo("screen");
  screenSharingSender = undefined;
};

const getConnectedDevices = async (kind?: MediaDeviceKind) => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  console.log("Devices found:", devices);

  if (kind) {
    return devices.filter((d) => d.kind === kind);
  }

  return devices;
};

const listenForDevicesChanges = () => {
  navigator.mediaDevices.addEventListener("devicechange", (event) => {
    console.log("New device: ", event);
    const updatedList = getConnectedDevices();
    console.log("Updated list: ", updatedList);
  });
};
