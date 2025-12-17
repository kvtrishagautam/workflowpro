import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const GearLogo: React.FC = () => (
    <div className="brand-wrap">
        <svg width="36" height="36" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <defs>
                <linearGradient id="wGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
            </defs>
            {/* W Letter Design */}
            <g fill="url(#wGradient)">
                {/* Left peak */}
                <path d="M 6 8 L 12 38 L 14 28 L 18 38 L 20 8 Z" />
                {/* Middle valley */}
                <path d="M 20 8 L 22 38 L 24 20 L 26 38 L 28 8 Z" />
                {/* Right peak */}
                <path d="M 28 8 L 30 38 L 34 28 L 36 38 L 42 8 Z" />
            </g>
            {/* Decorative accent */}
            <circle cx="24" cy="42" r="3" fill="#a855f7" opacity="0.6" />
        </svg>
        <div className="brand-text">
            <div className="brand-title">WorkflowPro</div>
            <div className="brand-sub">Visual Automation</div>
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
            {/* Abstract Background Elements */}
            <div className="bg-container">
                <svg className="bg-svg bg-1" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.25" />
                        </linearGradient>
                    </defs>
                    <circle cx="200" cy="200" r="150" fill="url(#grad1)" />
                    <path d="M 100 100 Q 200 50, 300 100 T 300 300" stroke="#a855f7" strokeWidth="2" fill="none" opacity="0.5" />
                </svg>
                <svg className="bg-svg bg-2" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#f97316" stopOpacity="0.22" />
                        </linearGradient>
                    </defs>
                    <rect x="50" y="50" width="300" height="300" fill="url(#grad2)" rx="60" />
                </svg>
                <svg className="bg-svg bg-3" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.22" />
                        </linearGradient>
                    </defs>
                    <circle cx="100" cy="300" r="100" fill="url(#grad3)" />
                    <polygon points="350,50 400,150 350,200 300,150" fill="#3b82f6" opacity="0.28" />
                </svg>
            </div>

            <header className="site-header">
                <div className="header-left">
                    <GearLogo />
                </div>
                <nav className="header-right">
                    <a href="#features">Features</a>
                    <a href="#integrations">Integrations</a>
                    <a href="#docs">Docs</a>
                    <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
                    <Link to="/signin" className="btn btn-primary-small">Sign up</Link>
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
                                <div className="step-description">Start with a schedule or webhook to initiate your workflow automatically.</div>
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
                                <div className="step-description">Drag and drop actions to build your automation flow with visual nodes.</div>
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
                                <div className="step-description">Activate your workflow and let it run automatically. Monitor results in real-time.</div>
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
