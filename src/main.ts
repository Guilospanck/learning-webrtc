import "./style.css";
import { initiateWebRTC } from "./rtc.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
   <video id="localVideo" autoplay playsinline controls="false"/>
  </div>
`;

initiateWebRTC();
