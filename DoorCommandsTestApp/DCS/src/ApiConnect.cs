using System;
using System.Text;
using Portal.Api;

namespace DCS.src
{
    public class ApiConnect
    {
        public static PortalAPI API { get; set; }
        public static string ip = "127.0.0.1";
        public static string user = "sysdba";
        public static string pass = "masterkey";
        public static string port = "10010";

        public static void Connect()
        {
            try
            {
                API = new PortalAPI("Door Command Samples", true, true);
                if (API.connect(ip, Convert.ToInt32(port)))
                {
                    API.connect(ip, Convert.ToInt32(port));
                    API.login(user, Encoding.UTF8.GetBytes(pass));
                }
                else
                {
                    API = null;
                    Console.WriteLine("failed to connect to server");
                }
            }
            catch (Exception e)
            {
                Console.WriteLine("failed to connect with exception" + e.ToString());
            }
        }
    }
}