using DCS.src;
using System.Windows;

namespace DCS
{
    /// <summary>
    /// Interaction logic for apiServer.xaml
    /// </summary>
    public partial class ApiServer : Window
    {
        public ApiServer()
        {
            InitializeComponent();
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            ApiConnect.ip = IP.Text;
            ApiConnect.user = USER.Text;
            ApiConnect.pass = PASS.Password;
            ApiConnect.port = PORT.Text;
            ApiConnect.Connect();

            Close();
        }
    }
}