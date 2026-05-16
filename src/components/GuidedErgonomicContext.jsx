import React from "react";

export function GuidedErgonomicContext({ questions, context, onChange }) {
  function updateQuestion(id, value) {
    onChange({ ...context, [id]: value });
  }

  return (
    <article className="card">
      <h2>Guided ergonomic context</h2>
      <p>Plain-language questions. Unknown observations are allowed and kept in the report.</p>
      {questions.map((question) => (
        <label className="question" key={question.id}>
          {question.title}
          <span>{question.prompt}</span>
          <select value={context[question.id]} onChange={(event) => updateQuestion(question.id, event.target.value)}>
            <option value="">Select one</option>
            {question.options.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      ))}
    </article>
  );
}
