import { Button } from "@/components/ui/button";
import { Loader2, Pause, Play } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  /** Example: https://www.youtube.com/embed/M7lc1UVf-VE?enablejsapi=1&mute=1 */
  videoId: () => Promise<string | null | undefined> | string | null | undefined; // function to fetch video ID or direct string
};

const PREVIEW_MS = 30_000; // fixed 30-second preview

/* —————————————————————————————————————————— */
export function YouTubePreview({ videoId }: Props) {
  const holderRef = useRef<HTMLDivElement>(null); // where the iframe lives
  const playerRef = useRef<YT.Player | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // load the YouTube IFrame API when needed
  const loadYT = () =>
    new Promise<void>((resolve) => {
      if ((window as any).YT?.Player) return resolve();
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      const prevCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        resolve();
        if (typeof prevCallback === "function") prevCallback();
      };
    });

  // instantiate player on first play; resolves when ready (and auto-plays if requested)
  const createPlayer = (autoplay = false) =>
    new Promise<void>((resolve) => {
      setLoading(true);
      loadYT().then(async () => {
        if (!holderRef.current) return resolve();
        const id = await videoId();
        if (!id) {
          console.warn("Invalid YouTube video ID");
          return resolve();
        }
        playerRef.current = new window.YT.Player(holderRef.current, {
          height: "390",
          width: "640",
          videoId: id,

          playerVars: { mute: 0, rel: 0, playsinline: 1 },
          events: {
            onReady: (e) => {
              setReady(true);
              e.target.unMute();
              if (autoplay) {
                e.target.seekTo(30, true);
                e.target.playVideo();
              }
              resolve();
            },
            onStateChange: (e) => {
              const s = e.data;
              if (s === window.YT.PlayerState.PLAYING) {
                setLoading(false);
                setPlaying(true);
                timerRef.current = setTimeout(stop, PREVIEW_MS);
              } else if (
                s === window.YT.PlayerState.ENDED ||
                s === window.YT.PlayerState.PAUSED
              ) {
                setPlaying(false);
              }
            },
          },
        });
      });
    });

  const play = () => {
    if (!playerRef.current) {
      // first time: create iframe + player (with autoplay)
      createPlayer(true);
      return;
    }
    if (!ready) {
      console.log("Player not ready yet");
      return;
    }
    // subsequent plays
    playerRef.current.seekTo(30, true);
    playerRef.current.playVideo();
  };

  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    playerRef.current?.pauseVideo();
    setPlaying(false);
  };

  const toggle = () => (playing ? stop() : play());

  /* render ───────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* video container, hidden until play */}
      <div ref={holderRef} style={{ display: playing ? "block" : "none" }} />

      {/* visible icon button, styled to match remove/boost buttons */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        variant="default"
        size="icon"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : playing ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </Button>
    </>
  );
}

export default YouTubePreview;
