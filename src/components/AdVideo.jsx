import { useEffect, useRef } from 'react';

const BASE = import.meta.env.BASE_URL;

// The silent Home ad. It always plays by itself: no controls, no tap to start.
// Phones only allow autoplay when the video is muted *as an attribute*, which
// React doesn't write, so we set it by hand and call play() ourselves. If the
// browser still refuses (e.g. iPhone Low Power Mode), it starts on the first
// touch or scroll anywhere on the page.
export default function AdVideo({ name = 'kinakango-ad', label = 'KinakanGo ad: browse food, order, and track your rider' }) {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true; v.defaultMuted = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    const play = () => { if (v.paused) v.play().catch(() => {}); };

    const events = ['touchstart', 'pointerdown', 'scroll', 'keydown'];
    events.forEach(e => window.addEventListener(e, play, { passive: true }));
    // Keep it playing when it comes back on screen or the tab comes back
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) play(); });
    io.observe(v);
    const onVis = () => { if (!document.hidden) play(); };
    document.addEventListener('visibilitychange', onVis);
    v.addEventListener('canplay', play);
    v.addEventListener('pause', play);   // never stays paused
    play();

    return () => {
      events.forEach(e => window.removeEventListener(e, play));
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      v.removeEventListener('canplay', play);
      v.removeEventListener('pause', play);
    };
  }, []);

  return (
    <video ref={ref} className="ad-video w-full aspect-video rounded-3xl object-cover block pointer-events-none select-none"
      src={`${BASE}assets/${name}.mp4`}
      poster={`${BASE}assets/${name}-poster.jpg`}
      autoPlay muted loop playsInline preload="auto"
      controls={false} disablePictureInPicture disableRemotePlayback
      controlsList="nodownload nofullscreen noremoteplayback"
      tabIndex={-1}
      aria-label={label} />
  );
}
