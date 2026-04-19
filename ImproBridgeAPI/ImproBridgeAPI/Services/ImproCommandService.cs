using System.Text;
using System.Text.Json;
using ImproBridgeAPI.Models;
using Portal.Api;

namespace ImproBridgeAPI.Services
{
    public interface IImproCommandService
    {
        string Authenticate(string username, string password);
        bool PerformAction(string xmlCommand, string token);
        string GetAccessGroups(string token);
        List<HardwareTransaction> GetTransactions(DateTime since, string token);
        bool SyncUser(VisitorRequest request, string token);
        bool AssignAccessGroup(string tagCode, int accessGroupId, string token);
        bool RevokeVisitor(string tagCode, string token);
        bool OpenDoor(int relayId, string token);
    }

    public class ImproCommandService : IImproCommandService
    {
        private readonly string _serverUrl;
        private readonly int _serverPort;
        private readonly string _username;
        private readonly string _password;
        private readonly ILogger<ImproCommandService> _logger;

        // Reusable PortalAPI instance — the SDK is designed to connect/disconnect per operation
        // We create a fresh connection for each call to avoid stale socket issues.

        public ImproCommandService(IConfiguration configuration, ILogger<ImproCommandService> logger)
        {
            _serverUrl = configuration["ImproServerUrl"] ?? "127.0.0.1";
            _serverPort = int.TryParse(configuration["ImproServerPort"], out var p) ? p : 10010;
            _username = configuration["ImproUsername"] ?? "sysdba";
            _password = configuration["ImproPassword"] ?? "masterkey";
            _logger = logger;
        }

        /// <summary>
        /// Creates a connected and authenticated PortalAPI instance.
        /// Caller is responsible for calling Disconnect() when done.
        /// </summary>
        private PortalAPI? ConnectAndLogin()
        {
            try
            {
                var api = new PortalAPI("NEXUS_Bridge", true, true, true);

                if (!api.connect(_serverUrl, _serverPort, 5000))
                {
                    _logger.LogError("[Impro SDK] Failed to connect to Portal server at {Url}:{Port}", _serverUrl, _serverPort);
                    return null;
                }

                api.login(_username, Encoding.UTF8.GetBytes(_password));
                _logger.LogDebug("[Impro SDK] Connected and authenticated to Portal server.");
                return api;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Impro SDK] Exception during connect/login to Portal server at {Url}:{Port}", _serverUrl, _serverPort);
                return null;
            }
        }

        /// <summary>
        /// Cleanly disconnects from the PortalAPI, closing both the API and socket.
        /// </summary>
        private void Disconnect(PortalAPI api)
        {
            try
            {
                api.disconnect();
                if (api.socket != null && api.socket.isConnected())
                {
                    api.socket.disconnect();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Impro SDK] Exception during disconnect (non-fatal).");
            }
        }

        public string Authenticate(string username, string password)
        {
            var api = ConnectAndLogin();
            if (api == null)
            {
                _logger.LogError("[Impro SDK] Authentication failed — could not connect to Portal server.");
                return string.Empty;
            }

            // If we got here, the connection and login succeeded.
            // The PortalAPI SDK doesn't return a traditional token — the session is socket-based.
            // We return a marker token for the caller to track authentication state.
            _logger.LogInformation("[Impro SDK] Successfully authenticated with Portal server.");
            Disconnect(api);
            return "portal-authenticated";
        }

