/**
 * Impro Access Portal XML Protocol Builder
 * Constructs XML messages conforming to the protocol.xsd schema
 */

const PROTOCOL_NS = 'http://www.identisoft.net/protocol';
const XSI_NS = 'http://www.w3.org/2001/XMLSchema-instance';

let messageCounter = 1;

function nextId(): number {
  return messageCounter++;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapProtocol(inner: string, id?: number): string {
  const msgId = id ?? nextId();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<protocol id="${msgId}" version="1.0" xsi:schemaLocation="${PROTOCOL_NS} protocol.xsd" xmlns="${PROTOCOL_NS}" xmlns:xsi="${XSI_NS}">
  ${inner}
</protocol>`;
}

function attrsToXml(attrs: Record<string, string | number | undefined>): string {
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${escapeXml(String(v))}"`)
    .join(' ');
}

// ─── API Login ───
export function buildLoginXml(username: string, password: string, appName = 'ImproPortalWeb'): string {
  const b64Password = Buffer.from(password).toString('base64');
  return wrapProtocol(
    `<apilogin login="${escapeXml(username)}" password="${b64Password}" appname="${escapeXml(appName)}" />`
  );
}

// ─── DB Search ───
export interface DbSearchOptions {
  tableName?: string;
  byId?: number | string;
  searchQuery?: string;
  recordCount?: number;
  withClauses?: string[];
}

export function buildDbSearchXml(options: DbSearchOptions): string {
  const attrs: Record<string, string | number | undefined> = {};
  if (options.tableName) attrs.tableName = options.tableName;
  if (options.byId !== undefined) attrs.byId = String(options.byId);
  if (options.searchQuery) attrs.searchQuery = options.searchQuery;
  attrs.recordCount = String(options.recordCount ?? 100);

  const withClauses = (options.withClauses ?? [])
    .map(wc => `    <withClause>${escapeXml(wc)}</withClause>`)
    .join('\n');

  const inner = withClauses
    ? `<dbsearch ${attrsToXml(attrs)}>\n${withClauses}\n  </dbsearch>`
    : `<dbsearch ${attrsToXml(attrs)}/>`;

  return wrapProtocol(inner);
}

// ─── DB Update ───
export interface DbUpdateOptions {
  entityXml: string;
  withClauses?: string[];
}

export function buildDbUpdateXml(options: DbUpdateOptions): string {
  const withClauses = (options.withClauses ?? [])
    .map(wc => `    <withClause>${escapeXml(wc)}</withClause>`)
    .join('\n');

  const inner = withClauses
    ? `<dbupdate>\n    ${options.entityXml}\n${withClauses}\n  </dbupdate>`
    : `<dbupdate>\n    ${options.entityXml}\n  </dbupdate>`;

  return wrapProtocol(inner);
}

// ─── Master Entity Builder ───
export interface MasterData {
  id?: number;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  idnumber?: string;
  gender?: string;
  title?: string;
  middleName?: string;
  current?: number;
  mstStartDate?: string;
  mstExpiryDate?: string;
  mstPin?: string;
  siteId?: number;
  profileId?: number;
  companyId?: number;
  departmentId?: number;
  masterTypeId?: number;
  tags?: TagData[];
}

export interface TagData {
  id?: number;
  tagCode: string;
  tagCodeUntruncated?: string;
  tagTypeId?: number;
  tagTypeUntruncatedId?: number;
  startDate?: string;
  startTime?: string;
  expiryDate?: string;
  expiryTime?: string;
  suspend?: number;
  report?: number;
  ordinal?: number;
  specialEvent?: number;
  suspendWithAlarm?: number;
  tagAccessOverride?: number;
}

