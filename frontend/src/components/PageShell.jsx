import React from "react";

export default function PageShell({
  title,
  subtitle,
  icon: Icon,
  accentColor = "#7c3aed",
  actions,
  children
}) {
  return (
    <div className="page-shell">
      {/* Page Header */}
      <header className="page-header">
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          width: "100%"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {Icon && (
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                flexShrink: 0,
                background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}08)`,
                border: `1px solid ${accentColor}55`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 24px ${accentColor}35`
              }}>
                <Icon size={20} style={{ color: accentColor }} />
              </div>
            )}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 20,
                  color: "#f8fafc",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2
                }}>
                  {title}
                </h1>
                <span className="badge" style={{
                  background: `${accentColor}15`,
                  color: accentColor,
                  border: `1px solid ${accentColor}40`,
                  fontSize: 9
                }}>
                  ENCLAVE PROTECTED
                </span>
              </div>
              {subtitle && (
                <p style={{
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "#94a3b8",
                  marginTop: 4,
                  lineHeight: 1.5
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {actions}
            </div>
          )}
        </div>
      </header>

      {/* Page Main Content Body */}
      <main className="page-body">
        {children}
      </main>
    </div>
  );
}
