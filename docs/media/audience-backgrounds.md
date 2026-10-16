# Audience video backgrounds

The six audience routes use user-supplied MP4 videos and matching static WebP posters. They do not use CSS pan/zoom or synthetic SVG energy flows. The general homepage video remains separate and unchanged.

Approved mapping:

| Route | Video |
| --- | --- |
| community | Community |
| business | BESS / industrial city |
| developers | Solar station and storage |
| donors | Investors |
| citizens | Private house |
| osbb | Same private-house video as citizens, explicitly approved |

Investor-video figures are illustrative, not forecasts or amendments to the financial model. The visible caption says so in both locales. Citizens/OSBB identify the private-house illustration. Videos are illustrations, not asserted evidence of completed projects.

`AudienceScene` provides the responsive server-rendered poster. `AudienceVideoPlayer` chooses one desktop/mobile MP4 on hydration and keeps that choice during the visit, including rotation. Source assignment is deferred until playback is requested. Reduced-motion therefore makes no MP4 request before explicit Play. Playback is muted, inline and looping, with localized Play/Pause controls. A rejected autoplay promise or failed media request leaves the poster visible and offers manual retry. Hidden/offscreen playback pauses; a manual pause survives return.

Mobile keeps the complete landscape video above the copy. Desktop preserves the existing background crop and text-protection gradient. There is no transform animation on the picture, video or container. Actual playback validation must measure advancing currentTime and decoded frames, not CSS movement or screenshot differences alone.

Assets are under `public/assets/thematic-video/{community,business,developers,donors,home-osbb}`; provenance and checksums are in `thematic-video-manifest.json`. Original source files remain outside public. These videos repeat with a visible restart; they are not seamless loops. Physical Safari remains unverified until tested on an actual device.
