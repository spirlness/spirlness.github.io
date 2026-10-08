# Video fixture

`video.webm.base64` encodes a 2-second, silent, 160×90 VP8 WebM generated locally with:

```sh
ffmpeg -f lavfi -i 'color=c=0x315a72:s=160x90:r=10:d=2' -an -c:v libvpx -b:v 24k video.webm
base64 video.webm > video.webm.base64
```

It contains only a synthetic solid color and no third-party media. The text encoding keeps the tiny fixture reviewable and portable. Playwright decodes it and intercepts test-only document/media URLs. The documents render the production `ProjectMedia` component; fixtures are never added to site content, `public/`, or the deployment export.
