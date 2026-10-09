# Visual measurements
Measured from unscaled decoded PNGs, not contact sheets. Dominant colors counted from frame 025.6.png. Browser/video compression can introduce ±2-channel differences.

|Element|Measurement|Confidence|
|---|---|---|
|Canvas|RGB 31,31,28 = #1f1f1c|High, >1.5 million matching pixels|
|Top bar / cell body / popup|RGB 58,58,53 = #3a3a35|High|
|Blue header|RGB 76,101,127 = #4c657f|High|
|Pink header|RGB 120,79,103 = #784f67|High|
|Primary text|Approximately #ddddda|Medium, antialiasing|
|Blue header text|Approximately #c1f4f5|Medium|
|Blue connection|Approximately RGB75,141,208 = #4b8dd0, from frame046.9 line crop|Medium, compression±2|
|Toolbar icons|Approximately #80bfea|Medium|
|Cyan selection|Approximately #00b9d6|Medium, glow blends|
|Top bar|y=2…54, about 52 px|High|
|Compact active cell|x≈719…1095, y≈429…587, width376 height158|High, frame008|
|Expanded cell|x1041…1542, y185…568, width501 height383|High, frame025.6|
|Expanded header|82 px high; title ≈36 px bold|High|
|Expanded corner radius|≈34 px at top, ≈28 bottom|Medium|
|Above toolbar|≈186×42, centered, gap20 px|High|
|Below toolbar|≈280×42; gap20 px|High|
|Side page control|40 px diameter; offset≈22 px|High|
|Palette|≈296×274; 5 columns × 3 rows, 42 px swatches|High|
|Closed pink cell|≈172×78, title-only|High|
|Bottom-right|40×82 zoom column 7 px from right/bottom; chat-like control 56 px diameter|High|

World geometry versus video zoom is UNKNOWN: UI icons in the recording also scale as the canvas zoom changes. Implementation uses world dimensions, with fixed viewport navigation. Exact font UNKNOWN; use system sans-serif with Arial fallback. All unsampled palette colors and overlay opacity are provisional. No similarity score is claimed.
