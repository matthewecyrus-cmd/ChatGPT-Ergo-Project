import React from "react";
import { BODY_REGIONS } from "../data.js";

export function RiskSummary({ risk, selectedFlags }) {
  return (
    <article className="card">
      <h2>Risk summary</h2>
      <div className={`risk risk-${risk.toLowerCase()}`}>{risk}</div>
      {BODY_REGIONS.map((region) => {
        const flagged = selectedFlags.some((flag) => flag.id === region.id);
        return (
          <div className="region" key={region.id}>
            <strong>{region.label}{flagged ? " · Flagged" : ""}</strong>
            <span>{region.cue}</span>
          </div>
        );
      })}
    </article>
  );
}
