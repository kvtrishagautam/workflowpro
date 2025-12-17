import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import './Signin.css';
import GoogleIcon from '../assets/google.svg';

const Signin: React.FC = () => {
    const history = useHistory();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: wire real auth
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        console.log('sign up', { firstName, lastName, email, password });
        history.push('/editor');
    };

    return (
        <div className="signin-page">
            <div className="signin-top">
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
                <h1 className="card-title">Create Account</h1>
                <p className="card-sub">Join us and start automating your workflows today</p>

                <button className="google-btn">
                    <img src={GoogleIcon} alt="Google" className="google-icon" />
                    <span>Sign up with Google</span>
                </button>

                <div className="separator"><span>OR</span></div>

                <form className="form" onSubmit={handleSubmit}>
                    <div className="name-row">
                        <div style={{ flex: 1 }}>
                            <label className="label">First Name</label>
                            <input
                                name="firstName"
                                className="input"
                                type="text"
                                placeholder="John"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="label">Last Name</label>
                            <input
                                name="lastName"
                                className="input"
                                type="text"
                                placeholder="Doe"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                    </div>

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

                    <label className="label">Password</label>
                    <input
                        name="password"
                        autoComplete="new-password"
                        className="input"
                        type="password"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <label className="label">Confirm Password</label>
                    <input
                        name="confirmPassword"
                        autoComplete="new-password"
                        className="input"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <button type="submit" className="primary-btn">Create Account</button>
                </form>

                <div className="card-footer">
                    Already have an account? <Link to="/login" className="signin-link">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default Signin;
