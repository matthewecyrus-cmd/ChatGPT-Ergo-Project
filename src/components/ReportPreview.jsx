import React from "react";

export function ReportPreview({ report, status }) {
  return (
    <article className="card report">
      <h2>Report preview</h2>
      <div className="status-box compact-status">{status}</div>
      <pre>{report}</pre>
    </article>
  );
}
