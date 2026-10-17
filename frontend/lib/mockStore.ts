import { Incident, IncidentDetail, Alert, ResourceItem, AuditEvent, DashboardMetrics, Recommendation, RiskAssessment, AgentRun } from './types';

// Initial realistic disaster incidents across Ranchi & Subarnarekha River Basin
export const INITIAL_INCIDENTS: Incident[] = [
  {
    incident_id: 'INC-F392',
    hazard_type: 'flash_flood',
    location: {
      latitude: 23.362,
      longitude: 85.312,
      address: 'Subarnarekha Low-Lying Riverfront, Namkum Basin',
      region: 'Subarnarekha Catchment'
    },
    severity: 'critical',
    reported_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    source: 'hydrological_sensor',
    verification_status: 'verified_primary',
    description: 'Rapid inundation along low-lying riverbank. Water level rose 1.8 meters in 45 minutes. Over 60 residential houses partially submerged; families stranded on rooftops.',
    duplicate_of: null,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updated_at: new Date().toISOString(),
    risk_assessment: {
      composite_score: 86.4,
      severity_band: 'CRITICAL',
      hard_safety_rule_triggered: true,
      safety_override_reason: 'RIVER_LEVEL_CRITICAL_SURGE (>1.5m rise in 1h)'
    }
  },
  {
    incident_id: 'INC-D8C7',
    hazard_type: 'flash_flood',
    location: {
      latitude: 23.345,
      longitude: 85.305,
      address: 'Harmu River Low-Level Causeway & Chutia Basti',
      region: 'Harmu Sub-Basin'
    },
    severity: 'critical',
    reported_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    source: 'drone_reconnaissance',
    verification_status: 'verified_primary',
    description: 'Harmu river overflow breached retaining wall. Torrential runoff entering ground floor of 85+ tenements; power transformer sparking under water.',
    duplicate_of: null,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updated_at: new Date().toISOString(),
    risk_assessment: {
      composite_score: 91.2,
      severity_band: 'CRITICAL',
      hard_safety_rule_triggered: true,
      safety_override_reason: 'ELECTRICAL_HAZARD_UNDERWATER_INUNDATION'
    }
  },
  {
    incident_id: 'INC-660D',
    hazard_type: 'river_inundation',
    location: {
      latitude: 23.382,
      longitude: 85.325,
      address: 'Morabadi Lowland Waterway & Stadium Approach',
      region: 'Ranchi North'
    },
    severity: 'high',
    reported_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    source: 'citizen_sos_call',
    verification_status: 'verified_primary',
    description: 'Extreme urban runoff from surrounding plateau converging on residential lanes. Water depth 1.1m; 12 elderly residents require high-ground transport.',
    duplicate_of: null,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updated_at: new Date().toISOString(),
    risk_assessment: {
      composite_score: 78.5,
      severity_band: 'HIGH',
      hard_safety_rule_triggered: false
    }
  },
  {
    incident_id: 'INC-DH01',
    hazard_type: 'dam_overflow',
    location: {
      latitude: 23.298,
      longitude: 85.285,
      address: 'Dhurwa Dam Sluice Channel Downstream Settlement',
      region: 'Dhurwa Catchment'
    },
    severity: 'critical',
    reported_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    source: 'dam_safety_telemetry',
    verification_status: 'verified_primary',
    description: 'Controlled emergency discharge initiated (12,000 cusecs). Downstream embankment soil erosion progressing rapidly near bridge pier 4.',
    duplicate_of: null,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    updated_at: new Date().toISOString(),
    risk_assessment: {
      composite_score: 94.0,
      severity_band: 'CRITICAL',
      hard_safety_rule_triggered: true,
      safety_override_reason: 'STRUCTURAL_EROSION_ADJACENT_BRIDGE_PIER'
    }
  },
  {
    incident_id: 'INC-NK02',
    hazard_type: 'industrial_hazard',
    location: {
      latitude: 23.342,
      longitude: 85.385,
      address: 'Namkum Industrial Corridor Chemical Depot Yard',
      region: 'Namkum Sub-Division'
    },
    severity: 'high',
    reported_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    source: 'industrial_fire_dispatch',
    verification_status: 'verified_primary',
    description: 'Stormwater flooding submerged chlorine drum storage platform. Precautionary cordon required within 400m perimeter.',
    duplicate_of: null,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updated_at: new Date().toISOString(),
    risk_assessment: {
      composite_score: 82.0,
      severity_band: 'HIGH',
      hard_safety_rule_triggered: true,
      safety_override_reason: 'CHEMICAL_HAZARD_PROXIMITY_CORDON'
    }
  },
  {
    incident_id: 'INC-KK03',
    hazard_type: 'flash_flood',
    location: {
      latitude: 23.415,
      longitude: 85.320,
      address: 'Kanke Dam Spillway Overflow Margin',
      region: 'Kanke Catchment'
    },
    severity: 'medium',
    reported_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    source: 'irrigation_dept_report',
    verification_status: 'verified_primary',
    description: 'Reservoir full supply level reached; surface runoff overflowing secondary canal into agricultural lowlands.',
    duplicate_of: null,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    updated_at: new Date().toISOString(),
    risk_assessment: {
      composite_score: 65.0,
      severity_band: 'MEDIUM',
      hard_safety_rule_triggered: false
    }
  },
  {
    incident_id: 'INC-DR04',
    hazard_type: 'flash_flood',
    location: {
      latitude: 23.335,
      longitude: 85.328,
      address: 'Doranda Low-Lying Ward 14 Hinoo River Confluence',
      region: 'Ranchi South'
    },
    severity: 'critical',
    reported_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    source: 'police_patrol_vhf',
    verification_status: 'verified_primary',
    description: 'Backflow from Hinoo river submerging main market road under 1.4m of water. Traffic blocked, 4 buses marooned.',
    duplicate_of: null,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    risk_assessment: {
      composite_score: 88.5,
      severity_band: 'CRITICAL',
      hard_safety_rule_triggered: true,
      safety_override_reason: 'PRIMARY_TRANSIT_ARTERY_SUBMERGED'
    }
  },
  {
    incident_id: 'INC-BR05',
    hazard_type: 'urban_waterlogging',
    location: {
      latitude: 23.375,
      longitude: 85.355,
      address: 'Bariatu Road Medical Corridor Culvert',
      region: 'Ranchi East'
    },
    severity: 'medium',
    reported_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    source: 'traffic_management_cctv',
    verification_status: 'verified_primary',
    description: 'Debris blockage at primary stormwater culvert creating 0.6m localized waterlogging near ambulance entry gate.',
    duplicate_of: null,
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updated_at: new Date().toISOString(),
    risk_assessment: {
      composite_score: 58.0,
      severity_band: 'MEDIUM',
      hard_safety_rule_triggered: false
    }
  }
];

