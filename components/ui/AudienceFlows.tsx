import type { Audience } from "./AudienceScene";

// Illustration coordinates, not measured electrical connections. Each overlay
// shares the poster's 16:9 coordinate system and cover crop. Different source
// compositions (especially community/citizens) need different route geometry.
const routes: Record<Audience, { mobile: string[]; desktop?: string[] }> = {
  business: { mobile: ["M 500 340 L 520 317 L 647 332 L 694 320 L 713 355", "M 782 465 L 800 420 L 945 446"] },
  community: {
    mobile: ["M 250 260 L 345 320 L 435 370 L 370 405 L 520 520", "M 560 226 Q 540 245 590 260 L 760 323 L 890 340"],
    desktop: ["M 390 290 L 465 340 L 430 350 L 560 425 L 605 445 L 660 398", "M 570 265 L 675 310 L 805 365 L 925 420"],
  },
  citizens: {
    mobile: ["M 535 420 L 440 441 L 270 405"],
    desktop: ["M 738 365 L 680 397 L 520 375 L 370 360"],
  },
  osbb: { mobile: ["M 420 224 L 535 245 L 600 236 L 635 211", "M 660 230 L 710 262 L 710 346"] },
  developers: { mobile: ["M 360 415 Q 680 540 785 440 Q 805 416 815 390", "M 145 340 Q 210 370 350 325"] },
  donors: { mobile: ["M 470 285 L 530 315 L 510 330 L 620 400 L 715 410", "M 300 455 L 340 480 L 590 440 L 710 400"] },
};

export function AudienceFlows({ audience }: { audience: Audience }) {
  const scene = routes[audience];
  return (["mobile", "desktop"] as const).map((profile) => (
    <svg key={profile} className={`audience-flows audience-flows-${profile}`} data-flow-profile={profile}
      viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {(profile === "desktop" ? scene.desktop ?? scene.mobile : scene.mobile).map((d, index) => (
        <g key={d} className={index % 2 ? "audience-flow-warm" : "audience-flow-cool"}>
          <path d={d} className="audience-flow-track" vectorEffect="non-scaling-stroke" />
          <path d={d} pathLength={100} className="audience-flow-pulse" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  ));
}
