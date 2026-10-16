# General homepage hero video

Only the first hero on `/uk` and `/en` uses the abstract energy animation. Audience pages use their separately approved thematic MP4 videos and static poster fallbacks. No footage or object telemetry is implied.

`GeneralHeroVideo` selects mobile below 768 CSS pixels once after hydration. It assigns only that MP4 source, including after orientation changes. The responsive WebP poster renders on the server and remains available with JavaScript disabled, a rejected autoplay promise, or a media error. Files and checksums are recorded in `general-video-manifest.json`.

Both MP4s are H.264 Constrained Baseline level 3.1 / yuv420p, faststart, without audio. They are served as `video/mp4`. Playback is muted, inline and looping. The localized 44px Play/Pause button controls playback; the video is decorative and hidden from assistive technology. A failed autoplay attempt offers manual retry. Offscreen and hidden pages pause, and return resumes only when playback was requested. Reduced-motion starts with no MP4 request; explicit Play enables playback. A manual pause survives visibility changes.

These compatibility choices and Chromium tests do not constitute a physical iPhone/Safari runtime check. Device autoplay policies can still reject playback; the poster and explicit Play remain the fallback.
