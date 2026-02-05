export type NodeType =
  | 'webhook'
  | 'conditional'
  | 'http'
  | 'delay'
  | 'slack'
  | 'javascript'
  | 'schedule'
  | 'email'
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
  | 'postgres';

export interface WorkflowNodeData {
  id: string;
  type: NodeType;
  config: Record<string, any>;
  position?: { x: number; y: number };
  data?: { label?: string; config?: Record<string, any> }; // Support nested data if needed
}

export interface WorkflowEdge {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string; // for IF/ELSE branching
}

export interface Workflow {
  id?: string;
  name?: string;
  description?: string;
  isTemplate?: boolean;
  nodes: WorkflowNodeData[];
  edges: WorkflowEdge[];
  webhookUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