export function buildMasterXml(data: MasterData): string {
  const attrs: Record<string, string | number | undefined> = {
    id: data.id ?? 0,
    current: data.current ?? 1,
    firstName: data.firstName,
    lastName: data.lastName,
    displayName: data.displayName,
    idnumber: data.idnumber,
    gender: data.gender,
    title: data.title,
    middleName: data.middleName,
    mstStartDate: data.mstStartDate,
    mstExpiryDate: data.mstExpiryDate,
    mstPin: data.mstPin,
  };

  const children: string[] = [];

  if (data.siteId) children.push(`<site id="${data.siteId}"/>`);
  if (data.profileId) children.push(`<profile id="${data.profileId}"/>`);
  if (data.companyId) children.push(`<company id="${data.companyId}"/>`);
  if (data.departmentId) children.push(`<department id="${data.departmentId}"/>`);
  if (data.masterTypeId) children.push(`<mastertype id="${data.masterTypeId}"/>`);

  if (data.tags) {
    for (const tag of data.tags) {
      children.push(buildTagXml(tag));
    }
  }

  if (children.length > 0) {
    return `<Master ${attrsToXml(attrs)}>
      ${children.join('\n      ')}
    </Master>`;
  }

  return `<Master ${attrsToXml(attrs)}/>`;
}

export function buildTagXml(data: TagData): string {
  const attrs: Record<string, string | number | undefined> = {
    id: data.id ?? 0,
    tagCode: data.tagCode,
    tagCodeUntruncated: data.tagCodeUntruncated ?? data.tagCode,
    startDate: data.startDate ?? '0',
    startTime: data.startTime ?? '0',
    expiryDate: data.expiryDate ?? '0',
    expiryTime: data.expiryTime ?? '0',
    suspend: data.suspend ?? 0,
    report: data.report ?? 1,
    ordinal: data.ordinal ?? 1,
    specialEvent: data.specialEvent ?? 0,
    suspendWithAlarm: data.suspendWithAlarm ?? 0,
    tagAccessOverride: data.tagAccessOverride ?? 1,
  };

  const children: string[] = [];
  if (data.tagTypeId) children.push(`<tagType id="${data.tagTypeId}"/>`);
  if (data.tagTypeUntruncatedId) children.push(`<tagTypeUntruncated id="${data.tagTypeUntruncatedId}"/>`);

  if (children.length > 0) {
    return `<tag ${attrsToXml(attrs)}>
        ${children.join('\n        ')}
      </tag>`;
  }
  return `<tag ${attrsToXml(attrs)}/>`;
}

// ─── Controller Commands (iprxmessage) ───
export type ControllerCommand = 'OPEN_DOOR' | 'LOCK' | 'EMERGENCY' | 'APB' | 'EXECUTE_ACTION' | 'INJECT_TRANSACTION';

export function buildIprxMessageXml(command: ControllerCommand, fixedAddr: string, state?: string): string {
  const attrs: Record<string, string | number | undefined> = {
    command,
    fixedadd: fixedAddr,
    timeout: 0,
  };
  if (state !== undefined) attrs.state = state;

  return wrapProtocol(`<iprxmessage ${attrsToXml(attrs)}/>`);
}

// ─── Command / Listener Registration ───
export interface CommandOptions {
  type: number;
  filters?: { key: string; value: string }[];
}

export function buildCommandXml(options: CommandOptions): string {
  if (!options.filters || options.filters.length === 0) {
    return wrapProtocol(`<command type="${options.type}"/>`);
  }

  const dataElements = options.filters
    .map(f => `    <data key="${escapeXml(f.key)}" value="${escapeXml(f.value)}"/>`)
    .join('\n');

  return wrapProtocol(`<command type="${options.type}">\n${dataElements}\n  </command>`);
}

// ─── Access Group Assignment ───
export function buildAccessGroupAssignXml(masterId: number, accessGroupId: number): string {
  const entityXml = `<master id="${masterId}">
      <mastergroup id="0">
        <accessgroup id="${accessGroupId}"/>
      </mastergroup>
    </master>`;
  return buildDbUpdateXml({ entityXml, withClauses: ['masterGroups.accessGroup'] });
}

// ─── Master Detail (custom fields) ───
export function buildMasterDetailXml(masterId: number, value: string, detailTypeId: number): string {
  const entityXml = `<Master id="${masterId}">
      <masterdetail id="0" mdValString="${escapeXml(value)}">
        <masterDetailType id="${detailTypeId}"/>
      </masterdetail>
    </Master>`;
  return buildDbUpdateXml({ entityXml, withClauses: ['masterDetails.masterDetailType'] });
}
