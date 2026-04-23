/**
 * Impro Access Portal REST Client
 * Manages connection, authentication, and API calls to the Portal server
 */
import { buildDbSearchXml, buildDbUpdateXml, buildIprxMessageXml, buildCommandXml, buildAccessGroupAssignXml, buildMasterDetailXml, buildMasterXml, type DbSearchOptions, type MasterData, type TagData, type ControllerCommand, type CommandOptions } from './xml-builder';
import { parsePortalResponse, type PortalResponse, type PortalError } from './xml-parser';

if (typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export interface PortalConfig {
  host: string;
  username: string;
  password: string;
  secure?: boolean;
}

export interface PortalSession {
  token: string;
  host: string;
  connectedAt: Date;
}

// ─── Singleton session store (server-side) ───
let currentSession: PortalSession | null = null;
let currentConfig: PortalConfig | null = null;

function getBaseUrl(host: string): string {
  const protocol = 'https';
  return `${protocol}://${host}/portal/api/xml`;
}

// ─── Login ───
export async function portalLogin(config: PortalConfig): Promise<PortalResponse> {
  const url = getBaseUrl(config.host);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
      'name': config.username,
      'pswd': Buffer.from(config.password).toString('base64'),
    },
    // Skip SSL verification for self-signed certs on local Portal servers
    ...(typeof process !== 'undefined' ? {} : {}),
  });

  const xml = await response.text();
  const parsed = await parsePortalResponse(xml);

  if (parsed.error) {
    throw new PortalApiError(parsed.error);
  }

  // Extract token from response headers or cookie
  const token = response.headers.get('token') || '';

  currentSession = {
    token,
    host: config.host,
    connectedAt: new Date(),
  };
  currentConfig = config;

  return parsed;
}

// ─── Logout ───
export async function portalLogout(): Promise<void> {
  if (!currentSession || !currentConfig) return;

  const url = getBaseUrl(currentConfig.host);

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'name': currentConfig.username,
        'pswd': Buffer.from(currentConfig.password).toString('base64'),
        'logout': 'true',
      },
    });
  } finally {
    currentSession = null;
  }
}

// ─── Send authenticated XML request ───
async function sendRequest(xmlBody: string): Promise<PortalResponse> {
  if (!currentSession || !currentConfig) {
    throw new Error('Not connected to Portal. Please login first.');
  }

  const url = getBaseUrl(currentConfig.host);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/xml',
      'token': currentSession.token,
    },
    body: xmlBody,
  });

  const xml = await response.text();
  const parsed = await parsePortalResponse(xml);

  if (parsed.error) {
    throw new PortalApiError(parsed.error);
  }

  return parsed;
}

// ─── High-level API methods ───

export async function portalSearch(options: DbSearchOptions): Promise<PortalResponse> {
  return sendRequest(buildDbSearchXml(options));
}

export async function portalHqlSearch(query: string, recordCount = 100, withClauses?: string[]): Promise<PortalResponse> {
  return sendRequest(buildDbSearchXml({
    searchQuery: query,
    recordCount,
    withClauses,
  }));
}

export async function portalFindById(tableName: string, id: number, withClauses?: string[]): Promise<PortalResponse> {
  return sendRequest(buildDbSearchXml({
    tableName,
    byId: id,
    recordCount: 1,
    withClauses,
  }));
}

export async function portalUpdate(entityXml: string, withClauses?: string[]): Promise<PortalResponse> {
  return sendRequest(buildDbUpdateXml({ entityXml, withClauses }));
}

export async function portalSaveMaster(data: MasterData, withClauses?: string[]): Promise<PortalResponse> {
  const entityXml = buildMasterXml(data);
  return sendRequest(buildDbUpdateXml({ entityXml, withClauses: withClauses ?? ['tags'] }));
}

export async function portalAssignAccessGroup(masterId: number, accessGroupId: number): Promise<PortalResponse> {
  return sendRequest(buildAccessGroupAssignXml(masterId, accessGroupId));
}

export async function portalAddMasterDetail(masterId: number, value: string, detailTypeId: number): Promise<PortalResponse> {
  return sendRequest(buildMasterDetailXml(masterId, value, detailTypeId));
}

export async function portalSendCommand(command: ControllerCommand, fixedAddr: string, state?: string): Promise<PortalResponse> {
  return sendRequest(buildIprxMessageXml(command, fixedAddr, state));
}

export async function portalRegisterListener(options: CommandOptions): Promise<PortalResponse> {
  return sendRequest(buildCommandXml(options));
}

export async function portalGetVersionInfo(): Promise<PortalResponse> {
  return sendRequest(buildCommandXml({ type: 7 }));
}

// ─── Session state ───
export function getSession(): PortalSession | null {
  return currentSession;
}

export function isConnected(): boolean {
  return currentSession !== null;
}

// ─── Error class ───
export class PortalApiError extends Error {
  code: string;
  detail?: string;

  constructor(error: PortalError) {
    super(error.message);
    this.name = 'PortalApiError';
    this.code = error.code;
    this.detail = error.detail;
  }
}

// Re-export types
export type { DbSearchOptions, MasterData, TagData, ControllerCommand, CommandOptions };
export type { PortalResponse, PortalError, DbSearchResult, DbUpdateResult, TransactionRecord, CommandResult, StatusResult } from './xml-parser';
