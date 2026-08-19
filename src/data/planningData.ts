export type InitiativeStatus = 'planning' | 'active' | 'complete' | 'blocked';
export type MilestoneType = 'deadline' | 'launch' | 'review' | 'release';

export interface Milestone {
  id: string;
  title: string;
  month: number;
  type: MilestoneType;
}

export interface Initiative {
  id: string;
  title: string;
  team: string;
  color: string;
  textColor: string;
  startMonth: number;
  endMonth: number;
  row: number;
  dependencies: string[];
  milestones: Milestone[];
  status: InitiativeStatus;
  description: string;
  owner: string;
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const YEAR = 2026;

export const MONTH_BAND_COLORS = [
  '#EAE6F5', '#F5E6EB', '#E6F2EB', '#F5EDE3', '#E3EDF5', '#F5F2DC',
  '#F5E3ED', '#E3F0E8', '#E6EAF5', '#F5E9DC', '#DCF0F5', '#F2EDD8',
];

export const WASHI_PALETTE: Array<{ bg: string; text: string }> = [
  { bg: '#B8D4B8', text: '#1A3A1A' }, { bg: '#E8A8B4', text: '#5A1C26' },
  { bg: '#A8BEE0', text: '#182A52' }, { bg: '#E8B090', text: '#5A260E' },
  { bg: '#C4B2E0', text: '#2A1A52' }, { bg: '#8CCCC0', text: '#0A2E26' },
  { bg: '#F0C898', text: '#5A360E' }, { bg: '#B8C0E8', text: '#181E4E' },
  { bg: '#C8CE8A', text: '#282E0E' }, { bg: '#D4A8BC', text: '#481636' },
];

export const MILESTONE_COLORS: Record<MilestoneType, string> = {
  deadline: '#CC5555', launch: '#5A9E6A', review: '#8A5EBE', release: '#B87820',
};

export const STATUS_STYLES: Record<InitiativeStatus, { bg: string; text: string; label: string }> = {
  planning: { bg: '#EAE6F5', text: '#2A1A52', label: 'Planning' },
  active: { bg: '#E6F2EB', text: '#1A3A1A', label: 'Active' },
  complete: { bg: '#ECEAE6', text: '#4A3A2A', label: 'Complete' },
  blocked: { bg: '#F5E6EB', text: '#5A1C26', label: 'Blocked' },
};

export const newId = () => Math.random().toString(36).slice(2, 9);

export const INITIAL_INITIATIVES: Initiative[] = [
  { id: 'i1', title: 'Platform Observability', team: 'Platform', color: '#B8D4B8', textColor: '#1A3A1A', startMonth: 0, endMonth: 3, row: 0, dependencies: [], milestones: [{ id: 'm1a', title: 'Metrics baseline', month: 1, type: 'review' }, { id: 'm1b', title: 'Full rollout', month: 3, type: 'launch' }], status: 'active', description: 'Unified observability stack: traces, metrics, and logs across all services. Replacing fragmented tooling with a cohesive platform built on OpenTelemetry.', owner: 'Priya Agarwal' },
  { id: 'i2', title: 'Auth & Identity Overhaul', team: 'Security', color: '#E8A8B4', textColor: '#5A1C26', startMonth: 1, endMonth: 4, row: 1, dependencies: ['i1'], milestones: [{ id: 'm2a', title: 'SSO MVP', month: 2, type: 'deadline' }, { id: 'm2b', title: 'GA release', month: 4, type: 'release' }], status: 'active', description: 'Migrate to federated identity with OIDC/SAML support. Deprecate legacy auth tokens and introduce mandatory MFA for all admin accounts.', owner: 'Marcus Chen' },
  { id: 'i3', title: 'Data Warehouse Migration', team: 'Data', color: '#A8BEE0', textColor: '#182A52', startMonth: 0, endMonth: 5, row: 2, dependencies: [], milestones: [{ id: 'm3a', title: 'Snowflake cutover', month: 4, type: 'deadline' }], status: 'active', description: 'Move from Redshift to Snowflake. Re-model dimensional schema and migrate 3 years of historical data. ETL pipelines rebuilt entirely in dbt.', owner: 'Anita Osei' },
  { id: 'i4', title: 'Mobile Redesign — iOS', team: 'Product', color: '#F0C898', textColor: '#5A360E', startMonth: 2, endMonth: 6, row: 3, dependencies: ['i2'], milestones: [{ id: 'm4a', title: 'Design review', month: 3, type: 'review' }, { id: 'm4b', title: 'Beta launch', month: 5, type: 'launch' }, { id: 'm4c', title: 'App Store release', month: 6, type: 'release' }], status: 'planning', description: 'Full native redesign of the iOS app. New navigation architecture, SwiftUI migration, and updated component library aligned with the brand refresh.', owner: 'Sophie Larkin' },
  { id: 'i5', title: 'ML Feature Store', team: 'ML Platform', color: '#C4B2E0', textColor: '#2A1A52', startMonth: 3, endMonth: 7, row: 4, dependencies: ['i3'], milestones: [{ id: 'm5a', title: 'Feast integration', month: 5, type: 'review' }, { id: 'm5b', title: 'Production ready', month: 7, type: 'release' }], status: 'planning', description: 'Centralised feature store for ML teams. Online and offline serving, feature lineage tracking, and A/B experiment integration.', owner: 'Ravi Patel' },
  { id: 'i6', title: 'API Gateway v2', team: 'Platform', color: '#8CCCC0', textColor: '#0A2E26', startMonth: 4, endMonth: 8, row: 5, dependencies: ['i1', 'i2'], milestones: [{ id: 'm6a', title: 'Rate limiting GA', month: 6, type: 'deadline' }, { id: 'm6b', title: 'v2 complete', month: 8, type: 'release' }], status: 'planning', description: 'Replace Kong with Envoy-based gateway. Adds GraphQL federation, per-client rate limiting, and WASM plugin support.', owner: 'James Okafor' },
  { id: 'i7', title: 'Real-time Analytics Pipeline', team: 'Data', color: '#E8B090', textColor: '#5A260E', startMonth: 5, endMonth: 9, row: 6, dependencies: ['i3', 'i5'], milestones: [{ id: 'm7a', title: 'Kafka topology freeze', month: 7, type: 'deadline' }], status: 'planning', description: 'Stream processing with Kafka + Flink to power real-time dashboards and event-driven ML inference. Target <500ms end-to-end latency.', owner: 'Anita Osei' },
  { id: 'i8', title: 'Checkout Optimisation', team: 'Growth', color: '#D4A8BC', textColor: '#481636', startMonth: 6, endMonth: 9, row: 7, dependencies: ['i6'], milestones: [{ id: 'm8a', title: 'A/B test start', month: 7, type: 'review' }, { id: 'm8b', title: 'Full rollout', month: 9, type: 'launch' }], status: 'planning', description: 'Reduce checkout drop-off by 20%. One-tap payment, address autofill, and dynamic discount application. Coordinated with mobile redesign.', owner: 'Leila Nasser' },
  { id: 'i9', title: 'GDPR Compliance Audit', team: 'Legal / Eng', color: '#C8CE8A', textColor: '#282E0E', startMonth: 7, endMonth: 10, row: 8, dependencies: [], milestones: [{ id: 'm9a', title: 'External audit', month: 9, type: 'deadline' }, { id: 'm9b', title: 'Remediation done', month: 10, type: 'release' }], status: 'planning', description: 'Annual GDPR compliance review. Data inventory, DPIAs for new features, right-to-erasure pipeline hardening, and DPA updates for EU vendors.', owner: 'Marcus Chen' },
  { id: 'i10', title: 'Design System v3', team: 'Design Eng', color: '#B8C0E8', textColor: '#181E4E', startMonth: 8, endMonth: 11, row: 9, dependencies: ['i4'], milestones: [{ id: 'm10a', title: 'Token publish', month: 9, type: 'review' }, { id: 'm10b', title: 'v3 stable', month: 11, type: 'release' }], status: 'planning', description: 'Major overhaul of the component library. New token system, dark mode support, WCAG 2.2 AA compliance, and Storybook 8 migration.', owner: 'Sophie Larkin' },
];
