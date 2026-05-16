import React from "react";

function releaseObjectUrl(url) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function VideoUpload({ currentUrl, onVideoState, onStatus, fileName }) {
  function load(file) {
    if (!file) return;
    releaseObjectUrl(currentUrl);
    const url = URL.createObjectURL(file);
    onVideoState({ url, fileName: file.name, source: "uploaded" });
    onStatus("Backup upload loaded. Run diagnostics before relying on this video for analysis.");
  }

  return (
    <article className="card media-card">
      <div className="card-header">
        <div>
          <h2>Video upload</h2>
          <p>Backup path only. If diagnostics fail, record directly in the app.</p>
        </div>
      </div>
      <label className="upload-drop compact-drop">
        <strong>{fileName || "Upload existing video"}</strong>
        <span>Prefer H.264/AVC MP4 for browser testing.</span>
        <input type="file" accept="video/*" onChange={(event) => load(event.target.files?.[0])} />
      </label>
    </article>
  );
}
