import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const FLAGS = [
  {
    id: "neck",
    label: "Neck flexion / looking down",
    region: "Neck",
    risk: "moderate",
    detail: "Sustained looking down or forward-head posture may be present during the task.",
    recommendation: "Review part height, visual target position, lighting, and whether the work can be brought closer to neutral eye level."
  },
  {
    id: "shoulder",
    label: "Extended reach / shoulder loading",
    region: "Shoulder",
    risk: "moderate",
    detail: "The task may require reaching away from the body or holding the arms away from neutral.",
    recommendation: "Move high-use items into the normal reach zone, reduce reach distance, or review fixture/tool placement."
  },
  {
    id: "back",
    label: "Trunk bending or twisting",
    region: "Back",
    risk: "moderate",
    detail: "The task may involve bending, rotation, or an unsupported trunk posture.",
    recommendation: "Review work height, lift path, staging location, turn-step positioning, or mechanical assist options."
  },
  {
    id: "hand",
    label: "Grip force / hand strain potential",
    region: "Wrist / Hand",
    risk: "moderate",
    detail: "The task may involve gripping, pinching, trigger use, vibration, or force through the hand/wrist.",
    recommendation: "Review handle size, glove fit, tool condition, wrist angle, contact stress, and whether force can be reduced."
  },
  {
    id: "knee",
    label: "Lower-body awkward posture",
    region: "Knee",
    risk: "moderate",
    detail: "The task may involve kneeling, deep squatting, uneven stance, or repeated low access.",
    recommendation: "Review access height, platform/step use, kneeling alternatives, and whether the part can be staged differently."
  }
];

const QUESTIONS = [
  {
    id: "force",
    title: "Force or effort",
    prompt: "Did the task appear to require noticeable force, hard gripping, pulling, pushing, lifting, or tool pressure?",
    options: ["No obvious force", "Some force", "High force", "I don't know / not observed"]
  },
  {
    id: "repetition",
    title: "Repetition",
    prompt: "Did the person repeat the same motion or posture several times during the task?",
    options: ["Not repetitive", "Some repetition", "Highly repetitive", "I don't know / not observed"]
  },
  {
    id: "duration",
    title: "Duration",
    prompt: "How long does this task usually happen during a normal shift?",
    options: ["Less than 30 minutes total", "30 minutes to 2 hours", "More than 2 hours", "I don't know / not observed"]
  }
];

const initialContext = QUESTIONS.reduce((acc, question) => {
  acc[question.id] = "";
  return acc;
}, {});

function riskFromContext(flags, context) {
  let score = flags.length;
  if (context.force === "High force") score += 2;
  if (context.force === "Some force") score += 1;
  if (context.repetition === "Highly repetitive") score += 2;
  if (context.repetition === "Some repetition") score += 1;
  if (context.duration === "More than 2 hours") score += 2;
  if (context.duration === "30 minutes to 2 hours") score += 1;
  if (score >= 5) return "High";
  if (score >= 2) return "Moderate";
  return "Low";
}

function makeObjectUrl(blob) {
  return URL.createObjectURL(blob);
}

function releaseObjectUrl(url) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

