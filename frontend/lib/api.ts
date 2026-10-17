import { Incident, IncidentDetail, Alert, ResourceItem, AuditEvent, DashboardMetrics } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export async function fetchIncidents(params?: { hazard_type?: string; severity?: string; status?: string }): Promise<Incident[]> {
  const query = new URLSearchParams();
  if (params?.hazard_type) query.append('hazard_type', params.hazard_type);
  if (params?.severity) query.append('severity', params.severity);
  if (params?.status) query.append('status', params.status);

  const res = await fetch(`${API_BASE}/api/incidents?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function fetchIncidentDetail(id: string): Promise<IncidentDetail> {
  const res = await fetch(`${API_BASE}/api/incidents/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch incident ${id}`);
  return res.json();
}

export async function submitIncident(payload: {
  hazard_type: string;
  location: { latitude: number; longitude: number; address?: string; region?: string };
  severity: string;
  source: string;
  description: string;
  metadata?: any;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to submit incident');
  return res.json();
}

export async function triggerAnalysis(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/incidents/${id}/analyze`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger AI workflow analysis');
  return res.json();
}

export async function fetchAlerts(state?: string): Promise<Alert[]> {
  const query = state ? `?state=${state}` : '';
  const res = await fetch(`${API_BASE}/api/alerts${query}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function acknowledgeAlert(alertId: string, operatorName: string = 'EOC Commander'): Promise<any> {
  const res = await fetch(`${API_BASE}/api/alerts/${alertId}/ack?operator_name=${encodeURIComponent(operatorName)}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to acknowledge alert');
  return res.json();
}

export async function resolveAlert(alertId: string, operatorName: string = 'EOC Commander'): Promise<any> {
  const res = await fetch(`${API_BASE}/api/alerts/${alertId}/resolve?operator_name=${encodeURIComponent(operatorName)}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to resolve alert');
  return res.json();
}

export async function fetchResources(): Promise<ResourceItem[]> {
  const res = await fetch(`${API_BASE}/api/resources`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch resources');
  return res.json();
}

export async function reviewRecommendation(
  recId: string,
  decision: 'approved' | 'rejected' | 'modified',
  reviewedBy: string = 'EOC Incident Commander',
  reviewNotes: string = '',
  modifiedAction?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/recommendations/${recId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision,
      reviewed_by: reviewedBy,
      review_notes: reviewNotes,
      modified_action: modifiedAction
    })
  });
  if (!res.ok) throw new Error('Failed to submit review decision');
  return res.json();
}

export async function fetchAuditEvents(limit: number = 30): Promise<AuditEvent[]> {
  const res = await fetch(`${API_BASE}/api/audit?limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch audit records');
  return res.json();
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${API_BASE}/api/metrics`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function fetchScenarios(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/simulator/scenarios`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function triggerScenario(scenarioKey: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/simulator/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_key: scenarioKey })
  });
  if (!res.ok) throw new Error('Failed to trigger simulated scenario');
  return res.json();
}

export async function fetchWeather(lat: number, lon: number): Promise<any> {
  const res = await fetch(`${API_BASE}/api/weather?latitude=${lat}&longitude=${lon}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}
