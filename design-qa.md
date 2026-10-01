# Stories design verification

Reference: desktop and mobile layouts supplied in this conversation. The original temporary screenshot files are no longer available; the mobile reference is preserved in the left half of the local comparison image.

## Rendered evidence

Local, ignored evidence in `stories/test/artifacts/`:
- `stories-desktop.png`: desktop visitor layout at 1515 × 850.
- `stories-mobile.png`: mobile visitor layout at 553 × 1205.
- `mobile-comparison.png`: supplied mobile reference beside the implementation.
- `upload-success.png`: successful local browser upload and compression.
- `live-upload-success.png`: successful production browser upload and compression.
- `live-stories.png`: production visitor page after temporary test content was removed.

Preview events are local fixtures, not production content.

## Reference match

White page and unobtrusive header; THE RAD links home. Stories is the single-word label. Desktop places the gallery on the left and title/date/copy on the right. At the reference desktop size the gallery starts near x364/y263, matching the supplied composition. Mobile places the title above the gallery and copy below it, preserving the reference whitespace and thumbnail strip. Media retains its aspect ratio.

The timeline retains visible gaps but uses continuous full-row pointer targets. Hover expands the current tick and its two neighbors on each side; the selected event is red and omits its hover label. Wheel distance accumulates without a gesture cooldown, so strong scrolling traverses several events. Transition revisions prevent older fades from overriding newer navigation.

## Verification

Browser checks covered timeline navigation, native wheel input, thumbnails, upload, successful publication, and deletion of the temporary preview fixture. Tablet document bounds were checked at 600×800, 768×1024, 820×1180, 1024×768, 1180×820, and 1366×1024 with no page overflow. Unusually long tablet copy has an internal reading area. Reduced-motion preferences and keyboard focus styles are supported.

Five automated tests pass, including proportional wheel navigation, continuous timeline hit testing, authentication and lockout, real photo/video processing, publication failure cleanup, persistence, and deletion. Live Firebase verification passed: new password accepted, old password rejected, photo and video uploaded through resumable storage with the production CORS origin, compressed successfully, published together, then deleted. The production diary was left empty for the owner’s content. GitHub Pages published successfully. The live browser accepted the new password and published a photo/video story; the visitor page displayed it and its video had looping enabled, audio muted, and native controls disabled. Browser deletion was verified separately. A final native wheel test advanced four events on the first vigorous scroll; desktop navigation does not depend on reaching the document bottom.

## Portfolio styling alignment

Updated the homepage link to “stories →”, using the existing 24px Arial arrow and 14.4px Courier label. Desktop right alignment shares the intro block’s viewport offset, including screens wider than the 1600px container. Phones place the link at 92svh with a 32px right inset, below the introduction. Verified at 1515×850, 2000×1156, 439×955 and 372×666.

Stories now shares the portfolio’s #fafafa background, Inter heading family, logo size clamp, uppercase 600-weight project titles and Courier body sizing/line height. Admin headings follow the same family. Tablet checks at 768×1024 and 1024×768 remain free of document overflow. Evidence: `home-372.png`, `home-1515.png`, `home-2000.png`, and `stories-restyled.png` in the ignored artifacts directory.

## Management and gallery refinement

Removed focus outlines from Stories and its admin/password fields. The gallery stage is transparent and retains a fixed aspect-ratio area; its controls reserve a fixed height. Browser checks with portrait, landscape and square fixtures verified identical gallery, title, copy, thumbnails and pagination bounds when switching media at 1515×850, 768×1024, 1024×768 and 439×955.

The timeline is ascending by date and opens at its latest (bottom) event. Management now opens a prefilled editor for the event title, date, text and media order. Local browser checks verified reordered items, saved edits, reopening and the chronological timeline. Automated service checks cover authenticated editing, invalid permutations, unchanged media URLs, stale-edit rejection and date sorting.

## Editing media and timeline label background

The timeline label uses the same `--paper` background as the page. Browser-computed colors both resolve to rgb(250, 250, 250).

The editor now supports selecting or dropping new photos/videos, removing existing or newly selected frames, and reordering the combined list. Changes apply on Save. The local browser verified adding a photo, removing an existing photo, placing the new photo first, saving and retaining the unchanged second photo URL. Removed media returned 404. Evidence: `stories/test/artifacts/edit-add-remove.png`.

Six service/navigation tests pass, including atomic media additions, physical removal, preservation of the original story after a bad new image, and rejection/cleanup of uploads whose story changed while processing.

## Thumbnail rows and phone navigation

Thumbnail galleries now use a wrapping grid (eight columns on desktop/tablet, six on phones), without horizontal scrolling. Phone header and content spacing are compact, with natural document scrolling only when content requires it. Browser checks verified twenty images in four rows fit at 390×844; eight images fit at 375×667; twenty images at that smaller size need only a short document scroll. Tablet checks at 768×1024 and 1024×768 retain viewport bounds with twenty images.

Touch timeline navigation captures a held pointer and maps vertical movement to event indexes, with a floating event title, continuous selection and suppression of accidental release clicks. Native Chromium touch input moved five events in one upward drag; release retained the final selection. An unobtrusive hint and larger Older/Newer buttons make navigation discoverable. Ordinary navigation no longer writes the current story into the URL, so a refresh opens the newest date. Explicit event links still open their target. Verified with thirty out-of-order fixtures and a fresh reload. Evidence: `stories/test/artifacts/phone-thumbnail-rows.png`.

## Idle-only help and aligned touch timeline

The touch hint stays hidden until five seconds of inactivity, appears outside document flow, and is remembered in local storage after being shown or dismissed. Pointer/click, keyboard or wheel interaction dismisses it; subsequent visits do not repeat it. Browser checks verified initial hiding, five-second reveal without layout movement, dismissal and no return after reload.

Touch selection now uses each timeline row’s measured screen coordinates instead of estimated gesture steps. Holding near the list edge scrolls the marks while continuously remeasuring the nearest row; release does not recenter. Native Chromium touch checks with eighty events kept the selected tick within half a row (eight pixels) of the finger, including edge scrolling.

The smaller THE RAD logo leaves space for an absolutely centered Stories wordmark. Measured center error was zero at 320, 390, 768 and 1515px widths, with no logo overlap. Evidence: `stories/test/artifacts/timeline-alignment-phone.png`.
