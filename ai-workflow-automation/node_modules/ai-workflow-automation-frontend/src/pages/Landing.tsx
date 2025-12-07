import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const GearLogo: React.FC = () => (
    <div className="brand-wrap">
        <svg width="40" height="40" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <g>
                <circle cx="18" cy="32" r="10" fill="#60A5FA" />
                <circle cx="34" cy="16" r="8" fill="#FDBA74" />
                <circle cx="50" cy="36" r="8" fill="#FBBF24" />
            </g>
        </svg>
        <div className="brand-text">
            <div className="brand-title">WorkflowPro</div>
            <div className="brand-sub">Visual Automation Platform</div>
        </div>
    </div>
);

const Node: React.FC<{ color: string; label: string; icon?: React.ReactNode }> = ({ color, label, icon }) => (
    <div className="node" style={{ borderColor: color }}>
        <div className="node-icon" style={{ background: color }}>{icon}</div>
        <div className="node-label">{label}</div>
    </div>
);

const Landing: React.FC = () => {
    return (
        <div className="landing-page">
            <header className="site-header">
                <div className="header-left">
                    <GearLogo />
                </div>
                <nav className="header-right">
                    <a href="#features">Features</a>
                    <a href="#integrations">Integrations</a>
                    <a href="#docs">Docs</a>
                    <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
                    <Link to="/login" className="btn btn-primary-small">Sign up</Link>
                </nav>
            </header>

            <section className="hero">
                <div className="hero-inner">
                    <h1 className="hero-title">Automate Your Work Without Writing Code</h1>
                    <p className="hero-sub">The open-source visual automation platform. Connect APIs, schedule tasks, and monitor workflows in real-time with our intuitive drag-and-drop builder.</p>

                    <div className="hero-ctas">
                        <Link to="/login" className="cta primary">Start Automating</Link>
                        <a href="#docs" className="cta outline">Read the Docs</a>
                    </div>

                    <div className="workflow-preview">
                        <div className="preview-card">
                            <div className="nodes-row">
                                <Node color="#60A5FA" label="Webhook" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 8v11a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>} />
                                <div className="arrow">→</div>
                                <Node color="#FB923C" label="JavaScript" icon={<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16v16H4z" fill="#fff" /><text x="12" y="16" fontSize="10" textAnchor="middle" fill="#111">JS</text></svg>} />
                                <div className="arrow">→</div>
                                <Node color="#7C3AED" label="Slack" icon={<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="#fff" /><text x="12" y="16" fontSize="10" textAnchor="middle" fill="#111">S</text></svg>} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="features">
                <div className="features-inner">
                    <h2 className="features-title">Powerful Features for Modern Teams</h2>
                    <p className="features-sub">Everything you need to automate workflows and boost productivity</p>

                    <div className="feature-cards">
                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: '#7c3aed' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18M3 12h18M3 17h18" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <div className="feature-body">
                                <div className="feature-title">Visual Drag-and-Drop</div>
                                <div className="feature-desc">Design complex logic flows visually. No coding required. Build powerful automations with an intuitive interface.</div>
                            </div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: '#60a5fa' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 3v4M8 21v-4M21 8h-4M3 16h4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <div className="feature-body">
                                <div className="feature-title">Seamless Integrations</div>
                                <div className="feature-desc">Connect HTTP requests, Databases, Email, and Slack instantly. Integrate with hundreds of services effortlessly.</div>
                            </div>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon" style={{ background: '#10b981' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <div className="feature-body">
                                <div className="feature-title">Real-time Monitoring</div>
                                <div className="feature-desc">Track execution history and debug errors with live logs. Stay informed with detailed analytics and insights.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="how-it-works" className="how-it-works">
                <div className="how-inner">
                    <h2 className="how-title">How It Works</h2>
                    <p className="how-sub">Get started in three simple steps</p>

                    <div className="steps-container">
                        <div className="step-card">
                            <div className="step-badge">1</div>
                            <div className="step-body">
                                <div className="step-heading">Choose a Trigger</div>
                                <div className="step-pills">
                                    <span className="pill">Schedule</span>
                                    <span className="pill">Webhook</span>
                                </div>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-badge">2</div>
                            <div className="step-body">
                                <div className="step-heading">Add Actions</div>
                                <div className="step-actions">
                                    <div className="action-block" style={{ background: '#60A5FA' }}></div>
                                    <div className="action-block" style={{ background: '#FB923C' }}></div>
                                    <div className="action-block" style={{ background: '#7C3AED' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-badge">3</div>
                            <div className="step-body">
                                <div className="step-heading">Deploy & Relax</div>
                                <div className="step-status">
                                    <span className="status-badge active">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <div className="cta-inner">
                    <h2 className="cta-title">Ready to Automate Your Workflows?</h2>
                    <p className="cta-sub">Join thousands of teams using WorkflowPro to save time and boost productivity</p>
                    <Link to="/login" className="cta-btn">Get Started for Free</Link>
                </div>
            </section>

            <footer className="site-footer">
                <div className="footer-content">
                    <div className="footer-links">
                        <a href="#privacy">Privacy Policy</a>
                        <span className="divider">•</span>
                        <a href="#terms">Terms</a>
                        <span className="divider">•</span>
                        <a href="#contact">Contact</a>
                    </div>
                    <div className="footer-copyright">© 2025 WorkflowPro. Open-source automation platform.</div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
