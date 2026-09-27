# Vehicle / prop preprocess (Create v1)

## Single image

1. Admit: one primary vehicle/prop; subject >1/2 frame; wheels not cropped (cars).
2. Reject: multi-car clutter, tiny subject, character photos.
3. image.rembg then composite gray/studio (never black).
4. Hash + checkpoint.

## Optional 3-4 views (multiview worker — not a skill)

When user supplies or route requests multi-angle refs (front / 3-4 / side / rear):

- Rembg + gray each view.
- Pass as multi-image payload to adapters that support it (fal/Meshy/Tripo multiview) via worker behind run-3d-job — not a 9th skill.
- If adapter lacks multiview: use best single (prefer 3-4) and note multiview_degraded on job card.

Do not invent Run API tool IDs for multiview.
