# Animation measurements
Original video sampled at 30 fps. Opening transition additionally sampled every .1 s from 18.8 to20.3. PNGs preserved in reference-frames/open-*.png.

At19.00 placeholder remains; at19.10 editor appears and geometry already grows;19.20–19.60 card grows smoothly;19.70–19.90 settles. Observed duration approximately0.8 s, uncertainty±0.1 s. Width≈376→500 and height≈158→383. Left edge moves left by≈62 px; top shifts upward; pointer stays in editing area. It is a continuous resize of the same header/body. Easing curve UNKNOWN; implement spring-like cubic easing with800ms dimensions and reduced-motion override. Exact camera contribution to trajectory UNKNOWN.

Collapse transition occurs between the sampled12 and14 s frames; precise timing UNKNOWN. Use240ms provisionally. Toolbar fade140ms and palette150ms provisional. Hover120ms provisional. Selection glow has no defensible measured transition duration; use short120ms border transition. No exact reproduction claim for unmeasurable trajectories.

## Consecutive-frame data

opening-frame-measurements.csv records45 consecutive native30 fps frames from18.800 to20.2667 s. These were decoded directly from the video, not inferred from the sampled screenshots. Color segmentation usesRGB tolerance±3, selects the largest continuous row region and excludes short-lived side controls by column occupancy. Rounded/antialiased boundary pixels make boxes approximate by a few pixels.

The sequence shows upper/left overshoot while opening and later settling. The camera contribution is UNKNOWN. The implementation uses an800 ms monotonic cubic transition and explicit world-coordinate offsets; it does not claim the exact reference spring or camera-coupled trajectory. Closing timing remains provisional.