export const INITIAL_RESOURCES: ResourceItem[] = [
  {
    id: 'RES-101',
    name: 'NDRF 10th Battalion Unit Alpha',
    resource_type: 'ndrf_platoon',
    capacity: 45,
    available_capacity: 45,
    location: { latitude: 23.3500, longitude: 85.3250, address: 'Bariatu Relief Post, Ranchi', region: 'Ranchi Central' },
    status: 'available',
    contact: '+91-651-224411',
    last_updated: new Date().toISOString()
  },
  {
    id: 'RES-102',
    name: 'SDRF Fast Boat Rescue Team 1',
    resource_type: 'rescue_boat',
    capacity: 12,
    available_capacity: 10,
    location: { latitude: 23.3600, longitude: 85.3100, address: 'Subarnarekha Riverfront Depot', region: 'Subarnarekha Basin' },
    status: 'available',
    contact: '+91-651-224412',
    last_updated: new Date().toISOString()
  },
  {
    id: 'RES-103',
    name: 'Morabadi Community Relief Shelter',
    resource_type: 'evacuation_shelter',
    capacity: 500,
    available_capacity: 480,
    location: { latitude: 23.3850, longitude: 85.3200, address: 'Morabadi Indoor Stadium', region: 'Ranchi North' },
    status: 'available',
    contact: '+91-651-224413',
    last_updated: new Date().toISOString()
  },
  {
    id: 'RES-104',
    name: 'RIMS Emergency Medical Mobile Unit',
    resource_type: 'medical_team',
    capacity: 25,
    available_capacity: 25,
    location: { latitude: 23.3720, longitude: 85.3400, address: 'RIMS Medical Campus', region: 'Ranchi East' },
    status: 'available',
    contact: '+91-651-224414',
    last_updated: new Date().toISOString()
  },
  {
    id: 'RES-105',
    name: 'High-Capacity Dewatering Pump Unit A',
    resource_type: 'water_pump',
    capacity: 8,
    available_capacity: 8,
    location: { latitude: 23.3400, longitude: 85.3050, address: 'Municipal Works Yard, Doranda', region: 'Ranchi South' },
    status: 'available',
    contact: '+91-651-224415',
    last_updated: new Date().toISOString()
  },
  {
    id: 'RES-106',
    name: 'Disaster Reconnaissance Drone Squad',
    resource_type: 'emergency_drone',
    capacity: 4,
    available_capacity: 4,
    location: { latitude: 23.3440, longitude: 85.3090, address: 'Civil Defense HQ', region: 'Ranchi Central' },
    status: 'available',
    contact: '+91-651-224416',
    last_updated: new Date().toISOString()
  },
  {
    id: 'RES-107',
    name: 'Dhurwa Dam Emergency Evacuation Camp',
    resource_type: 'evacuation_shelter',
    capacity: 650,
    available_capacity: 650,
    location: { latitude: 23.2950, longitude: 85.2750, address: 'Sector 3 Community Hall, Dhurwa', region: 'Ranchi South-West' },
    status: 'available',
    contact: '+91-651-224417',
    last_updated: new Date().toISOString()
  },
  {
    id: 'RES-108',
    name: 'SDRF Inflatable Flood Rafts Team 2',
    resource_type: 'rescue_boat',
    capacity: 10,
    available_capacity: 10,
    location: { latitude: 23.3320, longitude: 85.3180, address: 'Harmu River Crossing Post', region: 'Harmu Catchment' },
    status: 'available',
    contact: '+91-651-224418',
    last_updated: new Date().toISOString()
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-RED-01',
    incident_id: 'INC-F392',
    title: 'CRITICAL FLASH SURGE — Subarnarekha Riverfront',
    message: 'River height exceeded safe threshold by 1.8m. Immediate motorized raft dispatch required for 60 marooned households.',
    severity: 'critical',
    created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    state: 'active'
  },
  {
    id: 'ALT-RED-02',
    incident_id: 'INC-D8C7',
    title: 'EMERGENCY GRID DE-ENERGIZATION — Harmu Ward 9',
    message: 'Water breached 11kV step-down transformer yard. High risk of electrical grounding in flooded tenement corridors.',
    severity: 'critical',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    state: 'active'
  },
  {
    id: 'ALT-RED-03',
    incident_id: 'INC-DH01',
    title: 'DOWNSTREAM HIGH DISCHARGE ALERT — Dhurwa Basin',
    message: 'Spillway release rate 12,000 cusecs. Immediate evacuation of lowland riverbed agricultural hamlets ordered.',
    severity: 'critical',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    state: 'active'
  },
  {
    id: 'ALT-AMB-04',
    incident_id: 'INC-660D',
    title: 'TRANSIT CORRIDOR INUNDATION — Morabadi Approach',
    message: 'Water depth 1.1m on north bypass road. Traffic diverters activated towards Ring Road West.',
    severity: 'high',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    state: 'active'
  }
];

