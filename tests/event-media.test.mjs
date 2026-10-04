import test from "node:test";
import assert from "node:assert/strict";
import {
  getEventMediaError,
  isEventVideo,
  isValidEventImageStoragePath,
  EVENT_VIDEO_MAX_BYTES,
  EVENT_IMAGE_MAX_BYTES,
} from "../apps/web/src/lib/events/event-images.ts";

test("media types, empty files and independent image/video limits", () => {
  for (const type of [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
  ])
    assert.equal(getEventMediaError({ type, size: 1024 }), null);
  assert.match(getEventMediaError({ type: "text/html", size: 100 }), /Admite/);
  assert.match(getEventMediaError({ type: "video/mp4", size: 0 }), /vacío/);
  assert.equal(
    getEventMediaError({ type: "video/mp4", size: EVENT_VIDEO_MAX_BYTES }),
    null,
  );
  assert.match(
    getEventMediaError({ type: "video/mp4", size: EVENT_VIDEO_MAX_BYTES + 1 }),
    /50 MB/,
  );
  assert.match(
    getEventMediaError({ type: "image/png", size: EVENT_IMAGE_MAX_BYTES + 1 }),
    /6 MB/,
  );
  assert.match(getEventMediaError({ type: "video/mp4", size: NaN }), /válido/);
});
test("storage paths cannot escape the authenticated event or use active content", () => {
  assert.equal(
    isValidEventImageStoragePath("owner/event/file.mp4", "owner", "event"),
    true,
  );
  for (const path of [
    "other/event/file.mp4",
    "owner/other/file.png",
    "owner/event/../file.png",
    "owner/event/nested/file.png",
    "owner/event/file.svg",
    "owner/event/file.mp4?fake.jpg",
  ]) {
    assert.equal(
      isValidEventImageStoragePath(path, "owner", "event"),
      false,
      path,
    );
  }
});
test("legacy photos stay photos and videos accept public URL query strings", () => {
  assert.equal(
    isEventVideo("https://example.com/event/file.WEBM?token=1"),
    true,
  );
  assert.equal(isEventVideo("owner/event/file.mp4"), true);
  assert.equal(isEventVideo("owner/event/file.webp"), false);
});
