using Portal.Api;
using System;
using System.Text;

namespace API_Database_Console
{
    internal class API_Database_Sample
    {
        //Portal IP Address
        private static string Portal_API_IP = @"127.0.0.1";

        //this is the default port for API connections
        private static int Portal_API_Port = 10010;

        //Portal username and password
        private static string Portal_API_UserName = "sysdba";

        private static string Portal_API_Password = "masterkey";
        private static int Portal_API_TimeOut = 2000;

        //instance of the API - PortalAPI("My App Name", debug true/false);
        //set debug false else you see all debug stream messages
        private PortalAPI api = new PortalAPI("Command_Console", true, true);

        private static void Main(string[] args)
        {
            //cannot call non-static method from here, need to create an instance of our console app and invoke the method on it
            API_Database_Sample prog = new API_Database_Sample();

            if (prog.api.connect(Portal_API_IP, Portal_API_Port, Portal_API_TimeOut) == true)
            {
                //login to the API
                prog.api.login(Portal_API_UserName, Encoding.UTF8.GetBytes(Portal_API_Password));
            }
            ///
            var stuff = prog.getMasterImage(1);
            master m = prog.getMaster(12345);
            m.setAttribute("mstPin", "5");
            Console.WriteLine(m.SerializeDomain());
            m = prog.api.saveOrUpdate(m);
        }

        private master getMaster(int idnumber)
        {
            baseDomain[] domains = api.findByHsql("select m from Master m where m.mstIdnumber='" + idnumber + "'");
            return (master)domains[0];
        }
        private masterImage[] getMasterImage(int idnumber)
        {
            string[] withclause = { "masterImages", "masterImagesLw" };
            baseDomain[] imageDomain = api.findByHsql("select m from Master m where m.id = " + idnumber, 1, withclause);
            for (int i = 0; i < imageDomain.Length; i++)
            {
                master m = (master)imageDomain[i];
                if (m != null && m.image != null)
                {
                    return m.image;
                }
            }
                return null;
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
    }
}