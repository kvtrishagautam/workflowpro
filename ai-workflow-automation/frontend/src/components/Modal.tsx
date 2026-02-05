
import React, { useEffect, useRef } from 'react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
    onClose: () => void;
    type?: 'info' | 'success' | 'error' | 'warning';
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, content, onClose, type = 'info' }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-container ${type}`}
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-header">
                    <h3 className="modal-title">
                        <span className="modal-icon">{getIcon()}</span>
                        {title}
                    </h3>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-content">
                    {content}
                </div>
                <div className="modal-footer">
                    <button className="modal-btn-primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