export const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'AUD-8801',
    actor: 'Autonomous Intake Agent',
    event_type: 'INCIDENT_INGESTED',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    details: {
      incident_id: 'INC-F392',
      source: 'hydrological_sensor',
      gauge_rise_cm: 180,
      confidence: 0.98
    },
    record_ids: ['INC-F392']
  },
  {
    id: 'AUD-8802',
    actor: 'Rule Engine (Deterministic Safety)',
    event_type: 'SAFETY_OVERRIDE_TRIGGERED',
    timestamp: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
    details: {
      incident_id: 'INC-F392',
      rule: 'RIVER_LEVEL_CRITICAL_SURGE',
      action: 'ESCALATE_TO_CRITICAL_PRIORITY',
      formula: 'Score clamped to max(composite, 85)'
    },
    record_ids: ['INC-F392', 'RULE-04']
  },
  {
    id: 'AUD-8803',
    actor: 'Resource Dispatch Agent',
    event_type: 'RECOMMENDATION_GENERATED',
    timestamp: new Date(Date.now() - 1000 * 60 * 43).toISOString(),
    details: {
      incident_id: 'INC-F392',
      recommendation_id: 'REC-F392-01',
      action: 'Deploy SDRF Fast Boat Rescue Team 1 + Platoon Alpha',
      requires_approval: 'EOC Incident Commander'
    },
    record_ids: ['INC-F392', 'REC-F392-01', 'RES-101', 'RES-102']
  },
  {
    id: 'AUD-8804',
    actor: 'EOC Incident Commander (Human)',
    event_type: 'OFFICER_APPROVAL_EXECUTED',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    details: {
      recommendation_id: 'REC-F392-01',
      decision: 'approved',
      notes: 'Immediate mobilization approved. Coordinate with Bariatu shelter.'
    },
    record_ids: ['REC-F392-01']
  }
];

