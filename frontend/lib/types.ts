export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  region?: string;
}

export interface RiskAssessment {
  incident_id: string;
  composite_score: number;
  severity_band: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  hazard_score: number;
  exposure_score: number;
  vulnerability_score: number;
  data_freshness_score: number;
  calculation_formula: string;
  contributing_factors: string[];
  hard_safety_rule_triggered: boolean;
  safety_override_reason?: string;
  assessed_at: string;
  model_version: string;
}

export interface RequiredResource {
  resource_type: string;
  quantity: number;
  notes?: string;
}

export interface Recommendation {
  id: string;
  incident_id: string;
  action_type: string;
  proposed_action: string;
  priority: 'IMMEDIATE' | 'HIGH' | 'STANDARD';
  required_resources: RequiredResource[];
  evidence_references: string[];
  required_approvals: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'modified';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export interface Incident {
  incident_id: string;
  hazard_type: string;
  location: Location;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reported_at: string;
  source: string;
  verification_status: string;
  description: string;
  duplicate_of?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  risk_assessment?: {
    composite_score: number;
    severity_band: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    hard_safety_rule_triggered: boolean;
    safety_override_reason?: string;
  } | null;
}

export interface AgentRun {
  run_id: string;
  incident_id: string;
  agent_name: string;
  status: 'success' | 'fallback' | 'failed';
  latency_ms: number;
  output: any;
  created_at: string;
}

export interface IncidentDetail {
  incident: Incident;
  risk_assessment?: RiskAssessment | null;
  recommendations: Recommendation[];
  agent_runs: AgentRun[];
}

export interface Alert {
  id: string;
  incident_id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  state: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface ResourceItem {
  id: string;
  name: string;
  resource_type: string;
  capacity: number;
  available_capacity: number;
  location: Location;
  status: 'available' | 'deployed' | 'maintenance';
  contact: string;
  last_updated: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  event_type: string;
  timestamp: string;
  details: any;
  record_ids: string[];
}

export interface DashboardMetrics {
  total_active_incidents: number;
  critical_incidents: number;
  high_incidents: number;
  active_alerts: number;
  pending_approvals: number;
  safety_overrides_triggered: number;
  resource_capacity: {
    total: number;
    available: number;
    deployed_pct: number;
  };
  average_agent_latency_ms: number;
}
