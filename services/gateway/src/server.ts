import { authorize, type Claims } from './auth.js';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime: number;
  timestamp: string;
  version: string;
}

export interface ReadinessStatus {
  ready: boolean;
  database: 'connected' | 'disconnected';
  timestamp: string;
}

const startTime = Date.now();

export function getHealth(): HealthStatus {
  return {
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
}

export function getReadiness(dbConnected = true): ReadinessStatus {
  return {
    ready: dbConnected,
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  };
}
