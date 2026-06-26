// ColorTester.jsx
import React from "react";

const Block = ({ label, varName }) => (
  <div className="color-block">
    <div className="color-swatch" style={{ background: `var(${varName})` }} />
    <div className="color-meta">
      <div className="color-label">{label}</div>
      <div className="color-value">var({varName})</div>
    </div>
  </div>
);

const Group = ({ title, children }) => (
  <section className="group">
    <h2>{title}</h2>
    <div className="grid">{children}</div>
  </section>
);

export default function ColorTester() {
  return (
    <div className="tester-wrap">
      <header className="tester-head">
        <h1>CSS Variable Color Tester</h1>
        <p>Switch theme (if you have a toggle) and see how these update.</p>
      </header>

      <Group title="Text">
        <Block label="--text-large" varName="--text-large" />
        <Block label="--text-small" varName="--text-small" />
        <Block label="--muted" varName="--muted" />
      </Group>

      <Group title="Surfaces / Borders">
        <Block label="--bg" varName="--bg" />
        <Block label="--panel" varName="--panel" />
        <Block label="--panel-2" varName="--panel-2" />
        <Block label="--border" varName="--border" />
      </Group>

      <Group title="Brand / Feedback">
        <Block label="--primary" varName="--primary" />
        <Block label="--primary-2" varName="--primary-2" />
        <Block label="--ring" varName="--ring" />
        <Block label="--danger" varName="--danger" />
        <Block label="--success" varName="--success" />
        <Block label="--shadow" varName="--shadow" />
      </Group>

      <section className="demo">
        <h2>Mini UI Demo</h2>
        <div className="demo-row">
          <button className="demo-btn">Primary Button</button>
          <button className="demo-btn demo-btn-danger">Danger</button>
        </div>
        <div className="demo-row">
          <input className="demo-input" placeholder="Input (check focus ring)" />
        </div>
        <div className="demo-cards">
          <div className="demo-card">Card uses --panel</div>
          <div className="demo-card demo-card-2">Card uses --panel-2</div>
        </div>
        <p className="demo-muted">Muted text uses --muted</p>
      </section>
    </div>
  );
}
