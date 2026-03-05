using Portal.Api;
using System;
using System.Text;

namespace API_Command_Console
{
    public partial class Program : Portal.Api.CommandListener
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
        private PortalAPI api = new PortalAPI("Command_Console", true, true);

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

                //register command listener
                api.registerCommandListener(this);

                //to monitor door status for controller 1 sendCommand(id, type, "DoorStatus", controllerid)
                api.sendCommand("1", "20", "controller", "1");
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

        void CommandListener.onCommandReceived(statusBase[] message)
        {
            if (message == null || message.Length < 1)
            {
                return;
            }
            try
            {
                statusDoor statusDoor = (statusDoor)message[0];
                Console.WriteLine("Doors Currently Open: " + statusDoor.dosOpen + ",Doors Currently Closed: " + statusDoor.dosClosed);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        void APIListener.onConnectionLost()
        {
            throw new NotImplementedException();
        }
    }
}