/**
 * Impro Access Portal XML Response Parser
 * Parses XML responses from the Portal API into typed JSON objects
 */
import { parseStringPromise } from 'xml2js';

export interface PortalResponse {
  id: string;
  version: string;
  error?: PortalError;
  dbsearch?: DbSearchResult;
  dbupdate?: DbUpdateResult;
  domain?: Record<string, unknown>;
  command?: CommandResult;
  transack?: TransactionRecord;
  iprxmessage?: IprxResult;
}

export interface PortalError {
  code: string;
  message: string;
  detail?: string;
}

export interface DbSearchResult {
  tableName?: string;
  result?: string;
  recordCount?: string;
  records: Record<string, unknown>[];
}

export interface DbUpdateResult {
  result?: string;
  savedModel?: Record<string, unknown>;
}

export interface CommandResult {
  id: string;
  type: string;
  data?: { key: string; value: string }[];
  status?: StatusResult[];
}

export interface StatusResult {
  type: string;
  status?: string;
  statusName?: string;
  [key: string]: unknown;
}

export interface TransactionRecord {
  sq: string;
  datetimeutc?: string;
  datetimelocal?: string;
  trtagcode?: string;
  trdevname?: string;
  trlocname?: string;
  trzonename?: string;
  trbuildingname?: string;
  trcompanyname?: string;
  trdeptname?: string;
  trReasonCodeName?: string;
  reqtype: string;
  master?: {
    id: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    idnumber?: string;
  };
  eventType?: {
    id: string;
    name?: string;
    desc?: string;
  };
  location?: {
    id: string;
    name?: string;
  };
  site?: {
    id: string;
    name?: string;
  };
}

export interface IprxResult {
  command?: string;
  message?: string;
  state?: string;
  error?: PortalError;
}

// ─── Flatten xml2js attributes ───
function flattenAttributes(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (obj.$ && typeof obj.$ === 'object') {
    Object.assign(result, obj.$);
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$' || key === '_') continue;

    if (Array.isArray(value)) {
      if (value.length === 1 && typeof value[0] === 'object' && value[0] !== null) {
        result[key] = flattenAttributes(value[0] as Record<string, unknown>);
      } else if (value.length === 1 && typeof value[0] === 'string') {
        result[key] = value[0];
      } else {
        result[key] = value.map(item =>
          typeof item === 'object' && item !== null
            ? flattenAttributes(item as Record<string, unknown>)
            : item
        );
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = flattenAttributes(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ─── Parse records from dbsearch response ───
function parseRecords(dbsearch: Record<string, unknown>): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];
  const recordArray = dbsearch.record;

  if (!recordArray) return records;

  const items = Array.isArray(recordArray) ? recordArray : [recordArray];
  for (const item of items) {
    if (typeof item === 'object' && item !== null) {
      records.push(flattenAttributes(item as Record<string, unknown>));
    }
  }

  return records;
}

// ─── Main parser ───
export async function parsePortalResponse(xml: string): Promise<PortalResponse> {
  const parsed = await parseStringPromise(xml, {
    explicitArray: true,
    mergeAttrs: false,
    tagNameProcessors: [],
  });

  const protocol = parsed.protocol;
  if (!protocol) {
    throw new Error('Invalid response: missing <protocol> root element');
  }

  const attrs = protocol.$ || {};
  const response: PortalResponse = {
    id: attrs.id || '0',
    version: attrs.version || '1.0',
  };

  // Error
  if (protocol.error) {
    const err = protocol.error[0];
    const errAttrs = err.$ || {};
    response.error = {
      code: errAttrs.code || 'UNKNOWN',
      message: errAttrs.message || err._ || 'Unknown error',
      detail: errAttrs.detail,
    };
  }

  // DB Search result
  if (protocol.dbsearch) {
    const ds = protocol.dbsearch[0];
    const dsAttrs = ds.$ || {};
    response.dbsearch = {
      tableName: dsAttrs.tableName,
      result: dsAttrs.result,
      recordCount: dsAttrs.recordCount,
      records: parseRecords(ds),
    };
  }

  // DB Update result
  if (protocol.dbupdate) {
    const du = protocol.dbupdate[0];
    const duAttrs = du.$ || {};
    response.dbupdate = {
      result: duAttrs.result,
    };
    if (du.savedModel) {
      response.dbupdate.savedModel = flattenAttributes(
        (Array.isArray(du.savedModel) ? du.savedModel[0] : du.savedModel) as Record<string, unknown>
      );
    }
    // Check for saved domain records
    for (const key of Object.keys(du)) {
      if (key !== '$' && key !== 'savedModel' && key !== 'error' && key !== 'withClause') {
        const items = Array.isArray(du[key]) ? du[key] : [du[key]];
        if (items[0] && typeof items[0] === 'object') {
          response.dbupdate.savedModel = flattenAttributes(items[0] as Record<string, unknown>);
        }
      }
    }
  }

  // Domain (login response)
  if (protocol.domain) {
    const dom = protocol.domain[0];
    response.domain = flattenAttributes(dom as Record<string, unknown>);
  }

  // Command result
  if (protocol.command) {
    const cmd = protocol.command[0];
    const cmdAttrs = cmd.$ || {};
    response.command = {
      id: cmdAttrs.id || '0',
      type: cmdAttrs.type || '0',
    };
    if (cmd.data) {
      response.command.data = (Array.isArray(cmd.data) ? cmd.data : [cmd.data]).map(
        (d: Record<string, unknown>) => {
          const da = (d as Record<string, Record<string, string>>).$ || {};
          return { key: da.key || '', value: da.value || '' };
        }
      );
    }
    if (cmd.status) {
      response.command.status = (Array.isArray(cmd.status) ? cmd.status : [cmd.status]).map(
        (s: Record<string, unknown>) => flattenAttributes(s as Record<string, unknown>) as StatusResult
      );
    }
  }

  // Transaction
  if (protocol.transack) {
    const tr = protocol.transack[0];
    response.transack = flattenAttributes(tr as Record<string, unknown>) as unknown as TransactionRecord;
  }

  // iprxmessage
  if (protocol.iprxmessage) {
    const msg = protocol.iprxmessage[0];
    response.iprxmessage = flattenAttributes(msg as Record<string, unknown>) as unknown as IprxResult;
  }

  return response;
}
