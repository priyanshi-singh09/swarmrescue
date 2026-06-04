import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class ErrorScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="app-shell">
        <section className="topbar">
          <div>
            <p className="eyebrow">SwarmRescue Phase 1</p>
            <h1>Dashboard Error</h1>
          </div>
        </section>
        <section className="alert-strip">
          <strong>App failed to load</strong>
          <span>{this.state.error.message}</span>
        </section>
      </main>
    );
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorScreen>
      <App />
    </ErrorScreen>
  </React.StrictMode>
);
