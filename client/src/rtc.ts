import { initPeer, sendOffer } from "./peer";

const screenSharingBtn = document.getElementById("screenSharingBtn");
const initiateOfferBtn = document.getElementById("initiateOfferBtn");

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

  // Init peer offer/answer SDP events
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

    const videoElement = document.getElementById(
      "user-1-camera-video",
    )! as HTMLVideoElement;
    videoElement.srcObject = stream;
  } catch (error) {
    console.error("Error accessing media devices.", error);
  }
};

const getScreenSharingAndRecording = async (
  options?: DisplayMediaStreamOptions,
) => {
  try {
    const stream: MediaStream =
      await navigator.mediaDevices.getDisplayMedia(options);
    console.log("[Display media] Got MediaStream: ", stream);

    const sharingScreenUserElement = document.getElementById(
      "user-1-sharing-screen",
    )! as HTMLVideoElement;
    sharingScreenUserElement.srcObject = stream;
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
