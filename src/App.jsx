import React, { useMemo, useState } from "react";
import { AssessmentSetup } from "./components/AssessmentSetup.jsx";
import { VideoRecording } from "./components/VideoRecording.jsx";
import { VideoUpload } from "./components/VideoUpload.jsx";
import { VideoDiagnostics } from "./components/VideoDiagnostics.jsx";
import { FindingsReview } from "./components/FindingsReview.jsx";
import { GuidedErgonomicContext } from "./components/GuidedErgonomicContext.jsx";
import { RiskSummary } from "./components/RiskSummary.jsx";
import { ReportPreview } from "./components/ReportPreview.jsx";
import { FLAGS, QUESTIONS, initialContext, riskFromContext, buildReport } from "./data.js";

export function App() {
  const [setup, setSetup] = useState({
    title: "Task observation assessment",
    area: "Production area",
    observer: "Matthew Cyrus"
  });
  const [videoState, setVideoState] = useState({ url: "", fileName: "", source: "none" });
  const [diagnostic, setDiagnostic] = useState({ event: "none", readyState: 0, size: "0 x 0", frame: "not checked", readable: false });
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [context, setContext] = useState(initialContext);
  const [status, setStatus] = useState("Start assessment: record in-app first. Upload is backup only.");

  const risk = useMemo(() => riskFromContext(selectedFlags, context), [selectedFlags, context]);
  const report = useMemo(() => buildReport({ setup, videoState, risk, selectedFlags, context }), [setup, videoState, risk, selectedFlags, context]);

  function handleAnalysisResult(result) {
    setDiagnostic(result.diagnostic);

    if (!result.readable) {
      setStatus("This video could not produce readable frames in-browser. Recommended next step: use in-app recording and retry analysis.");
      return;
    }

    setStatus("Video frames are readable. Continue with findings review and guided context.");
    setSelectedFlags((current) => current.length ? current : FLAGS.slice(0, 2));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">E</div>
          <div><strong>ChatGPT Ergo</strong><span>Assessment Builder</span></div>
        </div>
        <nav><a>Dashboard</a><a className="active">Assessments</a><a>Reports</a><a>Settings</a></nav>
      </aside>

      <section className="workspace">
        <header className="page-header">
          <div>
            <p className="eyebrow">Field-testable prototype</p>
            <h1>Ergonomic Assessment Workspace</h1>
            <p>Workflow: start assessment, record video in app, analyze frame availability, mark findings, answer guided context questions, and generate a supervisor-ready report.</p>
          </div>
          <button className="primary" onClick={() => navigator.clipboard?.writeText(report)}>Copy Report</button>
        </header>

        <section className="steps"><span>1 Setup</span><span>2 Record / Upload</span><span>3 Diagnostics</span><span>4 Findings</span><span>5 Report</span></section>

        <div className="grid">
          <section className="left-column">
            <AssessmentSetup setup={setup} onChange={setSetup} />
            <VideoRecording currentUrl={videoState.url} onVideoState={setVideoState} onStatus={setStatus} />
            <VideoUpload currentUrl={videoState.url} fileName={videoState.fileName} onVideoState={setVideoState} onStatus={setStatus} />
            <VideoDiagnostics videoState={videoState} diagnostic={diagnostic} onAnalysisResult={handleAnalysisResult} onStatus={setStatus} />
            <FindingsReview flags={FLAGS} selectedFlags={selectedFlags} onChange={setSelectedFlags} />
          </section>

          <section className="right-column">
            <RiskSummary risk={risk} selectedFlags={selectedFlags} />
            <GuidedErgonomicContext questions={QUESTIONS} context={context} onChange={setContext} />
            <ReportPreview report={report} status={status} />
          </section>
        </div>
      </section>
    </main>
  );
}
