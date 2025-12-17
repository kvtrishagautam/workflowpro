import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import './Login.css';
import GoogleIcon from '../assets/google.svg';

const Login: React.FC = () => {
    const history = useHistory();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: wire real auth
        console.log('sign in', { email, password });
        history.push('/editor');
    };

    return (
        <div className="login-page">
            <div className="login-top">
                <div className="logo-wrap">
                    <svg className="logo-mark" width="48" height="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <g>
                            <path d="M19 32a13 13 0 1 1 26 0 13 13 0 1 1-26 0z" fill="#60A5FA" opacity="0.95" />
                            <g transform="translate(6,6)">
                                <circle cx="8" cy="40" r="6" fill="#FDBA74" />
                                <circle cx="48" cy="8" r="6" fill="#FCA5A5" />
                            </g>
                        </g>
                    </svg>
                    <div className="logo-text">
                        <div className="brand">WorkflowPro</div>
                        <div className="subtitle">Visual Automation Platform</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h1 className="card-title">Welcome Back!</h1>
                <p className="card-sub">Enter your email below to sign in to your account</p>

                <button className="google-btn">
                    <img src={GoogleIcon} alt="Google" className="google-icon" />
                    <span>Sign in with Google</span>
                </button>

                <div className="separator"><span>OR</span></div>

                <form className="form" onSubmit={handleSubmit}>
                    <label className="label">Email</label>
                    <input
                        name="email"
                        autoComplete="username"
                        className="input"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <div className="password-row">
                        <div style={{ flex: 1 }}>
                            <label className="label">Password</label>
                            <input
                                name="password"
                                autoComplete="current-password"
                                className="input"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="forgot-wrap">
                            <Link to="/forgot" className="forgot-link">Forgot your password?</Link>
                        </div>
                    </div>

                    <button type="submit" className="primary-btn">Sign in</button>
                </form>

                <div className="card-footer">
                    Don't have an account? <Link to="/signin" className="signup-link">Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
