import { Button } from "@/components/ui/button";
import { Loader2, Pause, Play } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

export interface YouTubePreviewHandle {
  play(): Promise<void>;
  stop(): Promise<void>;
  toggle(): Promise<void>;
  init(): Promise<void>;
}

type Props = {
  /** Example: https://www.youtube.com/embed/M7lc1UVf-VE?enablejsapi=1&mute=1 */
  videoId: () => Promise<string | null | undefined> | string | null | undefined; // function to fetch video ID or direct string
  buttonDisabled?: boolean; // optional prop to disable the button
  playIcon?: ReactNode;
  pauseIcon?: ReactNode;
  loadingIcon?: ReactNode;
};

const PREVIEW_MS = 30_000; // fixed 30-second preview

/* —————————————————————————————————————————— */
export const YouTubePreview = forwardRef<YouTubePreviewHandle, Props>(
  ({ videoId, buttonDisabled, playIcon, pauseIcon, loadingIcon }, ref) => {
    const holderRef = useRef<HTMLDivElement>(null); // where the iframe lives
    const playerRef = useRef<YT.Player | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [playing, setPlaying] = useState(false);
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<
      string | undefined | null
    >(null);
    // avoid retrying videoId fetch or player init on failure
    const attemptedInit = useRef(false);

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
      new Promise<void>(async (resolve) => {
        attemptedInit.current = true;
        setLoading(true);
        await loadYT();
        if (!holderRef.current) return resolve();
        let id: string | null | undefined;
        try {
          id = await videoId();
        } catch (e) {
          console.warn("Failed to get videoId", e);
          setLoading(false);
          setReady(false);
          setPlaying(false);
          return resolve();
        }
        if (!id) {
          setLoading(false);
          setReady(false);
          setPlaying(false);
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

    const play = async (): Promise<void> => {
      if (!playerRef.current) {
        // only attempt init once
        if (!attemptedInit.current) {
          await createPlayer(true);
        } else {
          return;
        }
        if (!playerRef.current) return;
      }
      if (!ready) {
        // Don't retry if not ready
        return;
      }
      playerRef.current.playVideo();
      return;
    };

    const stop = async (): Promise<void> => {
      if (timerRef.current) clearTimeout(timerRef.current);
      playerRef.current?.pauseVideo();
      setPlaying(false);
      return;
    };

    const toggle = async (): Promise<void> => {
      return playing ? stop() : play();
    };

    // initialize player without autoplay
    const init = async (): Promise<void> => {
      if (!playerRef.current) {
        await createPlayer(false);
      }
    };

    // detect when videoId prop changes and reset player
    useEffect(() => {
      (async () => {
        const id = await videoId();
        if (id !== currentVideoId) {
          if (playerRef.current) {
            playerRef.current.destroy();
            playerRef.current = null;
          }
          attemptedInit.current = false;
          setCurrentVideoId(id);
          setReady(false);
          setLoading(false);
          setPlaying(false);
        }
      })();
    }, [videoId]);

    useImperativeHandle(ref, () => ({ play, stop, toggle, init }));

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
          disabled={buttonDisabled || loading}
        >
          {loading
            ? loadingIcon ?? <Loader2 className="w-5 h-5 animate-spin" />
            : playing
            ? pauseIcon ?? <Pause className="w-5 h-5" />
            : playIcon ?? <Play className="w-5 h-5" />}
        </Button>
      </>
    );
  }
);

export default YouTubePreview;
