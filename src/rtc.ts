export const initiateWebRTC = async () => {
  await askForPermissionAndSpecificDevices();
  await getConnectedDevices();
  listenForDevicesChanges;
};

const askForPermissionAndSpecificDevices = async (
  // we can ask for specific camera/audio configs here as well.
  constraints: MediaStreamConstraints = { video: true, audio: true },
) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("Got MediaStream:", stream);

    const videoElement = document.querySelector(
      "video#localVideo",
    )! as HTMLVideoElement;
    videoElement.srcObject = stream;
  } catch (error) {
    console.error("Error accessing media devices.", error);
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
