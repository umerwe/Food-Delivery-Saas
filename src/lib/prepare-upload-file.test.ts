import { describe, expect, it } from "vitest";

import { getWebpUploadFileName, isImageUploadFile, prepareUploadFile } from "./prepare-upload-file";

describe("prepare upload file", () => {
  it("maps image file names to webp", () => {
    expect(getWebpUploadFileName("profile.JPG")).toBe("profile.webp");
    expect(getWebpUploadFileName("avatar")).toBe("avatar.webp");
    expect(getWebpUploadFileName("C:\\temp\\photo.png")).toBe("C:\\temp\\photo.webp");
  });

  it("preserves non-image files unchanged", async () => {
    const file = new File(["pdf"], "receipt.pdf", { type: "application/pdf" });

    expect(isImageUploadFile(file)).toBe(false);
    await expect(prepareUploadFile(file)).resolves.toEqual({ file, originalFile: file });
  });
});