function App() {
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [title, setTitle] = useState("Task observation assessment");
  const [area, setArea] = useState("Production area");
  const [observer, setObserver] = useState("Matthew Cyrus");
  const [videoUrl, setVideoUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("Ready. Record in the app or upload an existing video.");
  const [cameraActive, setCameraActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [context, setContext] = useState(initialContext);
  const [diagnostic, setDiagnostic] = useState({ event: "none", readyState: 0, size: "0 x 0", frame: "not checked" });

  const risk = useMemo(() => riskFromContext(selectedFlags, context), [selectedFlags, context]);

  const report = useMemo(() => {
    const findings = selectedFlags.length ? selectedFlags : [{ label: "No posture flags selected", risk: "review", detail: "No specific risk flags have been selected yet.", recommendation: "Review the video and mark any visible awkward posture, force, repetition, or reach concern." }];
    return [
      `Assessment: ${title}`,
      `Area: ${area}`,
      `Observer: ${observer}`,
      `Video: ${fileName || "No video selected"}`,
      `Overall Risk: ${risk}`,
      "",
      "Findings:",
      ...findings.map((flag, index) => `${index + 1}. ${flag.label} — ${flag.detail} Recommended next step: ${flag.recommendation}`),
      "",
      "Guided Context:",
      ...QUESTIONS.map((question) => `- ${question.title}: ${context[question.id] || "Not answered"}`),
      "",
      "Limitations: This is a screening-level assessment workflow. Findings should be confirmed by a qualified reviewer before formal corrective action."
    ].join("\n");
  }, [area, context, fileName, observer, risk, selectedFlags, title]);

  useEffect(() => {
    return () => {
      releaseObjectUrl(videoUrl);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, [videoUrl]);

  function updateVideoDiag(eventName) {
    const video = videoRef.current;
    if (!video) return;
    setDiagnostic((current) => ({
      ...current,
      event: eventName,
      readyState: video.readyState,
      size: `${video.videoWidth || 0} x ${video.videoHeight || 0}`
    }));
  }

  function probeFrame() {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      setDiagnostic((current) => ({ ...current, frame: "no decoded frame available" }));
      return false;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 80;
      canvas.height = 80;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, 80, 80);
      const data = ctx.getImageData(0, 0, 80, 80).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
      const brightness = sum / (data.length / 4);
      const ok = brightness > 3;
      setDiagnostic((current) => ({ ...current, frame: ok ? `readable frame, brightness ${Math.round(brightness)}` : `black/static frame, brightness ${Math.round(brightness)}` }));
      return ok;
    } catch {
      setDiagnostic((current) => ({ ...current, frame: "frame probe failed" }));
      return false;
    }
  }

  function loadUploadedVideo(file) {
    if (!file) return;
    releaseObjectUrl(videoUrl);
    const url = makeObjectUrl(file);
    setVideoUrl(url);
    setFileName(file.name);
    setStatus("Uploaded video loaded. Tap the video or Play. Then run Analyze.");
    setDiagnostic({ event: "object url set", readyState: 0, size: "0 x 0", frame: "waiting for decode" });
  }

  async function startCamera() {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false
      });
      streamRef.current = stream;
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        await cameraRef.current.play();
      }
      setCameraActive(true);
      setStatus("Camera ready. Record inside the app to avoid phone-gallery codec problems.");
    } catch {
      setStatus("Camera access failed or was blocked. Try opening this in a normal hosted browser preview, not an embedded sandbox.");
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
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
      const url = makeObjectUrl(blob);
      releaseObjectUrl(videoUrl);
      setVideoUrl(url);
      setFileName(type.includes("mp4") ? "in-app-recording.mp4" : "in-app-recording.webm");
      setStatus("In-app recording captured. Tap Play, then Analyze.");
      setDiagnostic({ event: "in-app recording created", readyState: 0, size: "0 x 0", frame: "waiting for decode" });
    };
    recorder.start();
    setRecording(true);
    setStatus("Recording in app...");
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    setRecording(false);
  }

  async function playVideo() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    try {
      await video.play();
      setStatus("Video playing. If the diagnostic box is black, the file/browser preview cannot decode visible frames.");
    } catch {
      setStatus("Playback was blocked. Tap directly inside the native video frame below as a direct browser test.");
    }
  }

  async function analyze() {
    await playVideo();
    window.setTimeout(() => {
      const ok = probeFrame();
      if (!ok) {
        setStatus("Analyze stopped: no readable decoded frame. In production this must be solved with in-app recording or automatic video normalization.");
        return;
      }
      setSelectedFlags((current) => current.length ? current : FLAGS.slice(0, 3));
      setStatus("Preview analysis complete. Findings were generated for review.");
    }, 250);
  }

  function toggleFlag(flag) {
    setSelectedFlags((current) => current.some((item) => item.id === flag.id) ? current.filter((item) => item.id !== flag.id) : [...current, flag]);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">E</div><div><strong>ChatGPT Ergo</strong><span>Assessment Builder</span></div></div>
        <nav><a>Dashboard</a><a className="active">Assessments</a><a>Reports</a><a>Settings</a></nav>
      </aside>

      <section className="workspace">
        <header className="page-header">
          <div><p className="eyebrow">Interactive build preview</p><h1>Ergonomic Assessment Workspace</h1><p>Record or upload a task video, review posture flags, answer guided context questions, and generate a supervisor-ready report.</p></div>
          <button className="primary" onClick={() => navigator.clipboard?.writeText(report)}>Copy Report</button>
        </header>

        <section className="steps"><span>1 Setup</span><span>2 Video</span><span>3 Findings</span><span>4 Guided Review</span><span>5 Report</span></section>

        <div className="grid">
          <section className="left-column">
            <article className="card">
              <h2>Assessment setup</h2>
              <div className="form-grid">
                <label>Assessment title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
                <label>Department / area<input value={area} onChange={(event) => setArea(event.target.value)} /></label>
                <label>Observer<input value={observer} onChange={(event) => setObserver(event.target.value)} /></label>
              </div>
            </article>

            <article className="card media-card">
              <div className="card-header"><div><h2>Video review</h2><p>Use in-app recording first. Upload is backup and must pass frame diagnostics.</p></div></div>
              {cameraActive ? <video ref={cameraRef} className="camera-preview" muted playsInline /> : null}
              <div className="video-box">
                {videoUrl ? (
                  <video ref={videoRef} src={videoUrl} className="task-video" muted playsInline controls onLoadedMetadata={() => updateVideoDiag("loadedmetadata")} onLoadedData={() => updateVideoDiag("loadeddata")} onCanPlay={() => updateVideoDiag("canplay")} />
                ) : (
                  <label className="upload-drop"><Upload size={36} /><strong>Upload existing video</strong><span>Prefer H.264 MP4 for browser testing.</span><input type="file" accept="video/*" onChange={(event) => loadUploadedVideo(event.target.files?.[0])} /></label>
                )}
              </div>
              <div className="button-row">
                <button onClick={startCamera}>Camera</button>
                {cameraActive ? recording ? <button onClick={stopRecording}>Stop Recording</button> : <button onClick={startRecording}>Record</button> : null}
                <label className="button-label">Replace<input type="file" accept="video/*" onChange={(event) => loadUploadedVideo(event.target.files?.[0])} /></label>
                <button onClick={playVideo} disabled={!videoUrl}><Play size={16} /> Play</button>
                <button className="primary" onClick={analyze} disabled={!videoUrl}><Gauge size={16} /> Analyze</button>
              </div>
              <div className="status-box">{status}</div>
            </article>

            <article className="card">
              <h2>Video render diagnostic</h2>
              <div className="diagnostic-grid">
                <div><strong>Last event</strong><span>{diagnostic.event}</span></div>
                <div><strong>Ready state</strong><span>{diagnostic.readyState}</span></div>
                <div><strong>Video size</strong><span>{diagnostic.size}</span></div>
                <div><strong>Frame probe</strong><span>{diagnostic.frame}</span></div>
              </div>
            </article>

            <article className="card">
              <h2>Finding review</h2>
              <div className="flag-grid">
                {FLAGS.map((flag) => {
                  const active = selectedFlags.some((item) => item.id === flag.id);
                  return <button key={flag.id} className={active ? "flag active" : "flag"} onClick={() => toggleFlag(flag)}><strong>{flag.label}</strong><span>{flag.detail}</span></button>;
                })}
              </div>
            </article>
          </section>

          <section className="right-column">
            <article className="card"><h2>Risk summary</h2><div className={`risk risk-${risk.toLowerCase()}`}>{risk}</div>{BODY_REGIONS.map((region) => <div className="region" key={region.id}><strong>{region.label}</strong><span>{region.cue}</span></div>)}</article>
            <article className="card"><h2>Guided context</h2>{QUESTIONS.map((question) => <label className="question" key={question.id}>{question.title}<span>{question.prompt}</span><select value={context[question.id]} onChange={(event) => setContext((current) => ({ ...current, [question.id]: event.target.value }))}><option value="">Select one</option>{question.options.map((option) => <option key={option}>{option}</option>)}</select></label>)}</article>
            <article className="card report"><h2>Report preview</h2><pre>{report}</pre></article>
          </section>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
