import { Incident, IncidentDetail, Alert, ResourceItem, AuditEvent, DashboardMetrics } from './types';

// Intelligent base URL resolution supporting both local development and Vercel cloud deployment
export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
    // In production Vercel deployment without NEXT_PUBLIC_API_URL, use relative path
    return '';
  }
  return 'http://127.0.0.1:8000';
}

export function getWsBase(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'ws://127.0.0.1:8000';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${host}`;
  }
  return 'ws://127.0.0.1:8000';
}

export const API_BASE = getApiBase();
export const WS_BASE = getWsBase();

/**
 * Resilient fetch wrapper with dual IPv4/IPv6 localhost retry and graceful fallbacks.
 * Prevents Next.js dev overlay "Failed to fetch" modal from triggering during server reload.
 */
async function safeFetch<T>(endpoint: string, options?: RequestInit, fallback?: T): Promise<T> {
  const base = getApiBase();
  const primaryUrl = base ? `${base}${endpoint}` : endpoint;

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
    // Attempt alternate host retry only if running on local backend
    if (base && (base.includes('127.0.0.1') || base.includes('localhost'))) {
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
    }

    console.warn(`[API Offline Fallback] ${endpoint} temporarily unreachable:`, err?.message || err);
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

import {
  getStoreIncidents,
  getStoreIncidentDetail,
  getStoreResources,
  getStoreAlerts,
  getStoreMetrics,
  getStoreAudit,
  addStoreIncident
} from './mockStore';

export async function fetchIncidents(params?: { hazard_type?: string; severity?: string; status?: string }): Promise<Incident[]> {
  const query = new URLSearchParams();
  if (params?.hazard_type) query.append('hazard_type', params.hazard_type);
  if (params?.severity) query.append('severity', params.severity);
  if (params?.status) query.append('status', params.status);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return safeFetch<Incident[]>(`/api/incidents${qs}`, undefined, getStoreIncidents());
}

export async function fetchIncidentDetail(id: string): Promise<IncidentDetail | null> {
  return safeFetch<IncidentDetail | null>(`/api/incidents/${id}`, undefined, getStoreIncidentDetail(id));
}

export async function submitIncident(payload: {
  hazard_type: string;
  location: { latitude: number; longitude: number; address?: string; region?: string };
  severity: string;
  source: string;
  description: string;
  metadata?: any;
}): Promise<any> {
  try {
    return await safeFetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    return addStoreIncident(payload);
  }
}

export async function triggerAnalysis(id: string): Promise<any> {
  return safeFetch(`/api/incidents/${id}/analyze`, { method: 'POST' }, { status: 'success', incident_id: id });
}

export async function fetchAlerts(state?: string): Promise<Alert[]> {
  const query = state ? `?state=${state}` : '';
  return safeFetch<Alert[]>(`/api/alerts${query}`, undefined, getStoreAlerts());
}

export async function acknowledgeAlert(alertId: string, operatorName: string = 'EOC Commander'): Promise<any> {
  return safeFetch(`/api/alerts/${alertId}/ack?operator_name=${encodeURIComponent(operatorName)}`, {
    method: 'POST'
  }, { status: 'acknowledged', alert_id: alertId, acknowledged_by: operatorName });
}

export async function resolveAlert(alertId: string, operatorName: string = 'EOC Commander'): Promise<any> {
  return safeFetch(`/api/alerts/${alertId}/resolve?operator_name=${encodeURIComponent(operatorName)}`, {
    method: 'POST'
  }, { status: 'resolved', alert_id: alertId });
}

export async function fetchResources(): Promise<ResourceItem[]> {
  return safeFetch<ResourceItem[]>('/api/resources', undefined, getStoreResources());
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
  }, { status: 'success', decision, recommendation_id: recId });
}

export async function fetchAuditEvents(limit: number = 30): Promise<AuditEvent[]> {
  return safeFetch<AuditEvent[]>(`/api/audit?limit=${limit}`, undefined, getStoreAudit());
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  return safeFetch<DashboardMetrics>('/api/metrics', undefined, getStoreMetrics());
}

export async function fetchScenarios(): Promise<any[]> {
  const defaultScenarios = [
    {
      key: 'flash_flood_subarnarekha',
      title: 'Subarnarekha River Flash Surge (78mm/h)',
      severity: 'critical',
      description: 'Torrential rainfall causing rapid embankment inundation in Namkum Basin'
    },
    {
      key: 'dam_overflow_dhurwa',
      title: 'Dhurwa Dam Emergency Sluice Release',
      severity: 'critical',
      description: 'Controlled 12,000 cusecs spillway release threatening downstream bridge piers'
    },
    {
      key: 'cyclone_wind_damage',
      title: 'Cyclone Impact: High Winds & Power Grid Grounding',
      severity: 'high',
      description: 'Gale force winds of 85 km/h bringing down electric feeders across Harmu'
    }
  ];
  return safeFetch<any[]>('/api/simulator/scenarios', undefined, defaultScenarios);
}

export async function triggerScenario(scenarioKey: string): Promise<any> {
  return safeFetch('/api/simulator/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_key: scenarioKey })
  }, { status: 'injected', scenario_key: scenarioKey });
}

export async function fetchWeather(lat: number, lon: number): Promise<any> {
  const defaultWeather = {
    current: {
      temperature_2m: 28.4,
      relative_humidity_2m: 92,
      precipitation: 76.5,
      weather_code: 65,
      wind_speed_10m: 34.2
    }
  };
  return safeFetch<any>(`/api/weather?latitude=${lat}&longitude=${lon}`, undefined, defaultWeather);
}