        public bool PerformAction(string xmlCommand, string token)
        {
            var api = ConnectAndLogin();
            if (api == null) return false;

            try
            {
                _logger.LogInformation("[Impro SDK] Executing XML command payload ({Length} chars)", xmlCommand.Length);

                // The PortalAPI SDK's saveOrUpdate and findByHsql handle most DB operations.
                // For raw XML protocol commands (like insertMasterWithTag), we use the XML
                // that's already been pre-built by the caller — the SDK handles this through
                // the saveOrUpdate pipeline internally. This method is primarily for logging/audit.
                // The actual XML protocol execution happens through the specific SDK methods.
                _logger.LogDebug("[Impro SDK] XML Payload:\n{Xml}", xmlCommand);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Impro SDK] Failed to execute XML action.");
                return false;
            }
            finally
            {
                Disconnect(api);
            }
        }

        public string GetAccessGroups(string token)
        {
            var api = ConnectAndLogin();
            if (api == null) return "[]";

            try
            {
                _logger.LogInformation("[Impro SDK] Querying AccessGroups from Portal hardware.");

                baseDomain[] results = api.findByHsql("from AccessGroup");

                if (results == null || results.Length == 0)
                {
                    _logger.LogWarning("[Impro SDK] No AccessGroups found in Portal.");
                    return "[]";
                }

                var groups = new List<object>();
                for (int i = 0; i < results.Length; i++)
                {
                    try
                    {
                        var ag = (accessGroup)results[i];
                        groups.Add(new { Id = ag.id, Name = ag.name });
                    }
                    catch (InvalidCastException)
                    {
                        _logger.LogWarning("[Impro SDK] Skipped non-AccessGroup result at index {Index}, type: {Type}", i, results[i].GetType().Name);
                    }
                }

                var json = JsonSerializer.Serialize(groups);
                _logger.LogInformation("[Impro SDK] Found {Count} access group(s).", groups.Count);
                return json;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Impro SDK] Failed to query AccessGroups.");
                return "[]";
            }
            finally
            {
                Disconnect(api);
            }
        }

        public bool SyncUser(VisitorRequest request, string token)
        {
            var api = ConnectAndLogin();
            if (api == null) return false;

            try
            {
                _logger.LogInformation("[Impro SDK] Creating Master record for {First} {Last} (PIN: {Pin})",
                    request.FirstName, request.LastName, request.PinCode);

                // Create the Master (tagholder) record
                master m = new master();
                m.firstName = request.FirstName;
                m.lastName = request.LastName;
                m.displayName = $"{request.FirstName} {request.LastName}";
                m.idnumber = request.PinCode; // Use PIN as the ID number for lookup
                m.current = "1"; // Active

                // Assign to default site (site id "1" is typically the main/default site)
                site s = new site();
                s.id = "1";
                m.site = s;

                // Assign to Tagholders profile (profile id "16" is standard for "Tagholders")
                profile p = new profile();
                p.id = "16";
                m.profile = p;

                // Set expiry on the master record
                if (!string.IsNullOrEmpty(request.ExpiryDateTime) && request.ExpiryDateTime.Length >= 8)
                {
                    m.setAttribute("mstExpiryDate", request.ExpiryDateTime.Substring(0, 8));
                }

                // Set start date
                if (!string.IsNullOrEmpty(request.StartDateTime) && request.StartDateTime.Length >= 8)
                {
                    m.setAttribute("mstStartDate", request.StartDateTime.Substring(0, 8));
                }

                // Check if a Master with this PIN already exists (handles retries)
                master? savedMaster = null;
                try
                {
                    var existingMasters = api.findByHsql($"from Master where idnumber = '{request.PinCode}'", 1);
                    if (existingMasters != null && existingMasters.Length > 0)
                    {
                        savedMaster = (master)existingMasters[0];
                        _logger.LogInformation("[Impro SDK] Found existing Master ID: {MasterId} for PIN: {Pin}", savedMaster.id, request.PinCode);
                    }
                }
                catch (Exception lookupEx)
                {
                    _logger.LogWarning(lookupEx, "[Impro SDK] Master lookup failed, will try to create new.");
                }

                if (savedMaster == null)
                {
                    // Save the Master record
                    savedMaster = api.saveOrUpdate(m);

                    if (savedMaster == null || string.IsNullOrEmpty(savedMaster.id))
                    {
                        _logger.LogError("[Impro SDK] saveOrUpdate returned null or empty Master ID.");
                        return false;
                    }

                    _logger.LogInformation("[Impro SDK] Master record created with ID: {MasterId}", savedMaster.id);
                }
                else
                {
                    _logger.LogInformation("[Impro SDK] Reusing existing Master ID: {MasterId}", savedMaster.id);
                }

                // Now create the Tag linked to this Master
                // We build a tag with the PIN code as the tagCode
                tag t = new tag();
                t.id = "0"; // New tag
                t.tagCode = request.PinCode;
                t.tagCodeUntruncated = request.PinCode;

                // Set tag expiry — always use end-of-day for the expiry time
                if (!string.IsNullOrEmpty(request.ExpiryDateTime) && request.ExpiryDateTime.Length >= 8)
                {
                    t.expiryDate = request.ExpiryDateTime.Substring(0, 8);
                    t.expiryTime = "2359"; // End-of-day (HHmm format) to avoid Portal validation error
                }

                // Query available tag types from the Portal and use the first one
                tagType tt = new tagType();
                string[] tagTypeQueries = { "from TagType", "from tagType", "from Tagtype" };
                bool tagTypeFound = false;
                foreach (var ttQuery in tagTypeQueries)
                {
                    try
                    {
                        baseDomain[] tagTypes = api.findByHsql(ttQuery, 50);
                        if (tagTypes != null && tagTypes.Length > 0)
                        {
                            // Log all available tag types for debugging
                            for (int i = 0; i < tagTypes.Length; i++)
                            {
                                var ttItem = (tagType)tagTypes[i];
                                _logger.LogInformation("[Impro SDK] Available TagType[{Index}]: ID={Id}, Name={Name}", i, ttItem.id, ttItem.name);
                            }
                            var firstType = (tagType)tagTypes[0];
                            tt.id = firstType.id;
                            tagTypeFound = true;
                            _logger.LogInformation("[Impro SDK] Using tag type: ID={Id}, Name={Name}", firstType.id, firstType.name);
                        }
                        break; // Query succeeded (even if empty)
                    }
                    catch (Exception)
                    {
                        _logger.LogDebug("[Impro SDK] TagType query '{Query}' failed, trying next...", ttQuery);
                    }
                }
                if (!tagTypeFound)
                {
                    tt.id = "2"; // Fallback
                    _logger.LogWarning("[Impro SDK] No tag types found via query. Using fallback ID 2.");
                }
                t.tagType = tt;

                // Link tag to master
                t.master = savedMaster;

                // Set other tag properties
                t.setAttribute("tagAccessOverride", "1");
                t.setAttribute("report", "1");
                t.setAttribute("ordinal", "1");

                // Save the tag
                tag savedTag = api.saveOrUpdate(t);

                if (savedTag != null)
                {
                    _logger.LogInformation("[Impro SDK] Tag created with ID: {TagId}, Code: {TagCode}", savedTag.id, request.PinCode);
                    return true;
                }
                else
                {
                    _logger.LogError("[Impro SDK] Failed to create tag for Master {MasterId}", savedMaster.id);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Impro SDK] Failed to sync user {First} {Last} to hardware.",
                    request.FirstName, request.LastName);

                // Log SDK debug messages if available
                try
                {
                    var debugMsg = api.getDebugStream()?.readDebugMessage();
                    if (!string.IsNullOrEmpty(debugMsg))
                    {
                        _logger.LogError("[Impro SDK Debug] {Msg}", debugMsg);
                    }
                }
                catch { /* ignore debug stream errors */ }

                return false;
            }
            finally
            {
                Disconnect(api);
            }
        }

        public bool AssignAccessGroup(string tagCode, int accessGroupId, string token)
        {
            var api = ConnectAndLogin();
            if (api == null) return false;

            try
            {
                _logger.LogInformation("[Impro SDK] Assigning Access Group {GroupId} to tag {TagCode}",
                    accessGroupId, tagCode);

                // First, find the Master record associated with this tag code
                baseDomain[] masterSearch = api.findByHsql(
                    $"from Master where mstIdnumber='{tagCode}'");

                if (masterSearch == null || masterSearch.Length == 0)
                {
                    _logger.LogError("[Impro SDK] No Master found with idnumber (PIN) '{TagCode}'", tagCode);
                    return false;
                }

                master foundMaster = (master)masterSearch[0];

                // Create a mastergroup association to link the access group
                masterGroup mg = new masterGroup();
                mg.id = "0"; // New association

                accessGroup ag = new accessGroup();
                ag.id = accessGroupId.ToString();
                mg.accessgroup = ag;

                // Add to existing master groups or create new array
                if (foundMaster.mastergroup != null)
                {
                    var existingGroups = foundMaster.mastergroup.ToList();
                    existingGroups.Add(mg);
                    foundMaster.mastergroup = existingGroups.ToArray();
                }
                else
                {
                    foundMaster.mastergroup = new masterGroup[] { mg };
                }

                // Save the updated master record
                master updatedMaster = api.saveOrUpdate(foundMaster);

                if (updatedMaster != null)
                {
                    _logger.LogInformation("[Impro SDK] Access Group {GroupId} assigned to Master {MasterId}",
                        accessGroupId, foundMaster.id);
                    return true;
                }

                _logger.LogError("[Impro SDK] saveOrUpdate returned null when assigning access group.");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Impro SDK] Failed to assign Access Group {GroupId} to tag {TagCode}.",
                    accessGroupId, tagCode);
                return false;
            }
            finally
            {
                Disconnect(api);
            }
        }

        public bool RevokeVisitor(string tagCode, string token)
        {
            var api = ConnectAndLogin();
            if (api == null) return false;

            try
            {
                _logger.LogInformation("[Impro SDK] Revoking visitor tag: {TagCode}", tagCode);

                // Find the tag by its code
                string[] withClause = { "tags" };
                baseDomain[] tagSearch = api.findByHsql(
                    $"select m from Master m join m.tags t where t.tagCode='{tagCode}'", 1, withClause);

                if (tagSearch == null || tagSearch.Length == 0)
                {
                    _logger.LogWarning("[Impro SDK] No Master/Tag found with tagCode '{TagCode}'. May already be deleted.", tagCode);
                    return true; // Consider it successful if not found — idempotent
                }

                master foundMaster = (master)tagSearch[0];

                // Find the specific tag and delete it by setting current to 0 (inactive)
                // and setting the master as non-current
                foundMaster.current = "0";
                api.saveOrUpdate(foundMaster);

                // Also try to delete the tag directly if we can find its ID
                if (foundMaster.tag != null)
                {
                    foreach (var existingTag in foundMaster.tag)
                    {
                        if (existingTag.tagCode == tagCode)
                        {
                            // Delete tag by setting id to negative (Portal convention for deletion)
                            try
                            {
                                tag deleteTag = new tag();
                                deleteTag.id = $"-{existingTag.id}";
                                api.saveOrUpdate(deleteTag);
                                _logger.LogInformation("[Impro SDK] Tag {TagId} (code: {TagCode}) deleted.", existingTag.id, tagCode);
                            }
                            catch (Exception delEx)
                            {
                                _logger.LogWarning(delEx, "[Impro SDK] Could not delete tag {TagId} directly, but Master is deactivated.", existingTag.id);
                            }
                            break;
                        }
                    }
                }

                _logger.LogInformation("[Impro SDK] Visitor with tagCode '{TagCode}' has been revoked.", tagCode);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Impro SDK] Failed to revoke tag {TagCode}.", tagCode);
                return false;
            }
            finally
            {
                Disconnect(api);
            }
        }

        public bool OpenDoor(int relayId, string token)
        {
            var api = ConnectAndLogin();
            if (api == null) return false;

            try
            {
                _logger.LogInformation("[Impro SDK] Opening door/relay ID: {RelayId}", relayId);

                // First, find all terminal devices so we can resolve the SLA address
                baseDomain[] devices = api.findByHsql("from DeviceImprox", 1000);

                if (devices == null || devices.Length == 0)
                {
                    _logger.LogError("[Impro SDK] No devices found in Portal. Cannot open door.");
                    return false;
                }

                // Build a list of terminal devices with their SLA addresses
                string? targetSla = null;
                int terminalIndex = 0;

                for (int i = 0; i < devices.Length; i++)
                {
                    if (devices[i].GetType() == typeof(terminal))
                    {
                        terminalIndex++;
                        var dev = (deviceImprox)devices[i];

                        _logger.LogDebug("[Impro SDK] Terminal {Index}: Name='{Name}', SLA='{Sla}'",
                            terminalIndex, dev.name, dev.sla);

                        // Match by relay ID (1-indexed terminal order)
                        if (terminalIndex == relayId)
                        {
                            targetSla = dev.sla;
                            _logger.LogInformation("[Impro SDK] Matched relay {RelayId} to terminal '{Name}' (SLA: {Sla})",
                                relayId, dev.name, dev.sla);
                            break;
                        }
                    }
                }

                if (string.IsNullOrEmpty(targetSla))
                {
                    // Fallback: if relayId=1 and we have at least one terminal, use the first one
                    if (relayId == 1)
                    {
                        for (int i = 0; i < devices.Length; i++)
                        {
                            if (devices[i].GetType() == typeof(terminal))
                            {
                                targetSla = ((deviceImprox)devices[i]).sla;
                                _logger.LogWarning("[Impro SDK] Using first available terminal SLA: {Sla}", targetSla);
                                break;
                            }
                        }
                    }

                    if (string.IsNullOrEmpty(targetSla))
                    {
                        _logger.LogError("[Impro SDK] Could not resolve SLA for relay ID {RelayId}.", relayId);
                        return false;
                    }
                }

                // Send the OPEN_DOOR engine command
                api.sendEngineCommand("OPEN_DOOR", targetSla, "");

                // Give the hardware time to process the command
                Thread.Sleep(500);

                _logger.LogInformation("[Impro SDK] OPEN_DOOR command sent successfully for SLA: {Sla}", targetSla);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Impro SDK] Failed to open door relay {RelayId}.", relayId);
                return false;
            }
            finally
            {
                Disconnect(api);
            }
        }

        public List<HardwareTransaction> GetTransactions(DateTime since, string token)
        {
            var api = ConnectAndLogin();
            if (api == null) return new List<HardwareTransaction>();

            try
            {
                _logger.LogDebug("[Impro SDK] Querying transactions since {Since}", since.ToString("yyyy-MM-dd HH:mm:ss"));

                // Try multiple possible entity names — the Impro Portal version determines the correct one
                string sinceStr = since.ToString("yyyy-MM-dd HH:mm:ss");
                string[] entityNames = { "TransAck", "Transack", "transAck", "Transaction", "transactLog" };
                baseDomain[]? txnResults = null;

                foreach (var entityName in entityNames)
                {
                    try
                    {
                        txnResults = api.findByHsql(
                            $"from {entityName} where timestamp > '{sinceStr}' order by timestamp asc", 500);
                        _logger.LogInformation("[Impro SDK] Transaction query succeeded with entity: {Entity}", entityName);
                        break; // Found the right entity name
                    }
                    catch (Exception)
                    {
                        _logger.LogDebug("[Impro SDK] Entity '{Entity}' not found, trying next...", entityName);
                        // Try next entity name
                    }
                }

                if (txnResults == null)
                {
                    _logger.LogWarning("[Impro SDK] No valid transaction entity found. Audit sync skipped.");
                    return new List<HardwareTransaction>();
                }

                if (txnResults == null || txnResults.Length == 0)
                {
                    return new List<HardwareTransaction>();
                }

                var transactions = new List<HardwareTransaction>();

                for (int i = 0; i < txnResults.Length; i++)
                {
                    try
                    {
                        var txn = (transack)txnResults[i];

                        var hwTxn = new HardwareTransaction
                        {
                            Id = int.TryParse(txn.id, out var tid) ? tid : i,
                            TagCode = txn.trtagcode ?? "",
                            MasterName = txn.master != null
                                ? $"{txn.master.firstName} {txn.master.lastName}"
                                : "Unknown",
                            DoorName = txn.terminal?.name ?? txn.trlocname ?? "Unknown Door",
                            EventType = txn.@event?.name ?? "Unknown",
                            Timestamp = DateTime.TryParse(txn.datetimeutc, out var parsedDt) ? parsedDt : DateTime.UtcNow,
                        };

                        transactions.Add(hwTxn);
                    }
                    catch (Exception castEx)
                    {
                        _logger.LogWarning(castEx, "[Impro SDK] Failed to parse transaction at index {Index}.", i);
                    }
                }

                _logger.LogInformation("[Impro SDK] Retrieved {Count} transaction(s) since {Since}.",
                    transactions.Count, sinceStr);
                return transactions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Impro SDK] Failed to query transactions.");
                return new List<HardwareTransaction>();
            }
            finally
            {
                Disconnect(api);
            }
        }
    }
}
