"""Convert actual Chrome JPEG screencast frames to a timed, looping GIF.

Usage: python render-cast.py <measure-workspace>/evidence <output-directory>
Requires Pillow. Each source timestamp is seconds since the Unix epoch.
"""
import base64
import io
import json
import sys
from pathlib import Path

from PIL import Image

source, output = map(Path, sys.argv[1:])
output.mkdir(parents=True, exist_ok=True)
metadata = {}
for capture in sorted((source / "captures").glob("*.json")):
    version = capture.stem
    records = json.loads(capture.read_text())
    frames = []
    times = []
    for record in records:
        if times and record["time"] < times[-1]:
            raise ValueError("Frame timestamps are out of order")
        with Image.open(io.BytesIO(base64.b64decode(record["jpeg"]))) as image:
            frames.append(image.convert("RGB"))
        times.append(record["time"])
    # GIF delays have 10 ms resolution. Preserve elapsed time across adjacent frames.
    ticks = [round((t - times[0]) * 100) for t in times]
    kept = [i for i in range(len(ticks) - 1) if ticks[i + 1] > ticks[i]]
    delays = [(ticks[i + 1] - ticks[i]) * 10 for i in kept] + [900]
    displayed = [frames[i] for i in kept] + [frames[-1]]
    displayed[0].save(output / f"{version}.gif", save_all=True,
                      append_images=displayed[1:], duration=delays, loop=0, optimize=False)
    metadata[version] = {"timestampsSeconds": times, "sourceFrames": len(records),
                         "gifFinalHoldMs": 900, "size": list(frames[0].size)}
(output / "timing.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8", newline="\n")
