import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import './Login.css';
import GoogleIcon from '../assets/google.svg';
import { authAPI } from '../services/api';

const Login: React.FC = () => {
    const history = useHistory();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(email, password);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            history.push('/profile');
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
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
                    {error && <div style={{ color: '#ef4444', marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}

                    <label className="label">Email</label>
                    <input
                        name="email"
                        autoComplete="username"
                        className="input"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
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
                                required
                            />
                        </div>
                        <div className="forgot-wrap">
                            <Link to="/forgot" className="forgot-link">Forgot your password?</Link>
                        </div>
                    </div>

                    <button type="submit" className="primary-btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="card-footer">
                    Don't have an account? <Link to="/signin" className="signup-link">Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
