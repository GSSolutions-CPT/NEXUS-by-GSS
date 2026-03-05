using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading;
using System.Windows;
using DCS.src;
using Portal.Api;

namespace DCS {
	/// <summary>
	/// Interaction logic for MainWindow.xaml
	/// </summary>
	///

	public partial class MainWindow : Window {
		private Dictionary<string, string> device = new Dictionary<string, string>();
		private List<string> actionlist = new List<string>();

		//some defaults

		public MainWindow() {
			actionlist = new List<string>();
			device = new Dictionary<string, string>();
			ApiConnect.Connect();
			InitializeComponent();
			GetDoorNames();
			SetActions();
		}

		private void SetActions() {
			actionlist.Add("EXECUTE_ACTION");
			actionlist.Add("LOCK");
			actionlist.Add("OPEN_DOOR");
			actionlist.Add("EMERGENCY");
			actionlist.Add("APB");
			actionlist.Add("INJECT_TRANSACTION");
			actionlistCommandList.ItemsSource = actionlist;
		}

		protected override void OnClosing(CancelEventArgs e) {
			Environment.Exit(1);
		}

		private void GetDoorNames() {
			if (ApiConnect.API != null) {
				//cleanup so doors never load twice
				device.Clear();

				baseDomain[] getAllDeviceNamesSearch = ApiConnect.API.findByHsql("from DeviceImprox", 1000);
				for (int i = 0; i < getAllDeviceNamesSearch.Count(); i++) {
					//only add if it is a terminal type
					if (getAllDeviceNamesSearch[i].GetType() == typeof(terminal)) {
						device.Add(((deviceImprox)getAllDeviceNamesSearch[i]).sla, ((deviceImprox)getAllDeviceNamesSearch[i]).fixedAddr);
					}
				}
				cbDoorName.ItemsSource = device;
				Debugtxt.Text = ("Server Connected");
			}
			else {
				serverbutton.IsEnabled = true;
				Debugtxt.Text = ("No Server Connection , doors will not display");
			}
		}

		private void Button_Click_sendaction(object sender, RoutedEventArgs e) {
			if (ApiConnect.API != null) {
				var selectedDoor = (KeyValuePair<string, string>)cbDoorName.SelectedItem;
				if (actionlistCommandList.SelectedItem.ToString() == "INJECT_TRANSACTION") {
					ApiConnect.API.sendEngineCommand(actionlistCommandList.SelectedItem.ToString(), selectedDoor.Value, state.Text);
					Debugtxt.Text = ("send command :" + "\n" + actionlistCommandList.SelectedItem.ToString() + "\n" + selectedDoor.Value + "\n" + state.Text);
					Thread.Sleep(1000);
				}
				else {
					ApiConnect.API.sendEngineCommand(actionlistCommandList.SelectedItem.ToString(), selectedDoor.Key, state.Text);
					Debugtxt.Text = ("send command :" + "\n" + actionlistCommandList.SelectedItem.ToString() + "\n" + selectedDoor.Key + "\n" + state.Text);
					Thread.Sleep(1000);
				}
			}
		}

		private void Button_Click_info(object sender, RoutedEventArgs e) {
			Information info = new Information();
			info.Show();
		}
		private void Button_Click_server(object sender, RoutedEventArgs e) {
			apiServer apiServer = new apiServer();
			apiServer.ShowDialog();
			GetDoorNames();
		}
	}
}