import React from "react";

export function AssessmentSetup({ setup, onChange }) {
  function updateField(field, value) {
    onChange({ ...setup, [field]: value });
  }

  return (
    <article className="card">
      <h2>Assessment setup</h2>
      <p>Basic task context only. Technical ergonomic details come after video review.</p>
      <div className="form-grid">
        <label>
          Assessment title
          <input value={setup.title} onChange={(event) => updateField("title", event.target.value)} />
        </label>
        <label>
          Department / area
          <input value={setup.area} onChange={(event) => updateField("area", event.target.value)} />
        </label>
        <label>
          Observer
          <input value={setup.observer} onChange={(event) => updateField("observer", event.target.value)} />
        </label>
      </div>
    </article>
  );
}
