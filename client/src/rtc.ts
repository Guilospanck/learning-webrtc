import {
  createDataChannel,
  initPeer,
  peerConnection,
  sendOffer,
  sendToDataChannel,
} from "./peer";

const screenSharingBtn = document.getElementById(
  "screen-sharing-btn",
)! as HTMLButtonElement;
const initiateOfferBtn = document.getElementById(
  "initiate-offer-btn",
)! as HTMLButtonElement;
const createDataChannelBtn = document.getElementById(
  "create-data-channel-btn",
)! as HTMLButtonElement;
const sendMessageButton = document.getElementById(
  "send-message-btn",
)! as HTMLButtonElement;

const localVideoElement = document.getElementById(
  "local-camera-video",
)! as HTMLVideoElement;
const localSharingScreenElement = document.getElementById(
  "local-sharing-screen",
)! as HTMLVideoElement;
const remoteVideoElement = document.getElementById(
  "remote-camera-video",
)! as HTMLVideoElement;

const messageBox = document.getElementById("message-box")! as HTMLInputElement;

// Status indicators
const localCameraStatus = document.getElementById(
  "local-camera-status",
)! as HTMLSpanElement;
const screenStatus = document.getElementById(
  "screen-status",
)! as HTMLSpanElement;
const remoteCameraStatus = document.getElementById(
  "remote-camera-status",
)! as HTMLSpanElement;

export const initiateWebRTC = async () => {
  await getAudioAndVideoDevices();

  // The screensharing MUST be user initiated.
  screenSharingBtn?.addEventListener("click", async () => {
    await getScreenSharingAndRecording();
  });

  initiateOfferBtn?.addEventListener("click", async () => {
    await sendOffer();
    initiateOfferBtn.textContent = "Connection Started";
    initiateOfferBtn.disabled = true;
  });

  createDataChannelBtn?.addEventListener("click", () => {
    createDataChannel();
  });

  sendMessageButton?.addEventListener("click", () => {
    const message = messageBox.value;
    sendToDataChannel(message);
    messageBox.value = "";
  });

  messageBox?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const message = messageBox.value;
      if (message.trim()) {
        sendToDataChannel(message);
        messageBox.value = "";
      }
    }
  });

  await getConnectedDevices();
  listenForDevicesChanges;

  // listen to remote tracks
  addRemoteStreamTrack();

  // Init peer offer/answer SDP events and gather ICE candidates
  initPeer();
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

    addLocalStreamTracksToPeerConnection(stream);
  } catch (error) {
    console.error("Error accessing media devices.", error);
  }
};

const addLocalStreamTracksToPeerConnection = (stream: MediaStream) => {
  stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
};

const addRemoteStreamTrack = () => {
  peerConnection.addEventListener("track", async (event) => {
    console.info("Received track: ", event);
    const [remoteStream] = event.streams;
    remoteVideoElement.srcObject = remoteStream;
    remoteCameraStatus.classList.add("active");
  });
};

const getScreenSharingAndRecording = async (
  options?: DisplayMediaStreamOptions,
) => {
  try {
    const stream: MediaStream =
      await navigator.mediaDevices.getDisplayMedia(options);
    console.log("[Display media] Got MediaStream: ", stream);

    localSharingScreenElement.srcObject = stream;
    screenStatus.classList.add("active");
  } catch (error) {
    console.error("Error accessing display media.", error);
  }
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
