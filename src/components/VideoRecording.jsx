import React, { useRef, useState } from "react";

function releaseObjectUrl(url) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function VideoRecording({ currentUrl, onVideoState, onStatus }) {
  const previewRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [recording, setRecording] = useState(false);

  async function startCamera() {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        await previewRef.current.play();
      }
      setCameraActive(true);
      onStatus("Camera ready. Record inside the app for the most reliable field workflow.");
    } catch {
      onStatus("Camera access failed or was blocked. Use a real hosted preview over HTTPS and allow camera permission.");
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) {
      onStatus("Start the camera before recording.");
      return;
    }

    chunksRef.current = [];
    const mimeCandidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    const mimeType = mimeCandidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      releaseObjectUrl(currentUrl);
      const url = URL.createObjectURL(blob);
      const extension = type.includes("mp4") ? "mp4" : "webm";
      onVideoState({ url, fileName: `in-app-recording.${extension}`, source: "recorded" });
      onStatus("In-app recording captured. Play it, then run diagnostics/analyze.");
    };

    recorder.start();
    setRecording(true);
    onStatus("Recording in app...");
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    setRecording(false);
  }

  function stopCamera() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
    setRecording(false);
  }

  return (
    <article className="card media-card">
      <div className="card-header">
        <div>
          <h2>Video recording</h2>
          <p>Primary field path. This avoids phone-gallery codec problems by recording inside the app.</p>
        </div>
      </div>
      {cameraActive ? <video ref={previewRef} className="camera-preview" muted playsInline /> : null}
      <div className="button-row light-row">
        <button onClick={startCamera}>Start camera</button>
        {cameraActive ? (
          recording ? <button onClick={stopRecording}>Stop recording</button> : <button onClick={startRecording}>Record</button>
        ) : null}
        {cameraActive ? <button onClick={stopCamera}>Stop camera</button> : null}
      </div>
    </article>
  );
}
