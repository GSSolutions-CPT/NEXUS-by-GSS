using System;
using System.Text;
using Portal.Api;

namespace API_Database_Console
{
    public class PortalLogin
    {
        public bool success;

        public void TryLogin(
          string Uname,
          string Server,
          string Pass,
          int Port,
          long Timeout)
        {
            try
            {
                Session.api = new PortalAPI("ImageApp", true, false);
                if (!Session.api.connect(Server, Port, Timeout))
                {
                    return;
                }
                Session.api.connect(Server, Port, Timeout);
                Session.api.login(Uname, Encoding.UTF8.GetBytes(Pass));
                success = true;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                success = false;
            }
        }
    }
}