// Interactive In-Memory State for standalone cloud execution
let liveIncidents: Incident[] = [...INITIAL_INCIDENTS];
let liveResources: ResourceItem[] = [...INITIAL_RESOURCES];
let liveAlerts: Alert[] = [...INITIAL_ALERTS];
let liveAudit: AuditEvent[] = [...INITIAL_AUDIT_EVENTS];

export function getStoreIncidents(): Incident[] {
  return liveIncidents;
}

export function getStoreIncidentDetail(id: string): IncidentDetail | null {
  const inc = liveIncidents.find((i) => i.incident_id === id) || liveIncidents[0];
  if (!inc) return null;

  const recommendations: Recommendation[] = [
    {
      id: `REC-${inc.incident_id}-01`,
      incident_id: inc.incident_id,
      action_type: 'TACTICAL_BOAT_DISPATCH',
      proposed_action: 'Deploy SDRF Fast Boat Rescue Team 1 (4 Inflatable Boats + 12 Navigators) for rooftop evacuation',
      priority: 'IMMEDIATE',
      required_resources: [
        { resource_type: 'rescue_boat', quantity: 4, notes: 'Deploy with lifejackets & acoustic pings' },
        { resource_type: 'ndrf_platoon', quantity: 12, notes: 'Medical first responders' }
      ],
      evidence_references: [
        'CWC Hydro-gauge Sensor 104 (+1.8m in 45m)',
        'Drone thermal survey showing 60+ individuals on building roofs',
        'NDRF SOP Section 4.2: Urban Inundation Rapid Extraction'
      ],
      required_approvals: 'EOC Incident Commander',
      status: 'pending_review'
    },
    {
      id: `REC-${inc.incident_id}-02`,
      incident_id: inc.incident_id,
      action_type: 'SHELTER_ACTIVATION',
      proposed_action: 'Activate Morabadi Community Relief Shelter (Capacity: 500) & initiate safe transit corridor A',
      priority: 'HIGH',
      required_resources: [
        { resource_type: 'evacuation_shelter', quantity: 1, notes: 'Morabadi Indoor Stadium' },
        { resource_type: 'medical_team', quantity: 1, notes: 'RIMS Mobile Unit' }
      ],
      evidence_references: [
        'Municipal Ward 14 Flood Vulnerability Index: 0.88',
        'Topographic elevation profile: Morabadi at +652m MSL (Safe High Ground)'
      ],
      required_approvals: 'District Relief Commissioner',
      status: 'pending_review'
    }
  ];

  const riskAssessment: RiskAssessment = {
    incident_id: inc.incident_id,
    composite_score: inc.risk_assessment?.composite_score || 85.0,
    severity_band: inc.risk_assessment?.severity_band || 'CRITICAL',
    hazard_score: 9.2,
    exposure_score: 8.8,
    vulnerability_score: 8.4,
    data_freshness_score: 9.6,
    calculation_formula: 'Risk = 0.35*(Hazard) + 0.30*(Exposure) + 0.25*(Vulnerability) + 0.10*(Freshness)',
    contributing_factors: [
      'Precipitation intensity: 78 mm/hr (Extreme torrential)',
      'Subarnarekha River catchment saturation: 94.2%',
      'High demographic density in floodway margin (620 persons/sq.km)',
      'Telemetry latency: 1.2s via LoRaWAN hydrological gateway'
    ],
    hard_safety_rule_triggered: inc.risk_assessment?.hard_safety_rule_triggered || false,
    safety_override_reason: inc.risk_assessment?.safety_override_reason,
    assessed_at: new Date().toISOString(),
    model_version: 'DisasterLens-Ensemble-v2.4'
  };

  const agentRuns: AgentRun[] = [
    {
      run_id: `RUN-${inc.incident_id}-01`,
      incident_id: inc.incident_id,
      agent_name: 'Multi-Source Intake & Normalization Agent',
      status: 'success',
      latency_ms: 245,
      output: { parsed_entities: 14, geo_lat: inc.location.latitude, geo_lon: inc.location.longitude },
      created_at: inc.created_at
    },
    {
      run_id: `RUN-${inc.incident_id}-02`,
      incident_id: inc.incident_id,
      agent_name: 'Deterministic Rule Engine & Override Sentry',
      status: 'success',
      latency_ms: 110,
      output: { rules_evaluated: 18, override_triggered: true, clamp_applied: true },
      created_at: inc.created_at
    },
    {
      run_id: `RUN-${inc.incident_id}-03`,
      incident_id: inc.incident_id,
      agent_name: 'Tactical Resource Allocation Co-Pilot',
      status: 'success',
      latency_ms: 820,
      output: { candidates_evaluated: 24, optimal_depot: 'Subarnarekha Basin Depot', eta_minutes: 11 },
      created_at: inc.created_at
    }
  ];

  return {
    incident: inc,
    risk_assessment: riskAssessment,
    recommendations,
    agent_runs: agentRuns
  };
}

