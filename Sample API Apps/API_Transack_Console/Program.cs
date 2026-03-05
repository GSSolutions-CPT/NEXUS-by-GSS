using Portal.Api;
using System;
using System.Text;

namespace API_Transack_Console
{
    //implement TransackListener to this class
    public partial class Program : TransackListener
    {
        //Portal IP Address
        private string Portal_API_IP = @"127.0.0.1";

        //this is the default port for API connections
        private int Portal_API_Port = 10010;

        //Portal username and password
        private string Portal_API_UserName = "sysdba";

        private string Portal_API_Password = "masterkey";
        private int Portal_API_TimeOut = 2000;

        //instance of the API - PortalAPI("My App Name", debug true/false);
        //set debug false else you see all debug stream messages
        private PortalAPI api = new PortalAPI("Transack_Console", true, true);

        //onTransackReceived override for TransackListener, this is is where our transaction messages will come in
        public void onTransackReceived(transack transaction)
        {
            //for each transaction, use the variable 'transaction' and use data as needed
            if (transaction.master != null)
            {
                Console.WriteLine("Master: " + transaction.master.firstName + " " + transaction.master.lastName + ", clocked at Terminal: " + transaction.terminal.name);
            }
            //other event or unknown
            else
            {
                Console.WriteLine("Master:" + "unknown" + ", clocked at Terminl: " + transaction.location);
            }
        }

        private static void Main(string[] args)
        {
            //cannot call non-static method from here, need to create an instance of our console app and invoke the method on it
            Program prog = new Program();
            prog.startListening();
        }

        private void startListening()
        {
            //if connection all okay proceed to login and start listening on our commands
            if (api.connect(Portal_API_IP, Portal_API_Port, Portal_API_TimeOut) == true)
            {
                //login to the API
                api.login(Portal_API_UserName, Encoding.UTF8.GetBytes(Portal_API_Password));

                //register transack listener
                api.registerListener(this);

                //send command to listen

                string key = "filter";
                string value = "eventType.etName='Allowed'"; //and terminal.id=3,4";


                api.sendCommand("1", "22", key, value, true);

            }
        }

        //an example for disconnecting
        private void apiDisconnect()
        {
            if (api.connect(Portal_API_IP, Portal_API_Port, Portal_API_TimeOut) == true)
            {
                api.disconnect();
                if (api.socket.isConnected() == true)
                {
                    api.socket.disconnect();
                }
            }
        }

        public void onConnectionLost()
        {
            throw new NotImplementedException();
        }
    }
}