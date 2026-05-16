import React from "react";

export function FindingsReview({ flags, selectedFlags, onChange }) {
  function toggle(flag) {
    onChange(selectedFlags.some((item) => item.id === flag.id) ? selectedFlags.filter((item) => item.id !== flag.id) : [...selectedFlags, flag]);
  }

  return (
    <article className="card">
      <h2>Finding review</h2>
      <p>Mark what is visible. Findings stay editable after diagnostics.</p>
      <div className="flag-grid">
        {flags.map((flag) => {
          const active = selectedFlags.some((item) => item.id === flag.id);
          return (
            <button key={flag.id} className={active ? "flag active" : "flag"} onClick={() => toggle(flag)}>
              <strong>{flag.label}</strong>
              <span>{flag.detail}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
