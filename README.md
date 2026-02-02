# WebRTC

Simple application to learn some of the principles of WebRTC. It allows you to send chat messages, stream your camera and share screen with another peer.

## Running

Install server dependencies and run it:

```sh
cd server/ && go mod tidy && go run .
```

Install client dependencies and run it (run the `npm run dev` in two different terminals so you can have two peers):

```sh
cd client/ && npm i && npm run dev
```

Now go to `http://localhost:3000` and (usually) `http://localhost:3001` (otherwise check starting logs of the vite).

## Troubleshooting

### Video flickering upon peer connection

While testing this in Chrome (or Chromium) on Linux/Omarchy and Intel GPU the video would start flickering and the scrolling of the page would also flicker once the peers were connected.

To fix that, I had to go to `chrome://flags` and disable "Hardware-accelerated video decode".
