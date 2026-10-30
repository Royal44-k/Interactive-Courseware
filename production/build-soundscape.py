"""Original, deterministic synthesis; no sampled instruments or external audio."""
from array import array
import math
from pathlib import Path
import struct
import subprocess
import wave

HERE = Path(__file__).resolve().parent
OUTPUT = HERE.parent / '课件' / 'assets' / 'audio'
WORK = HERE / 'audio-work'
ENCODER = HERE / 'tools' / 'imageio_ffmpeg' / 'binaries' / 'ffmpeg-win-x86_64-v7.1.exe'
RATE = 22050
OUTPUT.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)

def save(name, channels, data, peak):
    maximum = max(abs(v) for v in data) or 1
    pcm = array('h', (round(max(-1, min(1, v / maximum * peak)) * 32767) for v in data))
    target = WORK / (name + '.wav')
    with wave.open(str(target), 'wb') as handle:
        handle.setnchannels(channels)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes(pcm.tobytes())
    subprocess.run([str(ENCODER), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(target), '-codec:a', 'libmp3lame', '-q:a', '3', str(OUTPUT / (name + '.mp3'))], check=True)
    print('Saved', name + '.mp3', flush=True)

length = RATE * 60
music = array('f', [0]) * (length * 2)
# D-major pentatonic: D, E, F-sharp, A, B. Sparse original melody.
frequencies = [146.8324, 164.8138, 184.9972, 220.0, 246.9417, 293.6648, 329.6276, 369.9944, 440.0]
melody = [0, 3, 5, 4, 2, 1, 3, 5, 7, 6, 4, 3, 2, 5, 3, 0, 1, 4, 6, 5, 3, 2, 4, 7, 5, 3, 1, 0, 3, 5]
for index, pitch in enumerate(melody):
    start = int((0.42 + index * 2.0) * RATE)
    frequency = frequencies[pitch]
    duration = 7.2
    pan = 0.30 + 0.40 * ((index * 7) % 11) / 10
    gains = (math.sqrt(1 - pan), math.sqrt(pan))
    amplitude = 0.48 if index % 4 == 0 else 0.34
    for sample in range(int(duration * RATE)):
        t = sample / RATE
        attack = 1 - math.exp(-t * 160)
        envelope = attack * math.exp(-t / 1.85) * (1 - t / duration) ** 2
        phase = 2 * math.pi * frequency * t + 0.035 * math.sin(2 * math.pi * 4.2 * t)
        tone = math.sin(phase) + 0.30 * math.exp(-t / 1.1) * math.sin(2.003 * phase) + 0.12 * math.exp(-t / 0.7) * math.sin(3.007 * phase) + 0.04 * math.sin(4.01 * phase)
        value = amplitude * envelope * tone
        frame = (start + sample) % length
        music[frame * 2] += value * gains[0]
        music[frame * 2 + 1] += value * gains[1]
        # Quiet stereo reflections wrap with the phrase, so the loop has no cut tail.
        echo = (frame + int(0.31 * RATE)) % length
        music[echo * 2] += value * gains[1] * 0.12
        music[echo * 2 + 1] += value * gains[0] * 0.12
save('music', 2, music, 0.57)

bird = array('f', [0]) * int(RATE * 4.2)
for start_time, duration, base in [(0.25, .42, 1850), (.86, .35, 2100), (1.52, .52, 1700), (2.42, .38, 2000), (3.02, .58, 1500)]:
    phase = 0.0
    for sample in range(int(duration * RATE)):
        t = sample / RATE
        proportion = t / duration
        frequency = base + 850 * math.sin(proportion * math.pi) + 110 * math.sin(t * 2 * math.pi * 32)
        phase += 2 * math.pi * frequency / RATE
        envelope = math.sin(math.pi * proportion) ** 2
        value = envelope * (math.sin(phase) + .10 * math.sin(phase * 2))
        frame = int(start_time * RATE) + sample
        bird[frame] += value
        echo = frame + int(.16 * RATE)
        if echo < len(bird): bird[echo] += value * .10
save('bird', 1, bird, .45)
