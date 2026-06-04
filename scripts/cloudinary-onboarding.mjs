#!/usr/bin/env node

import { v2 as cloudinary } from "cloudinary";
import { readFileSync } from "node:fs";

function loadLocalEnv() {
  const text = readFileSync(".env.local", "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

const env = loadLocalEnv();

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  const sampleImageUrl =
    "https://res.cloudinary.com/demo/image/upload/sample.jpg";

  const uploadResult = await cloudinary.uploader.upload(sampleImageUrl, {
    folder: "hydrilla-onboarding",
    public_id: `sample-${Date.now()}`,
    overwrite: false,
  });

  console.log("Uploaded image secure URL:");
  console.log(uploadResult.secure_url);
  console.log("Uploaded image public ID:");
  console.log(uploadResult.public_id);

  const details = await cloudinary.api.resource(uploadResult.public_id);

  console.log("Image metadata:");
  console.log(`Width: ${details.width}`);
  console.log(`Height: ${details.height}`);
  console.log(`Format: ${details.format}`);
  console.log(`File size bytes: ${details.bytes}`);

  const transformedUrl = cloudinary.url(uploadResult.public_id, {
    secure: true,
    // f_auto lets Cloudinary choose the best supported image format for the browser.
    fetch_format: "auto",
    // q_auto lets Cloudinary choose an efficient quality level for smaller files.
    quality: "auto",
  });

  console.log(
    "Done! Click link below to see optimized version of the image. Check the size and the format."
  );
  console.log(transformedUrl);
}

main().catch((error) => {
  console.error("Cloudinary onboarding failed:");
  console.error(error);
  process.exit(1);
});
