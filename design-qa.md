# Stories design verification

Reference: desktop and mobile layouts supplied in this conversation. The original temporary screenshot files are no longer available; the mobile reference is preserved in the left half of the local comparison image.

## Rendered evidence

Local, ignored evidence in `stories/test/artifacts/`:
- `stories-desktop.png`: desktop visitor layout at 1515 × 850.
- `stories-mobile.png`: mobile visitor layout at 553 × 1205.
- `mobile-comparison.png`: supplied mobile reference beside the implementation.
- `upload-success.png`: successful browser upload and compression.

Preview events are local fixtures, not production content.

## Reference match

White page and unobtrusive header; THE RAD links home. Stories is the single-word label. Desktop places the gallery on the left and title/date/copy on the right. At the reference desktop size the gallery starts near x364/y263, matching the supplied composition. Mobile places the title above the gallery and copy below it, preserving the reference whitespace and thumbnail strip. Media retains its aspect ratio.

The timeline retains visible gaps but uses continuous full-row pointer targets. Hover expands the current tick and its two neighbors on each side; the selected event is red and omits its hover label. Wheel distance accumulates without a gesture cooldown, so strong scrolling traverses several events. Transition revisions prevent older fades from overriding newer navigation.

## Verification

Browser checks covered timeline navigation, native wheel input, thumbnails, upload, successful publication, and deletion of the temporary preview fixture. Tablet document bounds were checked at 600×800, 768×1024, 820×1180, 1024×768, 1180×820, and 1366×1024 with no page overflow. Unusually long tablet copy has an internal reading area. Reduced-motion preferences and keyboard focus styles are supported.

Five automated tests pass, including proportional wheel navigation, continuous timeline hit testing, authentication and lockout, real photo/video processing, publication failure cleanup, persistence, and deletion. Live Firebase verification passed: new password accepted, old password rejected, photo and video uploaded through resumable storage with the production CORS origin, compressed successfully, published together, then deleted. The production diary was left empty for the owner’s content. GitHub Pages and live admin browser checks follow publication.
