using Crypt;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace APIEncryptMessage
{
    public partial class Form1 : Form
    {
        TcpClient client;
        CryptDriverInterface crypt;

        public Form1()
        {
            InitializeComponent();
            tbSend.Text = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><protocol id=\"755431160\" version=\"1.0\" xsi:schemaLocation=\"http://www.identisoft.net/protocol protocol.xsd\" xmlns=\"http://www.identisoft.net/protocol\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">  <apilogin login=\"sysdba\" password=\"bWFzdGVya2V5\" appname=\"default_login\">  </apilogin></protocol>";
        }

        private void label1_Click(object sender, EventArgs e)
        {

        }

        private void label1_Click_1(object sender, EventArgs e)
        {

        }

        private void button1_Click(object sender, EventArgs e)
        {
            if (btnConnect.Text.Equals("Connect"))
            {
                client = new TcpClient(tfHost.Text, Int32.Parse(tfPort.Text));
                btnConnect.Text = "Disconnect";
                button1.Enabled = true;
                // set encryption to true
                // for un encrypted comms set this to false
                crypt = new Crypt.Crypt(true);
            }
            else
            {
                btnConnect.Text = "Connect";
                client.Close();
                button1.Enabled = false;
            }
        }

        private void button1_Click_1(object sender, EventArgs e)
        {
            byte[] b = crypt.Encrypt(Encoding.UTF8.GetBytes(tbSend.Text));
            byte[] bOut = new byte[b.Length + 1];
            for (int i = 0; i < b.Length; i++)
            {
                bOut[i] = b[i];
            }
            // Append a '\0' to the end of the message
            bOut[b.Length] = 0x00;
            client.GetStream().Flush();
            client.GetStream().Write(bOut, 0, bOut.Length);
            StringBuilder sb = new StringBuilder();
            // wait until a message is received
            while (client.Available < 0)
            {
                Thread.Sleep(100);
            }
            Thread.Sleep(100);
            // read entire message
            while (client.Available > 0)
            {
                b = new byte[client.Available];
                int size = client.GetStream().Read(b, 0, b.Length);
                byte[] bIn = new byte[size];
                for (int i = 0; i < bIn.Length; i++)
                {
                    bIn[i] = b[i];
                }
                sb.Append(Encoding.UTF8.GetString(bIn));
            }
            // remove '\0' from message
            string rx = sb.ToString().Substring(0, sb.Length - 1);
            tbReceive.Text = Encoding.UTF8.GetString(crypt.Decrypt(Encoding.UTF8.GetBytes(rx)));
        }
    }
}
