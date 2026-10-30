from pathlib import Path
import numpy as np,wave,subprocess
p=Path(__file__).resolve().parents[2]/'诗境重构版'/'assets'/'audio'
encoder=Path(__file__).resolve().parents[1]/'tools'/'imageio_ffmpeg'/'binaries'/'ffmpeg-win-x86_64-v7.1.exe'
rng=np.random.default_rng(41029);rate=22050;n=rate*30;t=np.arange(n)/rate;freq=np.fft.rfftfreq(n,1/rate)
for name,roll in [('wind',1500),('sea',4200),('river',6500)]:
 channels=[]
 for side in range(2):
  z=rng.normal(size=n);s=np.fft.rfft(z);shape=1/np.sqrt(np.maximum(freq,90));shape*=np.exp(-(freq/roll)**2);s*=shape;s[0]=0;a=np.fft.irfft(s,n)
  envelope=.56+.3*np.sin(2*np.pi*t/(7.5 if name=='sea' else 15)+side*.15)+.09*np.sin(2*np.pi*t/3.75)
  if name=='river':envelope=.8+.1*np.sin(2*np.pi*t/10+side)
  channels.append(a*envelope)
 a=np.column_stack(channels);a=a/np.max(np.abs(a))*.7;tmp=p/('amb-'+name+'.wav')
 with wave.open(str(tmp),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate);f.writeframes((a*32767).astype('<i2').tobytes())
 subprocess.run([str(encoder),'-hide_banner','-loglevel','error','-y','-i',str(tmp),'-codec:a','libmp3lame','-q:a','4',str(p/('amb-'+name+'.mp3'))],check=True)
 tmp.unlink();print(name,flush=True)
