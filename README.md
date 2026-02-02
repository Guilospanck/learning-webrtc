
## Troubleshooting

### Video flickering upon peer connection

While testing this in Chrome (or Chromium) on Linux/Omarchy and Intel GPU the video would start flickering and the scrolling of the page would also flicker once the peers were connected.

To fix that, I had to go to `chrome://flags` and disable "Hardware-accelerated video decode".
