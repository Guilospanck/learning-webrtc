import { State } from "./state";

/* Buttons */
export const screenSharingBtn = document.getElementById(
  "screen-sharing-btn",
)! as HTMLButtonElement;
export const initiateOfferBtn = document.getElementById(
  "initiate-offer-btn",
)! as HTMLButtonElement;
export const sendMessageButton = document.getElementById(
  "send-message-btn",
)! as HTMLButtonElement;

/* Videos */
export const localVideoElement = document.getElementById(
  "local-camera-video",
)! as HTMLVideoElement;
export const sharingScreenElement = document.getElementById(
  "sharing-screen",
)! as HTMLVideoElement;
export const remoteVideoElement = document.getElementById(
  "remote-camera-video",
)! as HTMLVideoElement;

// Status indicators
export const localCameraStatus = document.getElementById(
  "local-camera-status",
)! as HTMLSpanElement;
export const screenStatus = document.getElementById(
  "screen-status",
)! as HTMLSpanElement;
export const remoteCameraStatus = document.getElementById(
  "remote-camera-status",
)! as HTMLSpanElement;
export const messagingStatus = document.getElementById(
  "messaging-status",
)! as HTMLSpanElement;

export const messageBox = document.getElementById(
  "message-box",
)! as HTMLInputElement;
export const messagesTextArea = document.getElementById(
  "messages",
)! as HTMLTextAreaElement;

export const activateVideo = (
  type: "local" | "remote" | "screen",
  media: MediaStream,
) => {
  switch (type) {
    case "local":
      localVideoElement.srcObject = media;
      localCameraStatus.classList.add("active");
      break;
    case "remote":
      remoteVideoElement.srcObject = media;
      remoteCameraStatus.classList.add("active");
      break;
    case "screen":
      sharingScreenElement.srcObject = media;
      screenStatus.classList.add("active");
      State.isSharingScreen = true;
      break;
  }
};

export const deactivateVideo = (type: "local" | "remote" | "screen") => {
  switch (type) {
    case "local":
      localVideoElement.srcObject = null;
      localCameraStatus.classList.remove("active");
      break;
    case "remote":
      remoteVideoElement.srcObject = null;
      remoteCameraStatus.classList.remove("active");
      break;
    case "screen":
      sharingScreenElement.srcObject = null;
      screenStatus.classList.remove("active");
      screenSharingBtn.disabled = false;
      screenSharingBtn.textContent = "Share Screen";
      State.isSharingScreen = false;
      break;
  }
};
