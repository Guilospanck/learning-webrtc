import {
  initPeer,
  peerConnection,
  ReceivedTracksSignals,
  sendOffer,
  sendToDataChannel,
} from "./peer";
import {
  initiateOfferBtn,
  localCameraStatus,
  localVideoElement,
  messageBox,
  remoteCameraStatus,
  remoteVideoElement,
  screenSharingBtn,
  screenStatus,
  sendMessageButton,
  sharingScreenElement,
} from "./ui-elements";

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
    await getScreenSharingAndRecording();
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

    localVideoElement.srcObject = stream;
    localCameraStatus.classList.add("active");

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
      localVideoElement.srcObject = null;
      localCameraStatus.classList.remove("active");

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
      sharingScreenElement.srcObject = remoteStream;
      screenStatus.classList.add("active");
    } else {
      remoteVideoElement.srcObject = remoteStream;
      remoteCameraStatus.classList.add("active");
    }
  });
};

const getScreenSharingAndRecording = async (
  options?: DisplayMediaStreamOptions,
) => {
  try {
    const stream: MediaStream =
      await navigator.mediaDevices.getDisplayMedia(options);
    console.log("[Display media] Got MediaStream: ", stream);

    sharingScreenElement.srcObject = stream;
    screenStatus.classList.add("active");
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

    peerConnection.addTrack(track, stream);

    track.onended = () => {
      sharingScreenElement.srcObject = null;
      screenStatus.classList.remove("active");
      // Send to peers so they know this screensharing has stopped
      sendToDataChannel({ type: "screen_track_removed", value: track.id });
    };
  });
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
