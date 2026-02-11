import React, { useState, useEffect } from 'react';
import { NodeProps, NODE_TYPES } from '../types';
import './NodeConfigPanel.css';

interface NodeConfigPanelProps {
    node: NodeProps;
    onConfigChange: (nodeId: string, config: Record<string, any>) => void;
    onClose: () => void;
}

// Node metadata for display
const nodeMetadata: Record<string, { icon: string; label: string; color: string }> = {
    [NODE_TYPES.WEBHOOK]: { icon: '🔗', label: 'Webhook', color: '#60A5FA' },
    [NODE_TYPES.SCHEDULE]: { icon: '⏰', label: 'Schedule Trigger', color: '#818CF8' },
    [NODE_TYPES.JAVASCRIPT]: { icon: '📝', label: 'Code', color: '#A78BFA' },
    [NODE_TYPES.CONDITIONAL]: { icon: '🔀', label: 'IF Condition', color: '#F87171' },
    [NODE_TYPES.SET]: { icon: '✏️', label: 'Set', color: '#FB923C' },
    [NODE_TYPES.FILTER]: { icon: '🔍', label: 'Filter', color: '#FACC15' },
    [NODE_TYPES.MERGE]: { icon: '🔗', label: 'Merge', color: '#4ADE80' },
    [NODE_TYPES.SPLIT_BATCHES]: { icon: '📦', label: 'Split in Batches', color: '#2DD4BF' },
    [NODE_TYPES.DELAY]: { icon: '⏱️', label: 'Delay', color: '#94A3B8' },
    [NODE_TYPES.HTTP]: { icon: '🌐', label: 'HTTP Request', color: '#FBBF24' },
    [NODE_TYPES.SLACK]: { icon: '💬', label: 'Slack', color: '#4A154B' },
    [NODE_TYPES.EMAIL]: { icon: '📧', label: 'Email', color: '#EA4335' },
    [NODE_TYPES.WHATSAPP]: { icon: '📱', label: 'WhatsApp', color: '#25D366' },
    [NODE_TYPES.TELEGRAM]: { icon: '✈️', label: 'Telegram', color: '#0088CC' },
    [NODE_TYPES.DISCORD]: { icon: '🎮', label: 'Discord', color: '#5865F2' },
    [NODE_TYPES.GOOGLE_SHEETS]: { icon: '📊', label: 'Google Sheets', color: '#34A853' },
    [NODE_TYPES.AIRTABLE]: { icon: '📋', label: 'Airtable', color: '#18BFFF' },
    [NODE_TYPES.NOTION]: { icon: '📓', label: 'Notion', color: '#000000' },
    [NODE_TYPES.MYSQL]: { icon: '🗄️', label: 'MySQL', color: '#00758F' },
    [NODE_TYPES.POSTGRES]: { icon: '🐘', label: 'PostgreSQL', color: '#336791' },
    [NODE_TYPES.OPENAI]: { icon: '🤖', label: 'OpenAI', color: '#10A37F' },
};

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onConfigChange, onClose }) => {
    const [config, setConfig] = useState<Record<string, any>>(node.data.config || {});
    const [activeTab, setActiveTab] = useState('settings');

    useEffect(() => {
        setConfig(node.data.config || {});
    }, [node.id, node.data.config]);

    const updateConfig = (key: string, value: any) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
    };

    const updateConfigBatch = (updates: Record<string, any>) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
    };

    const handleSave = () => {
        onConfigChange(node.id, config);
    };

    const metadata = nodeMetadata[node.type] || { icon: '⚙️', label: 'Node', color: '#64748b' };

    const renderConfigFields = () => {
        switch (node.type) {
            case NODE_TYPES.SCHEDULE:
                return <ScheduleConfig config={config} updateConfig={updateConfig} updateConfigBatch={updateConfigBatch} />;
            case NODE_TYPES.EMAIL:
                return <EmailConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.WHATSAPP:
                return <WhatsAppConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.TELEGRAM:
                return <TelegramConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.DISCORD:
                return <DiscordConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.SLACK:
                return <SlackConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.GOOGLE_SHEETS:
                return <GoogleSheetsConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.AIRTABLE:
                return <AirtableConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.NOTION:
                return <NotionConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.MYSQL:
            case NODE_TYPES.POSTGRES:
                return <DatabaseConfig config={config} updateConfig={updateConfig} nodeType={node.type} />;
            case NODE_TYPES.OPENAI:
                return <OpenAIConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.SET:
                return <SetConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.FILTER:
                return <FilterConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.MERGE:
                return <MergeConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.SPLIT_BATCHES:
                return <SplitBatchesConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.HTTP:
                return <HTTPConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.CONDITIONAL:
                return <ConditionalConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.DELAY:
                return <DelayConfig config={config} updateConfig={updateConfig} />;
            case NODE_TYPES.JAVASCRIPT:
                return <JavaScriptConfig config={config} updateConfig={updateConfig} />;
            default:
                return <GenericConfig config={config} updateConfig={updateConfig} />;
        }
    };

    return (
        <div className="node-config-panel">
            <div className="config-header" style={{ borderBottomColor: metadata.color }}>
                <div className="header-title">
                    <span className="header-icon">{metadata.icon}</span>
                    <span className="header-label">{metadata.label}</span>
                </div>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="config-tabs">
                <button
                    className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
                <button
                    className={`tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('credentials')}
                >
                    Credentials
                </button>
            </div>

            <div className="config-content">
                {activeTab === 'settings' && renderConfigFields()}
                {activeTab === 'credentials' && (
                    <CredentialsTab config={config} updateConfig={updateConfig} nodeType={node.type} />
                )}
            </div>

            <div className="config-footer">
                <button className="btn-secondary" onClick={onClose}>Close</button>
                <button className="btn-primary" onClick={handleSave}>Apply Changes</button>
            </div>
        </div>
    );
};

// ============================================
// Individual Node Configuration Components
// ============================================

interface ConfigProps {
    config: Record<string, any>;
    updateConfig: (key: string, value: any) => void;
    updateConfigBatch?: (updates: Record<string, any>) => void;
}

// Schedule Trigger Configuration
const ScheduleConfig: React.FC<ConfigProps> = ({ config, updateConfig, updateConfigBatch }) => {
    return (
        <div className="config-section">
            <h4>Schedule Settings</h4>

            <div className="form-group">
                <label>Trigger Mode</label>
                <select
                    value={config.mode || 'interval'}
                    onChange={(e) => updateConfig('mode', e.target.value)}
                >
                    <option value="interval">Interval</option>
                    <option value="cron">Cron Expression</option>
                    <option value="specific">Specific Times</option>
                </select>
            </div>

            {(config.mode === 'interval' || !config.mode) && (
                <>
                    <div className="form-group">
                        <label>Quick Select</label>
                        <select
                            value={config.quickInterval || 'custom'}
                            onChange={(e) => {
                                const val = e.target.value;

                                // Batch all config updates together
                                let updates: Record<string, any> = { quickInterval: val };

                                if (val === '5min') {
                                    updates.intervalValue = 5;
                                    updates.intervalUnit = 'minutes';
                                } else if (val === '15min') {
                                    updates.intervalValue = 15;
                                    updates.intervalUnit = 'minutes';
                                } else if (val === '30min') {
                                    updates.intervalValue = 30;
                                    updates.intervalUnit = 'minutes';
                                } else if (val === '1hour') {
                                    updates.intervalValue = 1;
                                    updates.intervalUnit = 'hours';
                                } else if (val === '6hours') {
                                    updates.intervalValue = 6;
                                    updates.intervalUnit = 'hours';
                                } else if (val === '12hours') {
                                    updates.intervalValue = 12;
                                    updates.intervalUnit = 'hours';
                                } else if (val === '24hours') {
                                    updates.intervalValue = 24;
                                    updates.intervalUnit = 'hours';
                                }

                                // Apply all updates at once using batch function
                                if (updateConfigBatch) {
                                    updateConfigBatch(updates);
                                } else {
                                    // Fallback to individual updates if batch not available
                                    Object.keys(updates).forEach(key => updateConfig(key, updates[key]));
                                }
                            }}
                        >
                            <option value="custom">Custom...</option>
                            <option value="5min">Every 5 minutes</option>
                            <option value="15min">Every 15 minutes</option>
                            <option value="30min">Every 30 minutes</option>
                            <option value="1hour">Every 1 hour</option>
                            <option value="6hours">Every 6 hours</option>
                            <option value="12hours">Every 12 hours</option>
                            <option value="24hours">Every 24 hours (Daily)</option>
                        </select>
                    </div>

                    {(!config.quickInterval || config.quickInterval === 'custom') && (
                        <div className="form-group">
                            <label>Custom Interval</label>
                            <div className="inline-inputs">
                                <input
                                    type="number"
                                    value={config.intervalValue || 5}
                                    onChange={(e) => updateConfig('intervalValue', parseInt(e.target.value))}
                                    min="1"
                                />
                                <select
                                    value={config.intervalUnit || 'minutes'}
                                    onChange={(e) => updateConfig('intervalUnit', e.target.value)}
                                >
                                    <option value="seconds">Seconds</option>
                                    <option value="minutes">Minutes</option>
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                </select>
                            </div>
                        </div>
                    )}
                </>
            )}

            {config.mode === 'cron' && (
                <div className="form-group">
                    <label>Cron Expression</label>
                    <input
                        type="text"
                        value={config.cronExpression || '0 * * * *'}
                        onChange={(e) => updateConfig('cronExpression', e.target.value)}
                        placeholder="0 * * * * (every hour)"
                    />
                    <small className="help-text">
                        Format: minute hour day-of-month month day-of-week
                    </small>
                </div>
            )}

            {config.mode === 'specific' && (
                <>
                    <div className="form-group">
                        <label>Days of Week</label>
                        <div className="checkbox-group">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                <label key={day} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={(config.days || []).includes(day.toLowerCase())}
                                        onChange={(e) => {
                                            const days = config.days || [];
                                            if (e.target.checked) {
                                                updateConfig('days', [...days, day.toLowerCase()]);
                                            } else {
                                                updateConfig('days', days.filter((d: string) => d !== day.toLowerCase()));
                                            }
                                        }}
                                    />
                                    {day}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Time</label>
                        <input
                            type="time"
                            value={config.time || '09:00'}
                            onChange={(e) => updateConfig('time', e.target.value)}
                        />
                    </div>
                </>
            )}

            <div className="form-group">
                <label>Timezone</label>
                <select
                    value={config.timezone || 'UTC'}
                    onChange={(e) => updateConfig('timezone', e.target.value)}
                >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (US)</option>
                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                </select>
            </div>
        </div>
    );
};

// Email Configuration
const EmailConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Email Settings</h4>
            
            <div className="form-group">
                <label>Operation</label>
                <select
                    value={config.operation || 'send'}
                    onChange={(e) => updateConfig('operation', e.target.value)}
                >
                    <option value="send">Send Email</option>
                    <option value="sendTemplate">Send Template</option>
                </select>
            </div>

            <div className="form-group">
                <label>From Email</label>
                <input
                    type="email"
                    value={config.from || ''}
                    onChange={(e) => updateConfig('from', e.target.value)}
                    placeholder="sender@example.com"
                />
            </div>

            <div className="form-group">
                <label>To Email(s)</label>
                <input
                    type="text"
                    value={config.to || ''}
                    onChange={(e) => updateConfig('to', e.target.value)}
                    placeholder="recipient@example.com, another@example.com"
                />
            </div>

            <div className="form-group">
                <label>CC (Optional)</label>
                <input
                    type="text"
                    value={config.cc || ''}
                    onChange={(e) => updateConfig('cc', e.target.value)}
                    placeholder="cc@example.com"
                />
            </div>

            <div className="form-group">
                <label>Subject</label>
                <input
                    type="text"
                    value={config.subject || ''}
                    onChange={(e) => updateConfig('subject', e.target.value)}
                    placeholder="Email subject"
                />
            </div>

            <div className="form-group">
                <label>Body Type</label>
                <select
                    value={config.bodyType || 'text'}
                    onChange={(e) => updateConfig('bodyType', e.target.value)}
                >
                    <option value="text">Plain Text</option>
                    <option value="html">HTML</option>
                </select>
            </div>

            <div className="form-group">
                <label>Body</label>
                <textarea
                    value={config.body || ''}
                    onChange={(e) => updateConfig('body', e.target.value)}
                    placeholder={config.bodyType === 'html' ? '<h1>Hello</h1>' : 'Email content...'}
                    rows={6}
                />
            </div>
        </div>
    );
};

// WhatsApp Configuration
const WhatsAppConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>WhatsApp Business Settings</h4>
            
            <div className="form-group">
                <label>Operation</label>
                <select
                    value={config.operation || 'sendMessage'}
                    onChange={(e) => updateConfig('operation', e.target.value)}
                >
                    <option value="sendMessage">Send Text Message</option>
                    <option value="sendTemplate">Send Template Message</option>
                    <option value="sendMedia">Send Media</option>
                </select>
            </div>

            <div className="form-group">
                <label>Phone Number</label>
                <input
                    type="text"
                    value={config.phoneNumber || ''}
                    onChange={(e) => updateConfig('phoneNumber', e.target.value)}
                    placeholder="+1234567890"
                />
                <small className="help-text">Include country code without spaces</small>
            </div>

            {config.operation === 'sendMessage' && (
                <div className="form-group">
                    <label>Message</label>
                    <textarea
                        value={config.message || ''}
                        onChange={(e) => updateConfig('message', e.target.value)}
                        placeholder="Your message here..."
                        rows={4}
                    />
                </div>
            )}

            {config.operation === 'sendTemplate' && (
                <>
                    <div className="form-group">
                        <label>Template Name</label>
                        <input
                            type="text"
                            value={config.templateName || ''}
                            onChange={(e) => updateConfig('templateName', e.target.value)}
                            placeholder="hello_world"
                        />
                    </div>
                    <div className="form-group">
                        <label>Template Language</label>
                        <input
                            type="text"
                            value={config.templateLanguage || 'en'}
                            onChange={(e) => updateConfig('templateLanguage', e.target.value)}
                            placeholder="en"
                        />
                    </div>
                </>
            )}

            {config.operation === 'sendMedia' && (
                <>
                    <div className="form-group">
                        <label>Media Type</label>
                        <select
                            value={config.mediaType || 'image'}
                            onChange={(e) => updateConfig('mediaType', e.target.value)}
                        >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="document">Document</option>
                            <option value="audio">Audio</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Media URL</label>
                        <input
                            type="url"
                            value={config.mediaUrl || ''}
                            onChange={(e) => updateConfig('mediaUrl', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                    <div className="form-group">
                        <label>Caption (Optional)</label>
                        <input
                            type="text"
                            value={config.caption || ''}
                            onChange={(e) => updateConfig('caption', e.target.value)}
                            placeholder="Media caption"
                        />
                    </div>
                </>
            )}
        </div>
    );
};

// Telegram Configuration
const TelegramConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Telegram Settings</h4>
            
            <div className="form-group">
                <label>Operation</label>
                <select
                    value={config.operation || 'sendMessage'}
                    onChange={(e) => updateConfig('operation', e.target.value)}
                >
                    <option value="sendMessage">Send Message</option>
                    <option value="sendPhoto">Send Photo</option>
                    <option value="sendDocument">Send Document</option>
                    <option value="sendLocation">Send Location</option>
                </select>
            </div>

            <div className="form-group">
                <label>Chat ID</label>
                <input
                    type="text"
                    value={config.chatId || ''}
                    onChange={(e) => updateConfig('chatId', e.target.value)}
                    placeholder="123456789 or @channelname"
                />
            </div>

            {(config.operation === 'sendMessage' || !config.operation) && (
                <>
                    <div className="form-group">
                        <label>Message</label>
                        <textarea
                            value={config.message || ''}
                            onChange={(e) => updateConfig('message', e.target.value)}
                            placeholder="Your message here... Use {{variableName}} for dynamic data"
                            rows={4}
                        />
                    </div>
                    <div className="form-group">
                        <label>Parse Mode</label>
                        <select
                            value={config.parseMode || 'HTML'}
                            onChange={(e) => updateConfig('parseMode', e.target.value)}
                        >
                            <option value="HTML">HTML</option>
                            <option value="Markdown">Markdown</option>
                            <option value="MarkdownV2">Markdown V2</option>
                        </select>
                    </div>
                </>
            )}

            {config.operation === 'sendPhoto' && (
                <div className="form-group">
                    <label>Photo URL</label>
                    <input
                        type="url"
                        value={config.photoUrl || ''}
                        onChange={(e) => updateConfig('photoUrl', e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                    />
                </div>
            )}

            {config.operation === 'sendLocation' && (
                <>
                    <div className="form-group">
                        <label>Latitude</label>
                        <input
                            type="number"
                            step="any"
                            value={config.latitude || ''}
                            onChange={(e) => updateConfig('latitude', parseFloat(e.target.value))}
                            placeholder="40.7128"
                        />
                    </div>
                    <div className="form-group">
                        <label>Longitude</label>
                        <input
                            type="number"
                            step="any"
                            value={config.longitude || ''}
                            onChange={(e) => updateConfig('longitude', parseFloat(e.target.value))}
                            placeholder="-74.0060"
                        />
                    </div>
                </>
            )}

            <div className="form-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={config.disableNotification || false}
                        onChange={(e) => updateConfig('disableNotification', e.target.checked)}
                    />
                    Disable Notification
                </label>
            </div>
        </div>
    );
};

// Discord Configuration
const DiscordConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Discord Settings</h4>
            
            <div className="form-group">
                <label>Operation</label>
                <select
                    value={config.operation || 'sendMessage'}
                    onChange={(e) => updateConfig('operation', e.target.value)}
                >
                    <option value="sendMessage">Send Message (Webhook)</option>
                    <option value="sendEmbed">Send Embed (Webhook)</option>
                </select>
            </div>

            <div className="form-group">
                <label>Webhook URL</label>
                <input
                    type="url"
                    value={config.webhookUrl || ''}
                    onChange={(e) => updateConfig('webhookUrl', e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                />
            </div>

            {config.operation === 'sendMessage' && (
                <div className="form-group">
                    <label>Message</label>
                    <textarea
                        value={config.message || ''}
                        onChange={(e) => updateConfig('message', e.target.value)}
                        placeholder="Your message here..."
                        rows={4}
                    />
                </div>
            )}

            {config.operation === 'sendEmbed' && (
                <>
                    <div className="form-group">
                        <label>Embed Title</label>
                        <input
                            type="text"
                            value={config.embedTitle || ''}
                            onChange={(e) => updateConfig('embedTitle', e.target.value)}
                            placeholder="Embed title"
                        />
                    </div>
                    <div className="form-group">
                        <label>Embed Description</label>
                        <textarea
                            value={config.embedDescription || ''}
                            onChange={(e) => updateConfig('embedDescription', e.target.value)}
                            placeholder="Embed description..."
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label>Embed Color (Hex)</label>
                        <input
                            type="color"
                            value={config.embedColor || '#5865F2'}
                            onChange={(e) => updateConfig('embedColor', e.target.value)}
                        />
                    </div>
                </>
            )}

            <div className="form-group">
                <label>Username (Optional)</label>
                <input
                    type="text"
                    value={config.username || ''}
                    onChange={(e) => updateConfig('username', e.target.value)}
                    placeholder="Bot username override"
                />
            </div>

            <div className="form-group">
                <label>Avatar URL (Optional)</label>
                <input
                    type="url"
                    value={config.avatarUrl || ''}
                    onChange={(e) => updateConfig('avatarUrl', e.target.value)}
                    placeholder="https://example.com/avatar.png"
                />
            </div>
        </div>
    );
};

// Slack Configuration
const SlackConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Slack Settings</h4>
            
            <div className="form-group">
                <label>Operation</label>
                <select
                    value={config.operation || 'sendMessage'}
                    onChange={(e) => updateConfig('operation', e.target.value)}
                >
                    <option value="sendMessage">Send Message</option>
                    <option value="uploadFile">Upload File</option>
                    <option value="updateMessage">Update Message</option>
                </select>
            </div>

            <div className="form-group">
                <label>Channel</label>
                <input
                    type="text"
                    value={config.channel || ''}
                    onChange={(e) => updateConfig('channel', e.target.value)}
                    placeholder="#general or channel ID"
                />
            </div>

            {config.operation === 'sendMessage' && (
                <>
                    <div className="form-group">
                        <label>Message</label>
                        <textarea
                            value={config.message || ''}
                            onChange={(e) => updateConfig('message', e.target.value)}
                            placeholder="Your message here..."
                            rows={4}
                        />
                    </div>
                    <div className="form-group">
                        <label>Username (Optional)</label>
                        <input
                            type="text"
                            value={config.username || ''}
                            onChange={(e) => updateConfig('username', e.target.value)}
                            placeholder="Bot name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Icon Emoji (Optional)</label>
                        <input
                            type="text"
                            value={config.iconEmoji || ''}
                            onChange={(e) => updateConfig('iconEmoji', e.target.value)}
                            placeholder=":robot_face:"
                        />
                    </div>
                </>
            )}

            {config.operation === 'updateMessage' && (
                <div className="form-group">
                    <label>Message Timestamp</label>
                    <input
                        type="text"
                        value={config.messageTs || ''}
                        onChange={(e) => updateConfig('messageTs', e.target.value)}
                        placeholder="1234567890.123456"
                    />
                </div>
            )}
        </div>
    );
};

// Google Sheets Configuration
const GoogleSheetsConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Google Sheets Settings</h4>
            
            <div className="form-group">
                <label>Operation</label>
                <select
                    value={config.operation || 'read'}
                    onChange={(e) => updateConfig('operation', e.target.value)}
                >
                    <option value="read">Read Rows</option>
                    <option value="append">Append Row</option>
                    <option value="update">Update Row</option>
                    <option value="delete">Delete Row</option>
                    <option value="lookup">Lookup</option>
                </select>
            </div>

            <div className="form-group">
                <label>Spreadsheet ID</label>
                <input
                    type="text"
                    value={config.spreadsheetId || ''}
                    onChange={(e) => updateConfig('spreadsheetId', e.target.value)}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                />
                <small className="help-text">Found in the spreadsheet URL</small>
            </div>

            <div className="form-group">
                <label>Sheet Name</label>
                <input
                    type="text"
                    value={config.sheetName || ''}
                    onChange={(e) => updateConfig('sheetName', e.target.value)}
                    placeholder="Sheet1"
                />
            </div>

            <div className="form-group">
                <label>Range</label>
                <input
                    type="text"
                    value={config.range || ''}
                    onChange={(e) => updateConfig('range', e.target.value)}
                    placeholder="A1:D10 or A:D"
                />
            </div>

            {config.operation === 'lookup' && (
                <>
                    <div className="form-group">
                        <label>Lookup Column</label>
                        <input
                            type="text"
                            value={config.lookupColumn || ''}
                            onChange={(e) => updateConfig('lookupColumn', e.target.value)}
                            placeholder="A"
                        />
                    </div>
                    <div className="form-group">
                        <label>Lookup Value</label>
                        <input
                            type="text"
                            value={config.lookupValue || ''}
                            onChange={(e) => updateConfig('lookupValue', e.target.value)}
                            placeholder="Search value"
                        />
                    </div>
                </>
            )}
        </div>
    );
};

// Airtable Configuration
const AirtableConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Airtable Settings</h4>
            
            <div className="form-group">
                <label>Operation</label>
                <select
                    value={config.operation || 'list'}
                    onChange={(e) => updateConfig('operation', e.target.value)}
                >
                    <option value="list">List Records</option>
                    <option value="read">Get Record</option>
                    <option value="create">Create Record</option>
                    <option value="update">Update Record</option>
                    <option value="delete">Delete Record</option>
                </select>
            </div>

            <div className="form-group">
                <label>Base ID</label>
                <input
                    type="text"
                    value={config.baseId || ''}
                    onChange={(e) => updateConfig('baseId', e.target.value)}
                    placeholder="appXXXXXXXXXXXXXX"
                />
            </div>

            <div className="form-group">
                <label>Table Name</label>
                <input
                    type="text"
                    value={config.tableName || ''}
                    onChange={(e) => updateConfig('tableName', e.target.value)}
                    placeholder="Table 1"
                />
            </div>

            {(config.operation === 'read' || config.operation === 'update' || config.operation === 'delete') && (
                <div className="form-group">
                    <label>Record ID</label>
                    <input
                        type="text"
                        value={config.recordId || ''}
                        onChange={(e) => updateConfig('recordId', e.target.value)}
                        placeholder="recXXXXXXXXXXXXXX"
                    />
                </div>
            )}

            {config.operation === 'list' && (
                <>
                    <div className="form-group">
                        <label>Filter by Formula (Optional)</label>
                        <input
                            type="text"
                            value={config.filterByFormula || ''}
                            onChange={(e) => updateConfig('filterByFormula', e.target.value)}
                            placeholder="{Status} = 'Active'"
                        />
                    </div>
                    <div className="form-group">
                        <label>Max Records</label>
                        <input
                            type="number"
                            value={config.maxRecords || 100}
                            onChange={(e) => updateConfig('maxRecords', parseInt(e.target.value))}
                            min="1"
                            max="1000"
                        />
                    </div>
                </>
            )}
        </div>
    );
};

// Notion Configuration
const NotionConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Notion Settings</h4>
            
            <div className="form-group">
                <label>Operation</label>
                <select
                    value={config.operation || 'queryDatabase'}
                    onChange={(e) => updateConfig('operation', e.target.value)}
                >
                    <option value="queryDatabase">Query Database</option>
                    <option value="createPage">Create Page</option>
                    <option value="updatePage">Update Page</option>
                    <option value="getPage">Get Page</option>
                </select>
            </div>

            {(config.operation === 'queryDatabase' || config.operation === 'createPage') && (
                <div className="form-group">
                    <label>Database ID</label>
                    <input
                        type="text"
                        value={config.databaseId || ''}
                        onChange={(e) => updateConfig('databaseId', e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                </div>
            )}

            {(config.operation === 'getPage' || config.operation === 'updatePage') && (
                <div className="form-group">
                    <label>Page ID</label>
                    <input
                        type="text"
                        value={config.pageId || ''}
                        onChange={(e) => updateConfig('pageId', e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                </div>
            )}

            {config.operation === 'createPage' && (
                <div className="form-group">
                    <label>Properties (JSON)</label>
                    <textarea
                        value={config.properties || '{}'}
                        onChange={(e) => updateConfig('properties', e.target.value)}
                        placeholder='{"Name": {"title": [{"text": {"content": "New Page"}}]}}'
                        rows={4}
                    />
                </div>
            )}
        </div>
    );
};

// Database (MySQL/PostgreSQL) Configuration
const DatabaseConfig: React.FC<ConfigProps & { nodeType: string }> = ({ config, updateConfig, nodeType }) => {
    const dbName = nodeType === NODE_TYPES.MYSQL ? 'MySQL' : 'PostgreSQL';
    
    return (
        <div className="config-section">
            <h4>{dbName} Settings</h4>
            
            <div className="form-group">
                <label>Operation</label>
                <select
                    value={config.operation || 'select'}
                    onChange={(e) => updateConfig('operation', e.target.value)}
                >
                    <option value="select">Select</option>
                    <option value="insert">Insert</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="executeQuery">Execute Query</option>
                </select>
            </div>

            {config.operation !== 'executeQuery' && (
                <div className="form-group">
                    <label>Table</label>
                    <input
                        type="text"
                        value={config.table || ''}
                        onChange={(e) => updateConfig('table', e.target.value)}
                        placeholder="users"
                    />
                </div>
            )}

            {config.operation === 'executeQuery' && (
                <div className="form-group">
                    <label>SQL Query</label>
                    <textarea
                        value={config.query || ''}
                        onChange={(e) => updateConfig('query', e.target.value)}
                        placeholder="SELECT * FROM users WHERE id = $1"
                        rows={5}
                    />
                </div>
            )}

            {config.operation === 'select' && (
                <>
                    <div className="form-group">
                        <label>Columns (comma separated)</label>
                        <input
                            type="text"
                            value={config.columns || ''}
                            onChange={(e) => updateConfig('columns', e.target.value)}
                            placeholder="id, name, email (leave empty for *)"
                        />
                    </div>
                    <div className="form-group">
                        <label>Where Clause</label>
                        <input
                            type="text"
                            value={config.where || ''}
                            onChange={(e) => updateConfig('where', e.target.value)}
                            placeholder="status = 'active'"
                        />
                    </div>
                    <div className="form-group">
                        <label>Limit</label>
                        <input
                            type="number"
                            value={config.limit || ''}
                            onChange={(e) => updateConfig('limit', parseInt(e.target.value) || '')}
                            placeholder="100"
                        />
                    </div>
                </>
            )}
        </div>
    );
};

// OpenAI Configuration
const OpenAIConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>OpenAI Settings</h4>
            
            <div className="form-group">
                <label>Operation</label>
                <select
                    value={config.operation || 'chat'}
                    onChange={(e) => updateConfig('operation', e.target.value)}
                >
                    <option value="chat">Chat Completion</option>
                    <option value="complete">Text Completion</option>
                    <option value="image">Generate Image</option>
                    <option value="embedding">Create Embedding</option>
                </select>
            </div>

            <div className="form-group">
                <label>Model</label>
                <select
                    value={config.model || 'gpt-4'}
                    onChange={(e) => updateConfig('model', e.target.value)}
                >
                    {config.operation === 'image' ? (
                        <>
                            <option value="dall-e-3">DALL-E 3</option>
                            <option value="dall-e-2">DALL-E 2</option>
                        </>
                    ) : config.operation === 'embedding' ? (
                        <>
                            <option value="text-embedding-3-small">text-embedding-3-small</option>
                            <option value="text-embedding-3-large">text-embedding-3-large</option>
                            <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                        </>
                    ) : (
                        <>
                            <optgroup label="🔓 Free Models (Gemini)">
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (FREE - Recommended)</option>
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (FREE)</option>
                                <option value="gemini-2.5-pro">Gemini 2.5 Pro (FREE)</option>
                            </optgroup>
                            <optgroup label="💳 OpenAI Models (Paid)">
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="gpt-4o-mini">GPT-4o Mini</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </optgroup>
                        </>
                    )}
                </select>
            </div>

            {(config.operation === 'chat' || config.operation === 'complete') && (
                <>
                    <div className="form-group">
                        <label>System Prompt</label>
                        <textarea
                            value={config.systemPrompt || ''}
                            onChange={(e) => updateConfig('systemPrompt', e.target.value)}
                            placeholder="You are a helpful assistant..."
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label>User Prompt</label>
                        <textarea
                            value={config.userPrompt || ''}
                            onChange={(e) => updateConfig('userPrompt', e.target.value)}
                            placeholder="Enter your prompt here..."
                            rows={4}
                        />
                    </div>
                    <div className="form-group">
                        <label>Max Tokens</label>
                        <input
                            type="number"
                            value={config.maxTokens || 1000}
                            onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value))}
                            min="1"
                            max="4096"
                        />
                    </div>
                    <div className="form-group">
                        <label>Temperature (0-2)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={config.temperature || 0.7}
                            onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                            min="0"
                            max="2"
                        />
                    </div>
                </>
            )}

            {config.operation === 'image' && (
                <>
                    <div className="form-group">
                        <label>Image Prompt</label>
                        <textarea
                            value={config.imagePrompt || ''}
                            onChange={(e) => updateConfig('imagePrompt', e.target.value)}
                            placeholder="A futuristic city at sunset..."
                            rows={4}
                        />
                    </div>
                    <div className="form-group">
                        <label>Image Size</label>
                        <select
                            value={config.imageSize || '1024x1024'}
                            onChange={(e) => updateConfig('imageSize', e.target.value)}
                        >
                            <option value="256x256">256x256</option>
                            <option value="512x512">512x512</option>
                            <option value="1024x1024">1024x1024</option>
                            <option value="1792x1024">1792x1024 (Landscape)</option>
                            <option value="1024x1792">1024x1792 (Portrait)</option>
                        </select>
                    </div>
                </>
            )}

            {config.operation === 'embedding' && (
                <div className="form-group">
                    <label>Input Text</label>
                    <textarea
                        value={config.inputText || ''}
                        onChange={(e) => updateConfig('inputText', e.target.value)}
                        placeholder="Text to create embeddings for..."
                        rows={4}
                    />
                </div>
            )}
        </div>
    );
};

// Set/Transform Configuration
const SetConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    const fields = config.fields || [{ name: '', value: '', type: 'string' }];

    const addField = () => {
        updateConfig('fields', [...fields, { name: '', value: '', type: 'string' }]);
    };

    const removeField = (index: number) => {
        const newFields = fields.filter((_: any, i: number) => i !== index);
        updateConfig('fields', newFields);
    };

    const updateField = (index: number, key: string, value: any) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [key]: value };
        updateConfig('fields', newFields);
    };

    return (
        <div className="config-section">
            <h4>Set/Transform Settings</h4>
            
            <div className="form-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={config.keepOnlySet || false}
                        onChange={(e) => updateConfig('keepOnlySet', e.target.checked)}
                    />
                    Keep Only Set Fields
                </label>
            </div>

            <div className="fields-list">
                <label>Fields</label>
                {fields.map((field: any, index: number) => (
                    <div key={index} className="field-row">
                        <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(index, 'name', e.target.value)}
                            placeholder="Field name"
                        />
                        <select
                            value={field.type}
                            onChange={(e) => updateField(index, 'type', e.target.value)}
                        >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="object">Object</option>
                        </select>
                        <input
                            type="text"
                            value={field.value}
                            onChange={(e) => updateField(index, 'value', e.target.value)}
                            placeholder="Value"
                        />
                        <button className="btn-icon" onClick={() => removeField(index)}>×</button>
                    </div>
                ))}
                <button className="btn-add" onClick={addField}>+ Add Field</button>
            </div>
        </div>
    );
};

// Filter Configuration
const FilterConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    const conditions = config.conditions || [{ field: '', operator: 'equals', value: '' }];

    const addCondition = () => {
        updateConfig('conditions', [...conditions, { field: '', operator: 'equals', value: '' }]);
    };

    const removeCondition = (index: number) => {
        const newConditions = conditions.filter((_: any, i: number) => i !== index);
        updateConfig('conditions', newConditions);
    };

    const updateCondition = (index: number, key: string, value: any) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [key]: value };
        updateConfig('conditions', newConditions);
    };

    return (
        <div className="config-section">
            <h4>Filter Settings</h4>
            
            <div className="form-group">
                <label>Combine Conditions</label>
                <select
                    value={config.combineConditions || 'AND'}
                    onChange={(e) => updateConfig('combineConditions', e.target.value)}
                >
                    <option value="AND">AND (all must match)</option>
                    <option value="OR">OR (any must match)</option>
                </select>
            </div>

            <div className="conditions-list">
                <label>Conditions</label>
                {conditions.map((condition: any, index: number) => (
                    <div key={index} className="condition-row">
                        <input
                            type="text"
                            value={condition.field}
                            onChange={(e) => updateCondition(index, 'field', e.target.value)}
                            placeholder="Field name"
                        />
                        <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        >
                            <option value="equals">Equals</option>
                            <option value="notEquals">Not Equals</option>
                            <option value="contains">Contains</option>
                            <option value="notContains">Not Contains</option>
                            <option value="startsWith">Starts With</option>
                            <option value="endsWith">Ends With</option>
                            <option value="greaterThan">Greater Than</option>
                            <option value="lessThan">Less Than</option>
                            <option value="isEmpty">Is Empty</option>
                            <option value="isNotEmpty">Is Not Empty</option>
                        </select>
                        <input
                            type="text"
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            placeholder="Value"
                        />
                        <button className="btn-icon" onClick={() => removeCondition(index)}>×</button>
                    </div>
                ))}
                <button className="btn-add" onClick={addCondition}>+ Add Condition</button>
            </div>
        </div>
    );
};

// Merge Configuration
const MergeConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Merge Settings</h4>
            
            <div className="form-group">
                <label>Mode</label>
                <select
                    value={config.mode || 'append'}
                    onChange={(e) => updateConfig('mode', e.target.value)}
                >
                    <option value="append">Append</option>
                    <option value="combine">Combine by Position</option>
                    <option value="mergeByKey">Merge by Key</option>
                    <option value="chooseBranch">Choose Branch</option>
                </select>
            </div>

            {config.mode === 'mergeByKey' && (
                <div className="form-group">
                    <label>Merge Key Field</label>
                    <input
                        type="text"
                        value={config.mergeKey || ''}
                        onChange={(e) => updateConfig('mergeKey', e.target.value)}
                        placeholder="id"
                    />
                </div>
            )}

            {config.mode === 'chooseBranch' && (
                <div className="form-group">
                    <label>Branch to Keep</label>
                    <select
                        value={config.branchToKeep || 'input1'}
                        onChange={(e) => updateConfig('branchToKeep', e.target.value)}
                    >
                        <option value="input1">Input 1</option>
                        <option value="input2">Input 2</option>
                    </select>
                </div>
            )}
        </div>
    );
};

// Split in Batches Configuration
const SplitBatchesConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Split in Batches Settings</h4>
            
            <div className="form-group">
                <label>Batch Size</label>
                <input
                    type="number"
                    value={config.batchSize || 10}
                    onChange={(e) => updateConfig('batchSize', parseInt(e.target.value))}
                    min="1"
                />
            </div>

            <div className="form-group">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={config.resetOnError || false}
                        onChange={(e) => updateConfig('resetOnError', e.target.checked)}
                    />
                    Reset on Error
                </label>
            </div>
        </div>
    );
};

// HTTP Request Configuration
const HTTPConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>HTTP Request Settings</h4>
            
            <div className="form-group">
                <label>Method</label>
                <select
                    value={config.method || 'GET'}
                    onChange={(e) => updateConfig('method', e.target.value)}
                >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                </select>
            </div>

            <div className="form-group">
                <label>URL</label>
                <input
                    type="url"
                    value={config.url || ''}
                    onChange={(e) => updateConfig('url', e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                />
            </div>

            <div className="form-group">
                <label>Authentication</label>
                <select
                    value={config.authType || 'none'}
                    onChange={(e) => updateConfig('authType', e.target.value)}
                >
                    <option value="none">None</option>
                    <option value="basicAuth">Basic Auth</option>
                    <option value="bearerToken">Bearer Token</option>
                    <option value="apiKey">API Key</option>
                </select>
            </div>

            {config.authType === 'basicAuth' && (
                <>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={config.username || ''}
                            onChange={(e) => updateConfig('username', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={config.password || ''}
                            onChange={(e) => updateConfig('password', e.target.value)}
                        />
                    </div>
                </>
            )}

            {config.authType === 'bearerToken' && (
                <div className="form-group">
                    <label>Token</label>
                    <input
                        type="password"
                        value={config.token || ''}
                        onChange={(e) => updateConfig('token', e.target.value)}
                        placeholder="Bearer token"
                    />
                </div>
            )}

            {config.authType === 'apiKey' && (
                <>
                    <div className="form-group">
                        <label>Header Name</label>
                        <input
                            type="text"
                            value={config.apiKeyHeader || 'X-API-Key'}
                            onChange={(e) => updateConfig('apiKeyHeader', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>API Key</label>
                        <input
                            type="password"
                            value={config.apiKey || ''}
                            onChange={(e) => updateConfig('apiKey', e.target.value)}
                        />
                    </div>
                </>
            )}

            <div className="form-group">
                <label>Headers (JSON)</label>
                <textarea
                    value={config.headers || '{}'}
                    onChange={(e) => updateConfig('headers', e.target.value)}
                    placeholder='{"Content-Type": "application/json"}'
                    rows={3}
                />
            </div>

            {['POST', 'PUT', 'PATCH'].includes(config.method) && (
                <>
                    <div className="form-group">
                        <label>Body Type</label>
                        <select
                            value={config.bodyType || 'json'}
                            onChange={(e) => updateConfig('bodyType', e.target.value)}
                        >
                            <option value="json">JSON</option>
                            <option value="form">Form URL Encoded</option>
                            <option value="formData">Form Data</option>
                            <option value="raw">Raw</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Body</label>
                        <textarea
                            value={config.body || ''}
                            onChange={(e) => updateConfig('body', e.target.value)}
                            placeholder={config.bodyType === 'json' ? '{"key": "value"}' : 'key=value&key2=value2'}
                            rows={5}
                        />
                    </div>
                </>
            )}

            <div className="form-group">
                <label>Timeout (ms)</label>
                <input
                    type="number"
                    value={config.timeout || 30000}
                    onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
                    min="1000"
                />
            </div>
        </div>
    );
};

// Conditional/IF Configuration
const ConditionalConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>IF Condition Settings</h4>
            
            <div className="form-group">
                <label>Condition Type</label>
                <select
                    value={config.conditionType || 'simple'}
                    onChange={(e) => updateConfig('conditionType', e.target.value)}
                >
                    <option value="simple">Simple</option>
                    <option value="expression">Expression</option>
                </select>
            </div>

            {config.conditionType === 'simple' ? (
                <>
                    <div className="form-group">
                        <label>Field</label>
                        <input
                            type="text"
                            value={config.field || ''}
                            onChange={(e) => updateConfig('field', e.target.value)}
                            placeholder="data.status"
                        />
                    </div>
                    <div className="form-group">
                        <label>Operator</label>
                        <select
                            value={config.operator || 'equals'}
                            onChange={(e) => updateConfig('operator', e.target.value)}
                        >
                            <option value="equals">Equals</option>
                            <option value="notEquals">Not Equals</option>
                            <option value="contains">Contains</option>
                            <option value="greaterThan">Greater Than</option>
                            <option value="lessThan">Less Than</option>
                            <option value="isEmpty">Is Empty</option>
                            <option value="isNotEmpty">Is Not Empty</option>
                            <option value="isTrue">Is True</option>
                            <option value="isFalse">Is False</option>
                        </select>
                    </div>
                    {!['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(config.operator) && (
                        <div className="form-group">
                            <label>Value</label>
                            <input
                                type="text"
                                value={config.value || ''}
                                onChange={(e) => updateConfig('value', e.target.value)}
                                placeholder="Comparison value"
                            />
                        </div>
                    )}
                </>
            ) : (
                <div className="form-group">
                    <label>JavaScript Expression</label>
                    <textarea
                        value={config.expression || ''}
                        onChange={(e) => updateConfig('expression', e.target.value)}
                        placeholder="data.count > 10 && data.status === 'active'"
                        rows={4}
                    />
                    <small className="help-text">Must return true or false</small>
                </div>
            )}
        </div>
    );
};

// Delay Configuration
const DelayConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Delay Settings</h4>
            
            <div className="form-group">
                <label>Delay Type</label>
                <select
                    value={config.delayType || 'fixed'}
                    onChange={(e) => updateConfig('delayType', e.target.value)}
                >
                    <option value="fixed">Fixed Duration</option>
                    <option value="until">Wait Until Date/Time</option>
                </select>
            </div>

            {config.delayType === 'fixed' ? (
                <div className="form-group">
                    <label>Duration</label>
                    <div className="inline-inputs">
                        <input
                            type="number"
                            value={config.delayValue || 5}
                            onChange={(e) => updateConfig('delayValue', parseInt(e.target.value))}
                            min="1"
                        />
                        <select
                            value={config.delayUnit || 'seconds'}
                            onChange={(e) => updateConfig('delayUnit', e.target.value)}
                        >
                            <option value="milliseconds">Milliseconds</option>
                            <option value="seconds">Seconds</option>
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                        </select>
                    </div>
                </div>
            ) : (
                <div className="form-group">
                    <label>Wait Until</label>
                    <input
                        type="datetime-local"
                        value={config.waitUntil || ''}
                        onChange={(e) => updateConfig('waitUntil', e.target.value)}
                    />
                </div>
            )}
        </div>
    );
};

// JavaScript/Code Configuration
const JavaScriptConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Code Settings</h4>
            
            <div className="form-group">
                <label>JavaScript Code</label>
                <textarea
                    value={config.code || '// Access input data with: data\n// Return output data\nreturn data;'}
                    onChange={(e) => updateConfig('code', e.target.value)}
                    placeholder="// Your code here"
                    rows={15}
                    className="code-input"
                />
                <small className="help-text">
                    Use <code>data</code> to access input. Return the transformed data.
                </small>
            </div>
        </div>
    );
};

// Generic Configuration (fallback)
const GenericConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {
    return (
        <div className="config-section">
            <h4>Configuration</h4>
            <div className="form-group">
                <label>Configuration (JSON)</label>
                <textarea
                    value={JSON.stringify(config, null, 2)}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            Object.keys(parsed).forEach(key => updateConfig(key, parsed[key]));
                        } catch (err) {
                            // Invalid JSON, ignore
                        }
                    }}
                    rows={10}
                />
            </div>
        </div>
    );
};

// Credentials Tab
const CredentialsTab: React.FC<ConfigProps & { nodeType: string }> = ({ config, updateConfig, nodeType }) => {
    const credentialFields = getCredentialFields(nodeType);

    if (credentialFields.length === 0) {
        return (
            <div className="config-section">
                <p className="no-credentials">This node doesn't require credentials.</p>
            </div>
        );
    }

    return (
        <div className="config-section">
            <h4>Credentials</h4>
            {credentialFields.map((field) => (
                <div key={field.key} className="form-group">
                    <label>{field.label}</label>
                    <input
                        type={field.type || 'text'}
                        value={config[field.key] || ''}
                        onChange={(e) => updateConfig(field.key, e.target.value)}
                        placeholder={field.placeholder}
                    />
                    {field.helpText && <small className="help-text">{field.helpText}</small>}
                </div>
            ))}
        </div>
    );
};

function getCredentialFields(nodeType: string): { key: string; label: string; type?: string; placeholder?: string; helpText?: string }[] {
    switch (nodeType) {
        case NODE_TYPES.SLACK:
            return [{ key: 'slackToken', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...', helpText: 'OAuth Bot Token from Slack App' }];
        case NODE_TYPES.TELEGRAM:
            return [{ key: 'telegramBotToken', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF...', helpText: 'Get from @BotFather' }];
        case NODE_TYPES.WHATSAPP:
            return [
                { key: 'apiToken', label: 'Access Token', type: 'password', placeholder: 'EAAxxxxxxxxxx', helpText: 'From Meta Business Suite > WhatsApp > API Setup' },
                { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: '123456789012345', helpText: 'Found in WhatsApp Business API settings' },
            ];
        case NODE_TYPES.OPENAI:
            return [{ key: 'openaiApiKey', label: 'API Key', type: 'password', placeholder: 'sk-...', helpText: 'From OpenAI dashboard' }];
        case NODE_TYPES.GOOGLE_SHEETS:
            return [{ key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'ya29.a0...', helpText: 'OAuth2 access token from Google OAuth Playground (https://developers.google.com/oauthplayground)' }];
        case NODE_TYPES.AIRTABLE:
            return [{ key: 'airtableApiKey', label: 'API Key', type: 'password', helpText: 'Personal access token from Airtable' }];
        case NODE_TYPES.NOTION:
            return [{ key: 'notionToken', label: 'Integration Token', type: 'password', placeholder: 'secret_...', helpText: 'Internal integration token' }];
        case NODE_TYPES.MYSQL:
        case NODE_TYPES.POSTGRES:
            return [
                { key: 'dbHost', label: 'Host', placeholder: 'localhost' },
                { key: 'dbPort', label: 'Port', placeholder: nodeType === NODE_TYPES.MYSQL ? '3306' : '5432' },
                { key: 'dbName', label: 'Database', placeholder: 'mydb' },
                { key: 'dbUser', label: 'Username', placeholder: 'root' },
                { key: 'dbPassword', label: 'Password', type: 'password' },
            ];
        case NODE_TYPES.EMAIL:
            return [
                { key: 'smtpHost', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
                { key: 'smtpPort', label: 'SMTP Port', placeholder: '587' },
                { key: 'smtpUser', label: 'SMTP Username' },
                { key: 'smtpPassword', label: 'SMTP Password', type: 'password' },
            ];
        default:
            return [];
    }
}

export default NodeConfigPanel;
