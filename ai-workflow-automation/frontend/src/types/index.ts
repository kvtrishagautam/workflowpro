export interface NodePosition {
    x: number;
    y: number;
}

export interface NodeData {
    label: string;
    config?: Record<string, any>;
    [key: string]: any;
}

// All supported node types
export type NodeTypeValue =
    | 'webhook'
    | 'javascript'
    | 'slack'
    | 'http'
    | 'conditional'
    | 'delay'
    | 'schedule'
    | 'email'
    | 'emailDiscovery'
    | 'emailSending'
    | 'scheduledEmail'
    | 'whatsapp'
    | 'telegram'
    | 'googleSheets'
    | 'set'
    | 'filter'
    | 'merge'
    | 'splitBatches'
    | 'discord'
    | 'airtable'
    | 'notion'
    | 'openai'
    | 'mysql'
    | 'postgres'
    | 'csvRead'
    | 'dataCleaner'
    | 'analysisEngine'
    | 'mongoDbStorage'
    | 'dashboardPortal';

export interface NodeProps {
    id: string;
    type: NodeTypeValue;
    data: NodeData;
    position: NodePosition;
}

export interface Edge {
    source: string;
    target: string;
    id: string;
    sourceHandle?: string; // for IF/ELSE branching
}

export type StickyNoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export interface StickyNote {
    id: string;
    content: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    color: StickyNoteColor;
    zIndex?: number;
}

export interface WorkflowProps {
    id: string;
    name: string;
    description?: string;
    nodes: NodeProps[];
    edges: Edge[];
    stickyNotes?: StickyNote[];
    createdAt?: string;
    updatedAt?: string;
}

// Backwards-compatible alias used across the repo
export type Workflow = WorkflowProps;

// Node type definitions
export const NODE_TYPES = {
    // Triggers
    WEBHOOK: 'webhook',
    SCHEDULE: 'schedule',

    // Core Logic
    JAVASCRIPT: 'javascript',
    CONDITIONAL: 'conditional',
    DELAY: 'delay',
    SET: 'set',
    FILTER: 'filter',
    MERGE: 'merge',
    SPLIT_BATCHES: 'splitBatches',

    // HTTP & APIs
    HTTP: 'http',

    // Communication
    SLACK: 'slack',
    EMAIL: 'email',
    EMAIL_DISCOVERY: 'emailDiscovery',
    EMAIL_SENDING: 'emailSending',
    SCHEDULED_EMAIL: 'scheduledEmail',
    WHATSAPP: 'whatsapp',
    TELEGRAM: 'telegram',
    DISCORD: 'discord',

    // Data & Storage
    GOOGLE_SHEETS: 'googleSheets',
    AIRTABLE: 'airtable',
    NOTION: 'notion',
    MYSQL: 'mysql',
    POSTGRES: 'postgres',
    CSV_READ: 'csvRead',
    MDB_STORAGE: 'mongoDbStorage',

    // Analysis
    DATA_CLEANER: 'dataCleaner',
    ANALYSIS_ENGINE: 'analysisEngine',
    DASHBOARD_PORTAL: 'dashboardPortal',

    // AI
    OPENAI: 'openai',
};

// Node configuration interface
export interface NodeConfig {
    type: NodeTypeValue;
    label: string;
    icon: string;
    color: string;
    description: string;
    category: NodeCategory;
}

// Node categories for organization
export type NodeCategory =
    | 'triggers'
    | 'logic'
    | 'communication'
    | 'data'
    | 'ai'
    | 'http'
    | 'analysis';

// ============================================
// Node-specific configuration interfaces
// ============================================

// Schedule Trigger Configuration
export interface ScheduleConfig {
    mode: 'interval' | 'cron' | 'specific';
    interval?: {
        value: number;
        unit: 'minutes' | 'hours' | 'days' | 'weeks';
    };
    cronExpression?: string;
    specificTimes?: {
        days: string[]; // ['monday', 'tuesday', etc.]
        time: string; // HH:MM format
        timezone: string;
    };
    enabled: boolean;
}

// Email Configuration
export interface EmailConfig {
    operation: 'send' | 'sendTemplate';
    smtp?: {
        host: string;
        port: number;
        secure: boolean;
        username: string;
        password: string;
    };
    from: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    bodyType: 'text' | 'html';
    attachments?: string[];
    replyTo?: string;
}

// Slack Configuration
export interface SlackConfig {
    operation: 'sendMessage' | 'uploadFile' | 'updateMessage' | 'createChannel';
    channel: string;
    message?: string;
    username?: string;
    iconEmoji?: string;
    blocks?: any[]; // Slack Block Kit
    threadTs?: string;
    token: string;
}

