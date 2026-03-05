using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace DCS
{
    /// <summary>
    /// Interaction logic for Information.xaml
    /// </summary>
    public partial class Information : Window
    {
        public Information()
        {
            InitializeComponent();
            updateText();
        }

        private void updateText()
        {
            var strings = "Request To Execute Action" + "\n" +
                            "To Execute action , enter the action numbers in state with comma seperated values." + "\n" +
                            "\n" +
                            "Request To Set Emergency Mode" + "\n" +
                            "Used to set the state of a terminal or controller Emergency mode.use true or false in state." + "\n" +
                            "\n" +
                            "Request To Set Lockdown Mode" + "\n" +
                            "Used to set the state of a terminal or controller Lockdown mode.use true or false in state." + "\n" +
                            "\n" +
                            "Request To reset APB status" + "\n" +
                            "Used to reset the APB status of all masters, Requires no Sate." + "\n" +
                            "\n" +
                            "Request Open Door" + "\n" +
                            "To open a door requires fixedadd set to the the terminal’s sla. requires no state" + "\n" +
                             "\n" +
                            "INJECT_TRANSACTION" + "\n" +
                            "Select a door to inject a transaction to , state will contain the tag code , if the code exists and may access the transaction will be allowed"
                            ;

            InformationTxt.Document.Blocks.Add(new Paragraph(new Run(strings)));
            InformationTxt.IsReadOnly = true;
            //InformationText.Text = strings;
        }

        private void Button_Click_close(object sender, RoutedEventArgs e)
        {
            this.Close();
        }
    }
}