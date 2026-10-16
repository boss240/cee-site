# Audience background illustrations

`AudienceScene` renders the original single-frame WebP assets from
`CEE-website-upgrade-20261011.zip`; SHA256 provenance is in
`audience-assets-manifest.json`. The repository includes the actual assets in
`public/assets/hero-video`, not only an installer manifest. The historical
`hero-video` directory name does not mean these files are video.

All six audience routes use their corresponding artwork. Business, community
and citizens use desktop/mobile sources. OSBB, developers and donors use the
correctly themed mobile source on both sizes, avoiding the near-duplicate
solar-farm desktop scenes. These 960×540 originals may appear softer on large
screens; they have not been falsely upscaled or presented as distinct videos.

On narrow screens the full 16:9 illustration is above the copy. Desktop uses a
background gradient to preserve text contrast. A visible caption identifies
these as illustrations, not evidence of completed projects.

The animation is a gentle CSS camera pan/zoom, not filmed machinery or newly
simulated electricity flows. Play/Pause is always available; reduced-motion
starts paused, with explicit opt-in. A scoped CSS duration override allows
that opt-in without the global 0.01ms reduced-motion rule creating a fast loop.
Offscreen/hidden scenes pause. Without JavaScript the poster stays visible and
static. General Canvas stars were removed from these six pages, including CTA
bands; other pages retain their existing background.

No archived installer, general abstract video, broken HeroVideo import or
H.264 4:4:4 file is deployed. Future actual video needs its own compatible
encodes and Safari device validation; no physical iPhone validation is claimed.
