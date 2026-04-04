using Portal.Api;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace PortalAPIOpenDoorSample
{
    public partial class frm_PortalAPIOpenDoorSample : Form
    {
        //DeviceComboboxItems device;
        private Dictionary<string, string> device = new Dictionary<string, string>();

        private PortalAPI portalApi;

        public frm_PortalAPIOpenDoorSample()
        {
            InitializeComponent();
        }

        private void frm_PortalAPIOpenDoorSample_Load(object sender, EventArgs e)
        {
            portalApi = new PortalAPI("My Open Door App", true, true, true);

            device = new Dictionary<string, string>();

            AppendTextBox("Connecting...");

            if (portalApi.connect("127.0.0.1", 10010, 5000) == true)
            {
                AppendTextBox("Logging in...");

                portalApi.login("sysdba", Encoding.UTF8.GetBytes("masterkey"));

                AppendTextBox("Getting all devices...");

                baseDomain[] getAllDeviceNamesSearch = portalApi.findByHsql("from DeviceImprox", 1000);
                for (int i = 0; i < getAllDeviceNamesSearch.Length; i++)
                {
                    //only add if it is a terminal type
                    if (getAllDeviceNamesSearch[i].GetType() == typeof(terminal))
                    {
                        device.Add(((deviceImprox)getAllDeviceNamesSearch[i]).sla, ((deviceImprox)getAllDeviceNamesSearch[i]).name);
                    }
                }
                cbDoorName.DataSource = new BindingSource(device, null);
                cbDoorName.DisplayMember = "Value";
                cbDoorName.ValueMember = "Key";

                AppendTextBox("All devices added to combobox.");
            }

            APIDisconnect(); //cleanup resources
        }

        /// <summary>
        /// Method to cleanly disconnect from Portal API
        /// </summary>
        private void APIDisconnect()
        {
            if (portalApi.socket != null)
            {
                portalApi.disconnect();
                if (portalApi.socket.isConnected() == true)
                {
                    portalApi.socket.disconnect();
                }
            }
        }

        /// <summary>
        /// Update debug textbox
        /// </summary>
        /// <param name="value"></param>
        public void AppendTextBox(string value)
        {
            if (InvokeRequired)
            {
                this.Invoke(new Action<string>(AppendTextBox), new object[] { value + Environment.NewLine });
                return;
            }
            txtDebug.Text += value + Environment.NewLine;
        }

        /// <summary>
        /// Convenient method to manage api debug messages and return a specific message if none.
        /// </summary>
        /// <returns></returns>
        private String debugMessages()
        {
            String message = (portalApi.getDebugStream().readDebugMessage().Length > 0) ? portalApi.getDebugStream().readDebugMessage() : "No Portal API debug messages to show.";
            return message;
        }

        private void btnOpenDoor_Click(object sender, EventArgs e)
        {
            AppendTextBox("Connecting...");

            if (portalApi.connect("127.0.0.1", 10010, 5000) == true)
            {
                AppendTextBox("Logging in...");
                portalApi.login("sysdba", Encoding.UTF8.GetBytes("masterkey"));

                AppendTextBox("Opening Door: '" + ((KeyValuePair<string, string>)cbDoorName.SelectedItem).Value +
                    "' with Logical address '" + ((KeyValuePair<string, string>)cbDoorName.SelectedItem).Key + "'");

                portalApi.sendEngineCommand("OPEN_DOOR", ((KeyValuePair<string, string>)cbDoorName.SelectedItem).Key, "");
                // Give App time to send message before disconnecting
                Thread.Sleep(1000);
            }

            APIDisconnect(); //cleanup resources
        }
    }
}