from array import array
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import subprocess
import wave

here = Path(__file__).resolve().parent
output = here.parent / '课件' / 'assets' / 'audio'
encoder = here / 'tools' / 'imageio_ffmpeg' / 'binaries' / 'ffmpeg-win-x86_64-v7.1.exe'
names = [f'stage-{index}' for index in range(18)] + [f'poem-{index}' for index in range(3)] + ['full-poem', 'music', 'bird']

def inspect(name):
    target = output / (name + '.mp3')
    if not target.is_file() or target.stat().st_size < 1000:
        raise RuntimeError(f'Missing or empty audio: {name}')
    result = subprocess.run([str(encoder), '-v', 'error', '-i', str(target), '-f', 'null', '-'], capture_output=True, text=True)
    if result.returncode or result.stderr.strip():
        raise RuntimeError(f'Decode failed for {name}: {result.stderr}')
    with wave.open(str(here / 'audio-work' / (name + '.wav')), 'rb') as handle:
        rate, channels = handle.getframerate(), handle.getnchannels()
        duration = handle.getnframes() / rate
        samples = array('h', handle.readframes(handle.getnframes()))
    peak = max(abs(value) for value in samples)
    if peak == 0: raise RuntimeError(f'Silent audio: {name}')
    row = {'file': target.name, 'seconds': round(duration, 3), 'bytes': target.stat().st_size, 'channels': channels, 'source_wave_sample_rate': rate, 'decode': 'PASS', 'non_silent': True}
    if name == 'music': row['loop_seam_max_sample_step'] = max(abs(samples[c] - samples[-channels + c]) for c in range(channels))
    return row

with ThreadPoolExecutor(max_workers=4) as pool:
    rows = list(pool.map(inspect, names))
(here / 'audio-verification.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'PASS: {len(rows)} MP3 files decoded, all non-silent.')
for row in rows:
    if row['file'] in ('music.mp3', 'bird.mp3', 'full-poem.mp3'): print(row)