// WhatsApp Configuration
export interface WhatsAppConfig {
    operation: 'sendMessage' | 'sendTemplate' | 'sendMedia';
    phoneNumber: string;
    message?: string;
    templateName?: string;
    templateParams?: Record<string, string>;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'document' | 'audio';
    apiToken: string;
    phoneNumberId: string;
}

// Telegram Configuration
export interface TelegramConfig {
    operation: 'sendMessage' | 'sendPhoto' | 'sendDocument' | 'sendLocation';
    chatId: string;
    message?: string;
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disableNotification?: boolean;
    replyToMessageId?: string;
    photoUrl?: string;
    documentUrl?: string;
    latitude?: number;
    longitude?: number;
    botToken: string;
}

// Discord Configuration
export interface DiscordConfig {
    operation: 'sendMessage' | 'sendEmbed' | 'createChannel';
    webhookUrl?: string;
    channelId?: string;
    message?: string;
    username?: string;
    avatarUrl?: string;
    embed?: {
        title?: string;
        description?: string;
        color?: number;
        fields?: { name: string; value: string; inline?: boolean }[];
        thumbnail?: string;
        image?: string;
    };
    botToken?: string;
}

// Google Sheets Configuration
export interface GoogleSheetsConfig {
    operation: 'append' | 'read' | 'update' | 'delete' | 'lookup';
    spreadsheetId: string;
    sheetName: string;
    range?: string;
    values?: any[][];
    lookupColumn?: string;
    lookupValue?: string;
    credentials: {
        type: 'oauth' | 'serviceAccount';
        accessToken?: string;
        serviceAccountKey?: string;
    };
}

// Airtable Configuration
export interface AirtableConfig {
    operation: 'create' | 'read' | 'update' | 'delete' | 'list';
    baseId: string;
    tableId: string;
    recordId?: string;
    fields?: Record<string, any>;
    filterByFormula?: string;
    maxRecords?: number;
    apiKey: string;
}

// Notion Configuration
export interface NotionConfig {
    operation: 'createPage' | 'updatePage' | 'getPage' | 'queryDatabase' | 'createDatabase';
    databaseId?: string;
    pageId?: string;
    properties?: Record<string, any>;
    content?: any[]; // Notion blocks
    filter?: any;
    sorts?: any[];
    integrationToken: string;
}

// OpenAI Configuration
export interface OpenAIConfig {
    operation: 'chat' | 'complete' | 'image' | 'embedding' | 'moderation';
    model: string;
    prompt?: string;
    messages?: { role: 'system' | 'user' | 'assistant'; content: string }[];
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    imagePrompt?: string;
    imageSize?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    apiKey: string;
}

// HTTP Request Configuration (extended)
export interface HTTPConfig {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
    url: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: any;
    bodyType?: 'json' | 'form' | 'formData' | 'raw' | 'binary';
    authentication?: {
        type: 'none' | 'basicAuth' | 'bearerToken' | 'oauth2' | 'apiKey';
        username?: string;
        password?: string;
        token?: string;
        apiKey?: string;
        apiKeyHeader?: string;
    };
    timeout?: number;
    followRedirects?: boolean;
    validateSSL?: boolean;
    responseType?: 'json' | 'text' | 'binary' | 'arraybuffer';
}

// Set/Transform Configuration
export interface SetConfig {
    mode: 'manual' | 'expression';
    fields: {
        name: string;
        value: any;
        type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    }[];
    keepOnlySet?: boolean;
    dotNotation?: boolean;
}

// Filter Configuration
export interface FilterConfig {
    conditions: {
        field: string;
        operator: 'equals' | 'notEquals' | 'contains' | 'notContains' |
        'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' |
        'greaterOrEqual' | 'lessOrEqual' | 'isEmpty' | 'isNotEmpty' |
        'regex' | 'isTrue' | 'isFalse';
        value: any;
    }[];
    combineConditions: 'AND' | 'OR';
}

// Merge Configuration
export interface MergeConfig {
    mode: 'append' | 'combine' | 'chooseBranch' | 'mergeByKey';
    mergeKey?: string;
    outputField?: string;
}

// Split in Batches Configuration
export interface SplitBatchesConfig {
    batchSize: number;
    options: {
        resetOnError: boolean;
    };
}

// MySQL Configuration
export interface MySQLConfig {
    operation: 'select' | 'insert' | 'update' | 'delete' | 'executeQuery';
    table?: string;
    columns?: string[];
    values?: Record<string, any>;
    where?: string;
    query?: string;
    connection: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl?: boolean;
    };
}

// PostgreSQL Configuration
export interface PostgresConfig {
    operation: 'select' | 'insert' | 'update' | 'delete' | 'executeQuery';
    table?: string;
    columns?: string[];
    values?: Record<string, any>;
    where?: string;
    query?: string;
    connection: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl?: boolean;
    };
}