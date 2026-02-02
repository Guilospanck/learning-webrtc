import { initPeer, peerConnection, sendOffer } from "./peer";

const screenSharingBtn = document.getElementById("screenSharingBtn");
const initiateOfferBtn = document.getElementById("initiateOfferBtn");
const localVideoElement = document.getElementById(
  "local-camera-video",
)! as HTMLVideoElement;
const localSharingScreenElement = document.getElementById(
  "local-sharing-screen",
)! as HTMLVideoElement;
const remoteVideoElement = document.getElementById(
  "remote-camera-video",
)! as HTMLVideoElement;

export const initiateWebRTC = async () => {
  await getAudioAndVideoDevices();

  // The screensharing MUST be user initiated.
  screenSharingBtn?.addEventListener("click", async () => {
    await getScreenSharingAndRecording();
  });

  initiateOfferBtn?.addEventListener("click", async () => {
    await sendOffer();
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
