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
  /** The YouTube video ID to play, or null/undefined if not yet loaded */
  videoId: string | null | undefined;
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
    // Track the video ID that the current player is loaded with
    const loadedVideoIdRef = useRef<string | null>(null);

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
    const createPlayer = (targetVideoId: string, autoplay = false) =>
      new Promise<void>(async (resolve) => {
        setLoading(true);
        await loadYT();
        if (!holderRef.current) {
          setLoading(false);
          return resolve();
        }

        loadedVideoIdRef.current = targetVideoId;

        playerRef.current = new window.YT.Player(holderRef.current, {
          height: "390",
          width: "640",
          videoId: targetVideoId,
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

    // Destroy current player
    const destroyPlayer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      loadedVideoIdRef.current = null;
      setReady(false);
      setLoading(false);
      setPlaying(false);
    };

    const play = async (): Promise<void> => {
      // If no video ID, can't play
      if (!videoId) return;

      // If player exists but with wrong video, destroy it first
      if (playerRef.current && loadedVideoIdRef.current !== videoId) {
        destroyPlayer();
      }

      // Create player if needed
      if (!playerRef.current) {
        await createPlayer(videoId, true);
        return;
      }

      // Player exists and is ready, just play
      if (ready) {
        playerRef.current.playVideo();
      }
    };

    const stop = async (): Promise<void> => {
      if (timerRef.current) clearTimeout(timerRef.current);
      playerRef.current?.pauseVideo();
      setPlaying(false);
    };

    const toggle = async (): Promise<void> => {
      return playing ? stop() : play();
    };

    // initialize player without autoplay
    const init = async (): Promise<void> => {
      if (!videoId) return;
      if (!playerRef.current || loadedVideoIdRef.current !== videoId) {
        if (playerRef.current) destroyPlayer();
        await createPlayer(videoId, false);
      }
    };

    // When videoId prop changes, destroy the old player
    useEffect(() => {
      // If videoId changed and we have a player loaded with a different video, destroy it
      if (playerRef.current && loadedVideoIdRef.current !== videoId) {
        destroyPlayer();
      }
    }, [videoId]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        destroyPlayer();
      };
    }, []);

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
          disabled={buttonDisabled || loading || !videoId}
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
