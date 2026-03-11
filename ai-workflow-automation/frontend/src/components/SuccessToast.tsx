import React, { useEffect, useState } from 'react';
import './SuccessToast.css';

interface SuccessToastProps {
    message: string;
    visible: boolean;
    onClose: () => void;
    duration?: number;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ message, visible, onClose, duration = 2500 }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (visible) {
            // Trigger enter animation
            requestAnimationFrame(() => setShow(true));
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 300); // Wait for exit animation
            }, duration);
            return () => clearTimeout(timer);
        } else {
            setShow(false);
        }
    }, [visible, duration, onClose]);

    if (!visible) return null;

    return (
        <div className={`success-toast ${show ? 'show' : ''}`}>
            <div className="toast-icon">✓</div>
            <span className="toast-message">{message}</span>
        </div>
    );
};

export default SuccessToast;
