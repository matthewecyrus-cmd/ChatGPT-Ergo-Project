import React, { useRef, useState } from "react";

function probeDecodedFrame(video) {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return { readable: false, frame: "no decoded frame available" };
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { readable: false, frame: "frame probe failed" };

    ctx.drawImage(video, 0, 0, 80, 80);
    const data = ctx.getImageData(0, 0, 80, 80).data;
    let sum = 0;

    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }

    const brightness = sum / (data.length / 4);
    const readable = brightness > 3;
    return {
      readable,
      frame: readable ? `readable frame detected, brightness ${Math.round(brightness)}` : `black/static frame, brightness ${Math.round(brightness)}`
    };
  } catch {
    return { readable: false, frame: "frame probe failed" };
  }
}

export function VideoDiagnostics({ videoState, diagnostic, onAnalysisResult, onStatus }) {
  const videoRef = useRef(null);
  const [localDiagnostic, setLocalDiagnostic] = useState(diagnostic);

  function updateDiagnostic(eventName) {
    const video = videoRef.current;
    if (!video) return;
    setLocalDiagnostic((current) => ({
      ...current,
      event: eventName,
      readyState: video.readyState,
      size: `${video.videoWidth || 0} x ${video.videoHeight || 0}`
    }));
  }

  async function playVideo() {
    const video = videoRef.current;
    if (!video || !videoState.url) return false;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    try {
      await video.play();
      onStatus("Video playing. Run diagnostics after the frame appears.");
      return true;
    } catch {
      onStatus("Playback was blocked. Tap the native video frame directly, then run diagnostics again.");
      return false;
    }
  }

  async function analyze() {
    if (!videoState.url) return;
    await playVideo();

    window.setTimeout(() => {
      const video = videoRef.current;
      const frameResult = probeDecodedFrame(video);
      const nextDiagnostic = {
        event: "analyze",
        readyState: video?.readyState || 0,
        size: `${video?.videoWidth || 0} x ${video?.videoHeight || 0}`,
        frame: frameResult.frame,
        readable: frameResult.readable
      };
      setLocalDiagnostic(nextDiagnostic);
      onAnalysisResult({ readable: frameResult.readable, diagnostic: nextDiagnostic });
    }, 250);
  }

  return (
    <article className="card media-card">
      <div className="card-header">
        <div>
          <h2>Video diagnostics</h2>
          <p>Confirms whether the browser can decode visible frames before analysis continues.</p>
        </div>
      </div>
      <div className="video-box">
        {videoState.url ? (
          <video
            ref={videoRef}
            src={videoState.url}
            className="task-video"
            controls
            muted
            playsInline
            onLoadedMetadata={() => updateDiagnostic("loadedmetadata")}
            onLoadedData={() => updateDiagnostic("loadeddata")}
            onCanPlay={() => updateDiagnostic("canplay")}
          />
        ) : (
          <div className="upload-drop compact-drop"><strong>No video selected yet</strong><span>Record in app or upload a backup video.</span></div>
        )}
      </div>
      <div className="button-row">
        <button onClick={playVideo} disabled={!videoState.url}>Play</button>
        <button className="primary" onClick={analyze} disabled={!videoState.url}>Analyze frame availability</button>
      </div>
      <div className="diagnostic-grid padded-diagnostic">
        <div><strong>Last event</strong><span>{localDiagnostic.event}</span></div>
        <div><strong>Ready state</strong><span>{localDiagnostic.readyState}</span></div>
        <div><strong>Video size</strong><span>{localDiagnostic.size}</span></div>
        <div><strong>Frame probe</strong><span>{localDiagnostic.frame}</span></div>
      </div>
    </article>
  );
}
