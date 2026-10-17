import { Incident, IncidentDetail, Alert, ResourceItem, AuditEvent, DashboardMetrics } from './types';

// Intelligent base URL resolution that prioritizes 127.0.0.1 over localhost to prevent Windows IPv6 DNS drops
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
    return `http://${host}:8000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
}

export function getWsBase(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'ws://127.0.0.1:8000';
    }
    return `ws://${host}:8000`;
  }
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
}

export const API_BASE = getApiBase();
export const WS_BASE = getWsBase();

/**
 * Resilient fetch wrapper with dual IPv4/IPv6 localhost retry and graceful fallbacks.
 * Prevents Next.js dev overlay "Failed to fetch" modal from triggering during server reload.
 */
async function safeFetch<T>(endpoint: string, options?: RequestInit, fallback?: T): Promise<T> {
  const base = getApiBase();
  const primaryUrl = `${base}${endpoint}`;

  try {
    const res = await fetch(primaryUrl, {
      ...options,
      cache: 'no-store'
    });
    if (!res.ok) {
      console.warn(`[API WARN] ${endpoint} returned ${res.status}: ${res.statusText}`);
      if (fallback !== undefined) return fallback;
      throw new Error(`API error ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    // Attempt alternate host retry (127.0.0.1 <-> localhost)
    try {
      const altHost = base.includes('127.0.0.1') ? 'http://localhost:8000' : 'http://127.0.0.1:8000';
      const altRes = await fetch(`${altHost}${endpoint}`, {
        ...options,
        cache: 'no-store'
      });
      if (altRes.ok) {
        return await altRes.json();
      }
    } catch {
      // Alternate retry also failed
    }

    console.warn(`[API Offline Fallback] ${endpoint} temporarily unreachable:`, err?.message || err);
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

export async function fetchIncidents(params?: { hazard_type?: string; severity?: string; status?: string }): Promise<Incident[]> {
  const query = new URLSearchParams();
  if (params?.hazard_type) query.append('hazard_type', params.hazard_type);
  if (params?.severity) query.append('severity', params.severity);
  if (params?.status) query.append('status', params.status);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return safeFetch<Incident[]>(`/api/incidents${qs}`, undefined, []);
}

export async function fetchIncidentDetail(id: string): Promise<IncidentDetail | null> {
  return safeFetch<IncidentDetail | null>(`/api/incidents/${id}`, undefined, null);
}

export async function submitIncident(payload: {
  hazard_type: string;
  location: { latitude: number; longitude: number; address?: string; region?: string };
  severity: string;
  source: string;
  description: string;
  metadata?: any;
}): Promise<any> {
  return safeFetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function triggerAnalysis(id: string): Promise<any> {
  return safeFetch(`/api/incidents/${id}/analyze`, { method: 'POST' });
}

export async function fetchAlerts(state?: string): Promise<Alert[]> {
  const query = state ? `?state=${state}` : '';
  return safeFetch<Alert[]>(`/api/alerts${query}`, undefined, []);
}

export async function acknowledgeAlert(alertId: string, operatorName: string = 'EOC Commander'): Promise<any> {
  return safeFetch(`/api/alerts/${alertId}/ack?operator_name=${encodeURIComponent(operatorName)}`, {
    method: 'POST'
  });
}

export async function resolveAlert(alertId: string, operatorName: string = 'EOC Commander'): Promise<any> {
  return safeFetch(`/api/alerts/${alertId}/resolve?operator_name=${encodeURIComponent(operatorName)}`, {
    method: 'POST'
  });
}

export async function fetchResources(): Promise<ResourceItem[]> {
  return safeFetch<ResourceItem[]>('/api/resources', undefined, []);
}

export async function reviewRecommendation(
  recId: string,
  decision: 'approved' | 'rejected' | 'modified',
  reviewedBy: string = 'EOC Incident Commander',
  reviewNotes: string = '',
  modifiedAction?: string
): Promise<any> {
  return safeFetch(`/api/recommendations/${recId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decision,
      reviewed_by: reviewedBy,
      review_notes: reviewNotes,
      modified_action: modifiedAction
    })
  });
}

export async function fetchAuditEvents(limit: number = 30): Promise<AuditEvent[]> {
  return safeFetch<AuditEvent[]>(`/api/audit?limit=${limit}`, undefined, []);
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const defaultMetrics: DashboardMetrics = {
    total_active_incidents: 0,
    critical_incidents: 0,
    high_incidents: 0,
    active_alerts: 0,
    pending_approvals: 0,
    safety_overrides_triggered: 0,
    resource_capacity: {
      total: 0,
      available: 0,
      deployed_pct: 0
    },
    average_agent_latency_ms: 0
  };
  return safeFetch<DashboardMetrics>('/api/metrics', undefined, defaultMetrics);
}

export async function fetchScenarios(): Promise<any[]> {
  return safeFetch<any[]>('/api/simulator/scenarios', undefined, []);
}

export async function triggerScenario(scenarioKey: string): Promise<any> {
  return safeFetch('/api/simulator/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_key: scenarioKey })
  });
}

export async function fetchWeather(lat: number, lon: number): Promise<any> {
  return safeFetch<any>(`/api/weather?latitude=${lat}&longitude=${lon}`, undefined, null);
}
