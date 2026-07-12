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

const assets = [
  ["public/workflow/describe.png", "hydrilla-landing/workflow/describe"],
  ["public/workflow/generated-model1.png", "hydrilla-landing/workflow/generated-model1"],
  ["public/workflow/generated-model2.png", "hydrilla-landing/workflow/generated-model2"],
  ["public/workflow/refine.png", "hydrilla-landing/workflow/refine"],
  ["public/workflow/image.png", "hydrilla-landing/workflow/workspace"],
  ["public/workflow/worflow-image-mobile.png", "hydrilla-landing/workflow/workflow-mobile"],
  ["public/workflow/back.gif", "hydrilla-landing/workflow/back"],
  ["public/features/3d1.png", "hydrilla-landing/features/3d1"],
  ["public/features/3d2.png", "hydrilla-landing/features/3d2"],
  ["public/features/3d3.png", "hydrilla-landing/features/3d3"],
  ["public/features/3d4.png", "hydrilla-landing/features/3d4"],
  ["public/features/3d5.png", "hydrilla-landing/features/3d5"],
  ["public/features/3d6.png", "hydrilla-landing/features/3d6"],
  ["public/features/3d7.png", "hydrilla-landing/features/3d7"],
  ["public/features/3d8.png", "hydrilla-landing/features/3d8"],
  ["public/industrypower/dino.png", "hydrilla-landing/industrypower/dino"],
  ["public/industrypower/films&a.png", "hydrilla-landing/industrypower/films-a"],
  ["public/industrypower/architecture.png", "hydrilla-landing/industrypower/architecture"],
  ["public/industrypower/arvr1.png", "hydrilla-landing/industrypower/arvr1"],
  ["public/industrypower/lampprop.png", "hydrilla-landing/industrypower/lampprop"],
  ["public/herohydrillasrc.jpg", "hydrilla-landing/hero/poster"],
  ["public/usecase/games.jpg", "hydrilla-landing/usecase/games"],
  ["public/usecase/films.png", "hydrilla-landing/usecase/films"],
  ["public/usecase/archi.jpg", "hydrilla-landing/usecase/archi"],
  ["public/usecase/prod.jpg", "hydrilla-landing/usecase/prod"],
  ["public/usecase/arvr3.jpg", "hydrilla-landing/usecase/arvr3"],
  ["public/usecase/arvrxr.jpg", "hydrilla-landing/usecase/arvrxr"],
  ["public/usecase/arvrxr2.jpg", "hydrilla-landing/usecase/arvrxr2"],
];

const videoAssets = [
  ["public/herohydrilla.mp4", "hydrilla-landing/hero/backdrop"],
];

const optimizedUrl = (publicId) =>
  cloudinary.url(publicId, {
    secure: true,
    fetch_format: "auto",
    quality: "auto",
  });

const results = [];

for (const [file, publicId] of assets) {
  const result = await cloudinary.uploader.upload(file, {
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });

  results.push({
    file,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    optimizedUrl: optimizedUrl(result.public_id),
  });
}

for (const [file, publicId] of videoAssets) {
  const result = await cloudinary.uploader.upload(file, {
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: "video",
  });

  results.push({
    file,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    optimizedUrl: cloudinary.url(result.public_id, {
      secure: true,
      resource_type: "video",
      quality: "auto",
    }),
  });
}

console.log(JSON.stringify(results, null, 2));