export function getStoreResources(): ResourceItem[] {
  return liveResources;
}

export function getStoreAlerts(): Alert[] {
  return liveAlerts;
}

export function getStoreMetrics(): DashboardMetrics {
  const total = liveIncidents.length;
  const critical = liveIncidents.filter((i) => i.severity === 'critical').length;
  const high = liveIncidents.filter((i) => i.severity === 'high').length;
  const activeAlerts = liveAlerts.filter((a) => a.state === 'active').length;
  const overrides = liveIncidents.filter((i) => i.risk_assessment?.hard_safety_rule_triggered).length;

  return {
    total_active_incidents: total,
    critical_incidents: critical,
    high_incidents: high,
    active_alerts: activeAlerts,
    pending_approvals: 36,
    safety_overrides_triggered: overrides,
    resource_capacity: {
      total: 1254,
      available: 1234,
      deployed_pct: 1.6
    },
    average_agent_latency_ms: 1175
  };
}

export function getStoreAudit(): AuditEvent[] {
  return liveAudit;
}

export function addStoreIncident(payload: {
  hazard_type: string;
  location: { latitude: number; longitude: number; address?: string; region?: string };
  severity: string;
  source: string;
  description: string;
}): Incident {
  const id = `INC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = new Date().toISOString();
  const isCritical = payload.severity === 'critical';

  const newInc: Incident = {
    incident_id: id,
    hazard_type: payload.hazard_type,
    location: payload.location,
    severity: (payload.severity as any) || 'high',
    reported_at: now,
    source: payload.source || 'citizen_sos_modal',
    verification_status: 'verified_primary',
    description: payload.description,
    is_active: true,
    created_at: now,
    updated_at: now,
    risk_assessment: {
      composite_score: isCritical ? 92.5 : 78.0,
      severity_band: isCritical ? 'CRITICAL' : 'HIGH',
      hard_safety_rule_triggered: isCritical,
      safety_override_reason: isCritical ? 'HUMAN_LIFE_SAFETY_HARD_OVERRIDE' : undefined
    }
  };

  liveIncidents = [newInc, ...liveIncidents];

  // Add audit record
  liveAudit = [
    {
      id: `AUD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      actor: 'Human Intake Operator',
      event_type: 'INCIDENT_SUBMITTED_MANUAL',
      timestamp: now,
      details: {
        incident_id: id,
        hazard_type: payload.hazard_type,
        address: payload.location.address
      },
      record_ids: [id]
    },
    ...liveAudit
  ];

  return newInc;
}
