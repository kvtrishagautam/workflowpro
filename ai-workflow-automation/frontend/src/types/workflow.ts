export type NodeType =
  | 'webhook'
  | 'conditional'
  | 'http'
  | 'delay'
  | 'slack'
  | 'javascript'
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
  | 'postgres';

export interface WorkflowNodeData {
  id: string;
  type: NodeType;
  config: Record<string, any>;
}

export interface WorkflowEdge {
  source: string;
  target: string;
  sourceHandle?: string; // for IF/ELSE branching
}

export interface Workflow {
  id?: string;
  nodes: WorkflowNodeData[];
  edges: WorkflowEdge[];
}
