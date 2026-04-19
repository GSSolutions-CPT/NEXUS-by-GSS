using Portal.Api;
using Portal.Api.pvt;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace PortalSDKSample
{
    public partial class Form1 : Form
    {
        public PortalAPI api = new PortalAPI("My_Application_Name", true, true);

        //for convenience sake, lets declare some variables we can use throughout our class form:

        private string Portal_API_IP = @"127.0.0.1"; //this should be whatever your Portal server's IP Address is, if your app is running on the server then 127.0.0.1 is fine
        private int Portal_API_Port = 10010; //this is the default Port and should not change from 10010
        private string Portal_API_UserName = "sysdba";
        private string Portal_API_Password = "masterkey";
        private int Portal_API_TimeOut = 5000;

        //command type = 7 for portal version and license
        private string portalLicense = "unknown";

        private string portalVersion = "unknown";
        private int TagLimit = 3;

        public Form1()
        {
            InitializeComponent();
        }

        private void ConnectToAPIbutton_Click(object sender, EventArgs e)
        {
            ConnectToPortalAPI();
        }

        private void DisconnectFromAPIbutton_Click(object sender, EventArgs e)
        {
            DisconnectFromPortalApiCleanly();
        }

        private void ConnectToPortalAPI()
        {
            //connect to Portal API
            if (api.connect(Portal_API_IP, Portal_API_Port, Portal_API_TimeOut) == true)
            {
                //now login, default is sysdba and masterkey (need to encode password as below:
                api.login(Portal_API_UserName, Encoding.UTF8.GetBytes(Portal_API_Password));

                //from Portal version 1.8 we can get the Portal version and license info.
                //this is helpful to know what your tag limits are based on license. It's good to know
                //how many tags you are allowed to give a tagholder before trying to add a tag.
                //if limit is reached a tag insert could fail.
                //need to be careful here, if you are using Portal 1.6 this can cause issues
                //so try this using a 'do while'. this example works:
                DateTime dt = DateTime.Now + TimeSpan.FromSeconds(1);
                do
                {
                    try
                    {
                        //issue a command type 7 exactly as below
                        command c = api.sendCommand("1", "7", "", "", false);
                        //need to declare a keyvalue
                        keyValue[] kv = c.data;
                        for (int i = 0; i < kv.Length; i++)
                        {
                            keyValue v = kv[i];
                            if (v.key.Equals("Revision"))
                            {
                                portalVersion = v.value; // sets revision
                            }
                            else if (v.key.Equals("License"))
                            {
                                portalLicense = v.value; // sets license
                                if (portalLicense.Contains("Basic"))
                                {
                                    TagLimit = 3;
                                }
                                else if (portalLicense.Contains("Pro"))
                                {
                                    TagLimit = 4;
                                }
                                else if (portalLicense.Contains("Enterprise"))
                                {
                                    TagLimit = 10;
                                }
                            }
                        }
                    }
                    catch { }
                }
                while (DateTime.Now < dt);

                //we are now connected, let's do stuff!
                APISampleTabControl.Enabled = true;
            }
        }

        private void DisconnectFromPortalApiCleanly()
        {
            //if we are currently connected
            if (api.connect(Portal_API_IP, Portal_API_Port, Portal_API_TimeOut) == true)
            {
                //then disconnect
                api.disconnect();

                //if our socket connection is still open
                if (api.socket.isConnected() == true)
                {
                    //then disconnect
                    api.socket.disconnect();
                }
            }
            //disconnected successfully
            APISampleTabControl.Enabled = false;
        }

        private void DoStuff()
        {
        }

        /// <summary>
        /// This Hibernate SQL query example does a search based on MST_IDNUMBER and PROFILE_ID from the MASTER table
        /// </summary>
        /// <param name="ID_Number"></param>
        /// <param name="Portal_Tagholder_Profile"></param>
        private void HibernateSQLQuery(string ID_Number, string Portal_Tagholder_Profile)
        {
            // Hibernate SQL search, take note of case sensitivity for table and column names. read through protocol.xsd for this info
            //tables that are referenced elsewhere like the PROFILE table follow the following example 'profile.id'
            //('profile' as per 'Master' table XSD, then 'id' which is the foreign key id on the PROFILE table.
            //when searching the 'Master' table by MASTER_ID, then the where clause would be 'master.id'
            baseDomain[] MasterIDNumSearch = api.findByHsql("from Master where mstIdnumber='" + ID_Number.Trim() + "' and profile.id='" + Portal_Tagholder_Profile + "'");

            //ID Number does not exists, Tagholder does not exist in Portal
            if (MasterIDNumSearch.Length == 0)
            {
                //no results
                GetSpecificMasterRecordResponseTextBox.AppendText("No records found with that ID Number.");
            }
            //else yes, i know this guy!
            else if (MasterIDNumSearch.Length > 0)
            {
                //need to cycle through because MasterIDNumExistingSearch returns an array list
                for (int id = 0; id < MasterIDNumSearch.Count(); id++)
                {
                    //there is much more data you could pull from here, this is just a summarized example
                    //for each column you will need to cast MasterIDNumSearch[id] to type '(master)' to actually
                    //pull out the master information
                    GetSpecificMasterRecordResponseTextBox.AppendText(
                        "Master Record Detail:" + Environment.NewLine +
                        "       MASTER_ID = " + ((master)MasterIDNumSearch[id]).id.ToString() + Environment.NewLine +
                        "       Title = " + ((master)MasterIDNumSearch[id]).title.ToString() + Environment.NewLine +
                        "       First Name = " + ((master)MasterIDNumSearch[id]).firstName.ToString() + Environment.NewLine +
                        "       Middle Name = " + ((master)MasterIDNumSearch[id]).middleName.ToString() + Environment.NewLine +
                        "       Last Name = " + ((master)MasterIDNumSearch[id]).lastName.ToString() + Environment.NewLine +
                        "       ID Number = " + ((master)MasterIDNumSearch[id]).idnumber.ToString() + Environment.NewLine +
                        "       Gender = " + ((master)MasterIDNumSearch[id]).gender.ToString() + Environment.NewLine +
                        "       Master Type = " + ((master)MasterIDNumSearch[id]).mastertype.name.ToString() + Environment.NewLine +
                        "       Current = " + ((master)MasterIDNumSearch[id]).current.ToString() + Environment.NewLine +
                        "       SITE_ID = " + ((master)MasterIDNumSearch[id]).site.id.ToString() + Environment.NewLine +
                        "       Site Name = " + ((master)MasterIDNumSearch[id]).site.name.ToString() + Environment.NewLine +
                        "       Profile No = " + ((master)MasterIDNumSearch[id]).profile.id.ToString() + Environment.NewLine +
                        "       Profile Name = " + ((master)MasterIDNumSearch[id]).profile.name.ToString() + Environment.NewLine
                     );
                }
            }
        }

        private void GetSpecificMasterRecordButton_Click(object sender, EventArgs e)
        {
            //we going to put our result into the GetSpecificMasterRecordResponseTextBox textbox and append
            //this is a new query so lets clear it before doing another search:
            GetSpecificMasterRecordResponseTextBox.Text = "";

            if (IDNumberSearchTextBox.TextLength > 0)
            {
                HibernateSQLQuery(IDNumberSearchTextBox.Text, "16");//<--16 is profile type 'Tagholders', consult PROFILE table in the databse for full list
            }
            else
            {
                GetSpecificMasterRecordResponseTextBox.AppendText("Please type a ID Number in the above text box first!");
            }
        }

        private void InsertMasterDataButton_Click(object sender, EventArgs e)
        {
            InsertMasterDataResponseTextBox.Text = "";

            try
            {
                master m = new master();
                m.firstName = FirstNameTextBox.Text;
                m.lastName = LastNameTextBox.Text;
                m.displayName = DisplayNameTextBox.Text;
                m.middleName = MiddleNameTextBox.Text;
                m.idnumber = IDNumberTextBox.Text;
                m.current = MasterCurrentComboBox.Text;
                m.gender = GenderComboBox.Text;
                m.title = TitleComboBox.Text;

                //Declare a new object variable for SITE and PROFILE because they are seperate tables
                site s = new site();
                s.id = MasterSiteComboBox.Text;
                profile p = new profile();
                p.id = ProfileComboBox.Text;

                //then assign the id value to the MASTER object
                m.site = s;
                m.profile = p;

                //save MASTER object to the api first and get the return master object
                master m_return = api.saveOrUpdate(m);

                //show inserted/updated id
                InsertMasterDataResponseTextBox.AppendText("MASTER_ID = " + m_return.id + Environment.NewLine);

                //for our array type data, we have 2 MASTER_DETAIL objects - Email and Mobile Number. this can only be created after
                //our MASTER object is created
                List<Master_Detail_List> MasterDetail = new List<Master_Detail_List>();
                MasterDetail.Add(new Master_Detail_List() { valstring = EmailTextBox.Text, detailType = "24" });
                MasterDetail.Add(new Master_Detail_List() { valstring = EmailTextBox.Text, detailType = "23" });

                if (MasterDetail.Count > 0)
                {
                    masterDetail[] mds = new masterDetail[MasterDetail.Count];//2 objects only for this example

                    for (int ii = 0; ii < MasterDetail.Count; ii++)
                    {
                        masterDetail md = new masterDetail();
                        //md.id = "0" because we areassuming this is a new insert, if it is an update
                        //you need to get this id using a Hibernate SQL query
                        md.id = "0";
                        md.valstring = MasterDetail[ii].valstring;

                        masterDetailType mdtype = new masterDetailType();
                        mdtype.id = MasterDetail[ii].detailType;

                        md.detailType = mdtype;

                        mds[ii] = md;
                    }
                    m_return.masterdetail = mds;
                }

                //now save MASTER_DETAIL object
                master mg_return = api.saveOrUpdate(m_return);
            }
            catch (Exception)
            {
                InsertMasterDataResponseTextBox.AppendText(api.getDebugStream().readDebugMessage() + Environment.NewLine);
            }
        }

        /// <summary>
        /// helper class for our MASTER_DETAIL list
        /// </summary>
        public class Master_Detail_List
        {
            public string valstring { get; set; }
            public string detailType { get; set; }
        }
    }
}