import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Inbox, Users, Shield, Zap, MessageSquare, ChevronRight, Orbit, Rocket, Sparkles } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="gx-landing">
      {/* Background Effects */}
      <div className="gx-stars"></div>
      <div className="gx-nebula gx-nebula-1"></div>
      <div className="gx-nebula gx-nebula-2"></div>

      {/* Navigation */}
      <nav className="gx-nav">
        <div className="gx-nav-brand">
          <div className="gx-logo-orb">
            <div className="gx-logo-core"></div>
          </div>
          <span>GRAXION</span>
        </div>
        <div className="gx-nav-links">
          <a href="#features">Features</a>
          <a href="#technology">Technology</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="gx-nav-actions">
          {user ? (
            <Link to="/inbox" className="gx-btn-primary">
              Launch Workspace <Rocket size={16} />
            </Link>
          ) : (
            <button className="gx-btn-primary" onClick={() => {
              const currentUrl = encodeURIComponent(window.location.origin);
              window.location.href = `${import.meta.env.VITE_AUTH_URL}/login?redirect_to=${currentUrl}&product=mail`;
            }}>
              Enter Graxion <ArrowRight size={16} />
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="gx-hero">
        <div className="gx-hero-pill">
          <Sparkles size={14} color="#e879f9" />
          <span>Defy email gravity. Graxion 2.0 is live.</span>
        </div>
        <h1 className="gx-hero-title">
          The center of your <br/> team's universe.
        </h1>
        <p className="gx-hero-subtitle">
          Graxion Mail transforms chaotic email threads into synchronized, collaborative workspaces. Zero friction, infinite velocity.
        </p>
        <div className="gx-hero-cta">
          <button className="gx-btn-glow" onClick={() => {
            const currentUrl = encodeURIComponent(window.location.origin);
            window.location.href = `${import.meta.env.VITE_AUTH_URL}/login?redirect_to=${currentUrl}&product=mail`;
          }}>
            Start Exploring
          </button>
          <button className="gx-btn-outline">
            View Mission Control
          </button>
        </div>

        {/* Floating App Interface */}
        <div className="gx-floating-app">
          <div className="gx-app-window">
            <div className="gx-app-topbar">
              <div className="gx-app-controls"><span></span><span></span><span></span></div>
              <div className="gx-app-title">graxion.app / command-center</div>
            </div>
            <div className="gx-app-content">
              {/* Sidebar */}
              <div className="gx-app-sidebar">
                <div className="gx-app-nav active"><Orbit size={16} /> All Systems</div>
                <div className="gx-app-nav"><Inbox size={16} /> Support Team</div>
                <div className="gx-app-nav"><Zap size={16} /> Action Required</div>
              </div>
              
              {/* Thread List */}
              <div className="gx-app-threads">
                <div className="gx-thread-card active">
                  <div className="gx-thread-sender">Mission Control <span>2m ago</span></div>
                  <div className="gx-thread-subj">Deployment Successful</div>
                  <div className="gx-thread-prev">All systems are online and operational...</div>
                </div>
                <div className="gx-thread-card">
                  <div className="gx-thread-sender">Commander Jenkins <span>1h ago</span></div>
                  <div className="gx-thread-subj">Protocol Update Request</div>
                  <div className="gx-thread-prev">Please review the updated security protocols...</div>
                </div>
              </div>

              {/* Thread View Mockup */}
              <div className="gx-app-view">
                <div className="gx-view-header">
                  <span className="gx-status-tag">Synchronized</span>
                  <div className="gx-avatars">
                    <div className="gx-avatar" style={{zIndex: 3}}>A</div>
                    <div className="gx-avatar" style={{zIndex: 2}}>S</div>
                    <div className="gx-avatar" style={{zIndex: 1}}>+2</div>
                  </div>
                </div>
                
                <div className="gx-message-mock">
                  <div className="gx-msg-avatar">M</div>
                  <div className="gx-msg-content">
                    <div className="gx-msg-meta">Mission Control &lt;control@graxion.in&gt;</div>
                    <div className="gx-msg-body">
                      The recent payload has been delivered successfully. 
                      Awaiting team review before initiating the next sequence.
                    </div>
                  </div>
                </div>
                
                <div className="gx-internal-note-mock">
                  <div className="gx-note-meta">Agent Alex left a secure note:</div>
                  <div className="gx-note-body">I've verified the payload parameters. We are go for launch.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Unique Features Layout */}
      <section className="gx-features" id="features">
        <div className="gx-section-header">
          <h2>Zero Gravity Workflows</h2>
          <p>Engineered for high-velocity teams that can't afford miscommunication.</p>
        </div>

        <div className="gx-feature-stack">
          {/* Feature 1 */}
          <div className="gx-feature-row">
            <div className="gx-feature-text">
              <div className="gx-icon-wrapper"><Users size={24} /></div>
              <h3>Synchronized Presence</h3>
              <p>Graxion detects exactly who is viewing, typing, or acting on a thread in real-time. Say goodbye to collision anxiety and duplicate responses forever.</p>
            </div>
            <div className="gx-feature-visual gx-vis-1">
              <div className="gx-pulse-ring">
                <div className="gx-pulse-core">Agent Alex is replying...</div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="gx-feature-row reverse">
            <div className="gx-feature-text">
              <div className="gx-icon-wrapper"><MessageSquare size={24} /></div>
              <h3>Subspace Transmissions</h3>
              <p>Leave private, internal notes directly on the email thread. Discuss context with your team without leaving the inbox, invisible to the external world.</p>
            </div>
            <div className="gx-feature-visual gx-vis-2">
              <div className="gx-note-floating">
                <p>"Hold off on replying. I'm checking the logs now."</p>
                <span>— Secure Internal Note</span>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="gx-feature-row">
            <div className="gx-feature-text">
              <div className="gx-icon-wrapper"><Shield size={24} /></div>
              <h3>Impenetrable Security</h3>
              <p>Enterprise-grade RBAC, custom routing rules, and comprehensive audit logs ensure your organization's communications remain secure and compliant.</p>
            </div>
            <div className="gx-feature-visual gx-vis-3">
              <div className="gx-shield-mock">
                <Shield size={64} color="rgba(232, 121, 249, 0.4)" />
                <div className="gx-scan-line"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="gx-features" id="technology" style={{paddingTop: '60px', paddingBottom: '60px', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
        <div className="gx-section-header">
          <h2>Next-Gen Technology</h2>
          <p>Built on the bleeding edge of WebSockets, React 19, and distributed edge infrastructure.</p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="gx-features" id="pricing" style={{paddingTop: '60px', paddingBottom: '60px', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
        <div className="gx-section-header">
          <h2>Transparent Pricing</h2>
          <p>Enterprise power at startup prices. Pay only for the agents and bandwidth you consume.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="gx-footer">
        <div className="gx-footer-content">
          <div className="gx-nav-brand">
            <div className="gx-logo-orb">
              <div className="gx-logo-core"></div>
            </div>
            <span>GRAXION</span>
          </div>
          <p className="gx-footer-tagline">Defy the laws of traditional email.</p>
          <div className="gx-footer-links">
            <a href="#">Security</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
          <p className="gx-copyright">© 2026 Graxion Systems.</p>
        </div>
      </footer>
    </div>
  );
}
