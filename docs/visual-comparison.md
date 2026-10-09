# Visual comparison

Source frames: original1918×994 video; user-supplied material only. Implementation: Playwright Chromium at the same1918×994 viewport,100% canvas zoom. The reference replay uses actual UI gestures and reconstructs the pink and blue cell titles, list content, positions, palette, selection, connection and image dialog. See implementation-screenshots/reference-*.png. Reference recordings are not application assets.

## Verified anchors

The replay asserts expanded geometry500×384 and blue top-left(1041,185). Pink top-left is(783,591), collapsed width172 and height78. Source measurements are approximately500×383, pink172×78; one-pixel variations arise from decoding and inclusive bounds.

Pixel sampling from reference frame025.6 and implementation reference-expanded agrees exactly at these coordinates:

|Sample|Coordinate|Reference RGB|Implementation RGB|
|---|---|---|---|
|Canvas|(100,100)|31,31,28|31,31,28|
|Blue header|(1200,200)|76,101,127|76,101,127|
|Cell body|(1100,500)|58,58,53|58,58,53|
|Pink header|(800,610)|120,79,103|120,79,103|

Connection blue was sampled separately from frame046.9: dominant line pixels around RGB75,141,208; implementation uses #4b8dd0. Compression produces nearby values, so this is approximate.

## Corrections made after comparison

- Default canvas zoom changed to100% so cell/editor sizes follow the measured frame geometry.
- Expansion shifts62 px left and60 px up while dimensions change in the same component; collapse reverses these offsets.
- Header height82, expanded dimensions500×384, compact edit frame376×158 and collapsed pink172×78 follow measurements.
- A Motion transform was overriding CSS toolbar centering, shifting it right and obscuring the nearby edge. A persistent Motion x:-50% now keeps it centered; replay includes a genuine click on the line.
- Formatting toolbar shows additional inline formatting when text is selected, retaining the compact list toolbar otherwise.
- Pink text uses a warm tint, compact corners use18 px, and connection color follows the measured brighter blue.
- Color palette retains5×3 swatches and the observed three title-size choices; bubble behavior is a documented local interpretation.

## Remaining differences

Original font and exact easing are UNKNOWN. The reference opening has overshoot/camera movement; the implemented monotonic cubic transition approximates it. System Arial is used. Icon silhouettes are original Lucide controls. The above toolbar is about182 px wide versus approximately186 in the reference; list toolbar about285 versus280. Native local upload dialogs, local navigation and original branding differ from cloud/account interfaces. Connections use Bezier curves rather than matching every observed trajectory. Full popup/toolbar behavior at extreme zoom or screen edges, touch interaction, Safari and Firefox are unverified. No similarity score is claimed.
