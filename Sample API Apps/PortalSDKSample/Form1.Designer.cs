namespace PortalSDKSample
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.APISampleTabControl = new System.Windows.Forms.TabControl();
            this.SearchMasterTabPage = new System.Windows.Forms.TabPage();
            this.IDNumberSearchTextBox = new System.Windows.Forms.TextBox();
            this.SearchCriteriaLabel = new System.Windows.Forms.Label();
            this.GetSpecificMasterRecordButton = new System.Windows.Forms.Button();
            this.GetSpecificMasterRecordResponseTextBox = new System.Windows.Forms.TextBox();
            this.MasterInsertTabPage = new System.Windows.Forms.TabPage();
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.label8 = new System.Windows.Forms.Label();
            this.InsertMasterDataResponseTextBox = new System.Windows.Forms.TextBox();
            this.InsertMasterDataButton = new System.Windows.Forms.Button();
            this.ConnectToAPIbutton = new System.Windows.Forms.Button();
            this.DisconnectFromAPIbutton = new System.Windows.Forms.Button();
            this.label6 = new System.Windows.Forms.Label();
            this.label5 = new System.Windows.Forms.Label();
            this.GenderComboBox = new System.Windows.Forms.ComboBox();
            this.label7 = new System.Windows.Forms.Label();
            this.MiddleNameTextBox = new System.Windows.Forms.TextBox();
            this.IDNumberTextBox = new System.Windows.Forms.TextBox();
            this.label3 = new System.Windows.Forms.Label();
            this.LastNameTextBox = new System.Windows.Forms.TextBox();
            this.label2 = new System.Windows.Forms.Label();
            this.FirstNameTextBox = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.TitleComboBox = new System.Windows.Forms.ComboBox();
            this.label10 = new System.Windows.Forms.Label();
            this.MasterCurrentComboBox = new System.Windows.Forms.ComboBox();
            this.label11 = new System.Windows.Forms.Label();
            this.MasterSiteComboBox = new System.Windows.Forms.ComboBox();
            this.label12 = new System.Windows.Forms.Label();
            this.MasterTypeComboBox = new System.Windows.Forms.ComboBox();
            this.DisplayNameTextBox = new System.Windows.Forms.TextBox();
            this.label13 = new System.Windows.Forms.Label();
            this.label14 = new System.Windows.Forms.Label();
            this.ProfileComboBox = new System.Windows.Forms.ComboBox();
            this.groupBox3 = new System.Windows.Forms.GroupBox();
            this.label16 = new System.Windows.Forms.Label();
            this.EmailTextBox = new System.Windows.Forms.TextBox();
            this.MobileNoTextBox = new System.Windows.Forms.TextBox();
            this.label15 = new System.Windows.Forms.Label();
            this.groupBox2 = new System.Windows.Forms.GroupBox();
            this.APISampleTabControl.SuspendLayout();
            this.SearchMasterTabPage.SuspendLayout();
            this.MasterInsertTabPage.SuspendLayout();
            this.groupBox1.SuspendLayout();
            this.groupBox3.SuspendLayout();
            this.groupBox2.SuspendLayout();
            this.SuspendLayout();
            // 
            // APISampleTabControl
            // 
            this.APISampleTabControl.Controls.Add(this.SearchMasterTabPage);
            this.APISampleTabControl.Controls.Add(this.MasterInsertTabPage);
            this.APISampleTabControl.Enabled = false;
            this.APISampleTabControl.Location = new System.Drawing.Point(12, 52);
            this.APISampleTabControl.Name = "APISampleTabControl";
            this.APISampleTabControl.SelectedIndex = 0;
            this.APISampleTabControl.Size = new System.Drawing.Size(970, 600);
            this.APISampleTabControl.TabIndex = 74;
            // 
            // SearchMasterTabPage
            // 
            this.SearchMasterTabPage.Controls.Add(this.IDNumberSearchTextBox);
            this.SearchMasterTabPage.Controls.Add(this.SearchCriteriaLabel);
            this.SearchMasterTabPage.Controls.Add(this.GetSpecificMasterRecordButton);
            this.SearchMasterTabPage.Controls.Add(this.GetSpecificMasterRecordResponseTextBox);
            this.SearchMasterTabPage.Location = new System.Drawing.Point(4, 22);
            this.SearchMasterTabPage.Name = "SearchMasterTabPage";
            this.SearchMasterTabPage.Padding = new System.Windows.Forms.Padding(3);
            this.SearchMasterTabPage.Size = new System.Drawing.Size(962, 574);
            this.SearchMasterTabPage.TabIndex = 1;
            this.SearchMasterTabPage.Text = "Search for specific Master record";
            this.SearchMasterTabPage.UseVisualStyleBackColor = true;
            // 
            // IDNumberSearchTextBox
            // 
            this.IDNumberSearchTextBox.Location = new System.Drawing.Point(120, 8);
            this.IDNumberSearchTextBox.Name = "IDNumberSearchTextBox";
            this.IDNumberSearchTextBox.Size = new System.Drawing.Size(250, 20);
            this.IDNumberSearchTextBox.TabIndex = 17;
            // 
            // SearchCriteriaLabel
            // 
            this.SearchCriteriaLabel.AutoSize = true;
            this.SearchCriteriaLabel.Location = new System.Drawing.Point(15, 11);
            this.SearchCriteriaLabel.Name = "SearchCriteriaLabel";
            this.SearchCriteriaLabel.Size = new System.Drawing.Size(99, 13);
            this.SearchCriteriaLabel.TabIndex = 16;
            this.SearchCriteriaLabel.Text = "Type in ID Number:";
            // 
            // GetSpecificMasterRecordButton
            // 
            this.GetSpecificMasterRecordButton.Location = new System.Drawing.Point(168, 34);
            this.GetSpecificMasterRecordButton.Name = "GetSpecificMasterRecordButton";
            this.GetSpecificMasterRecordButton.Size = new System.Drawing.Size(202, 26);
            this.GetSpecificMasterRecordButton.TabIndex = 12;
            this.GetSpecificMasterRecordButton.Text = "Get Specific Master Record";
            this.GetSpecificMasterRecordButton.UseVisualStyleBackColor = true;
            this.GetSpecificMasterRecordButton.Click += new System.EventHandler(this.GetSpecificMasterRecordButton_Click);
            // 
            // GetSpecificMasterRecordResponseTextBox
            // 
            this.GetSpecificMasterRecordResponseTextBox.Location = new System.Drawing.Point(6, 66);
            this.GetSpecificMasterRecordResponseTextBox.Multiline = true;
            this.GetSpecificMasterRecordResponseTextBox.Name = "GetSpecificMasterRecordResponseTextBox";
            this.GetSpecificMasterRecordResponseTextBox.ScrollBars = System.Windows.Forms.ScrollBars.Both;
            this.GetSpecificMasterRecordResponseTextBox.Size = new System.Drawing.Size(950, 502);
            this.GetSpecificMasterRecordResponseTextBox.TabIndex = 13;
            // 
            // MasterInsertTabPage
            // 
            this.MasterInsertTabPage.Controls.Add(this.groupBox1);
            this.MasterInsertTabPage.Location = new System.Drawing.Point(4, 22);
            this.MasterInsertTabPage.Name = "MasterInsertTabPage";
            this.MasterInsertTabPage.Padding = new System.Windows.Forms.Padding(3);
            this.MasterInsertTabPage.Size = new System.Drawing.Size(962, 574);
            this.MasterInsertTabPage.TabIndex = 0;
            this.MasterInsertTabPage.Text = "Insert Master Data";
            this.MasterInsertTabPage.UseVisualStyleBackColor = true;
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.groupBox2);
            this.groupBox1.Controls.Add(this.label8);
            this.groupBox1.Controls.Add(this.InsertMasterDataResponseTextBox);
            this.groupBox1.Controls.Add(this.InsertMasterDataButton);
            this.groupBox1.Location = new System.Drawing.Point(6, 6);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(940, 554);
            this.groupBox1.TabIndex = 72;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "Master Table API";
            // 
            // label8
            // 
            this.label8.AutoSize = true;
            this.label8.Location = new System.Drawing.Point(16, 304);
            this.label8.Name = "label8";
            this.label8.Size = new System.Drawing.Size(58, 13);
            this.label8.TabIndex = 69;
            this.label8.Text = "Response:";
            // 
            // InsertMasterDataResponseTextBox
            // 
            this.InsertMasterDataResponseTextBox.Location = new System.Drawing.Point(19, 323);
            this.InsertMasterDataResponseTextBox.Multiline = true;
            this.InsertMasterDataResponseTextBox.Name = "InsertMasterDataResponseTextBox";
            this.InsertMasterDataResponseTextBox.Size = new System.Drawing.Size(902, 217);
            this.InsertMasterDataResponseTextBox.TabIndex = 68;
            // 
            // InsertMasterDataButton
            // 
            this.InsertMasterDataButton.Location = new System.Drawing.Point(305, 270);
            this.InsertMasterDataButton.Name = "InsertMasterDataButton";
            this.InsertMasterDataButton.Size = new System.Drawing.Size(310, 47);
            this.InsertMasterDataButton.TabIndex = 67;
            this.InsertMasterDataButton.Text = "Insert Master Data to Portal";
            this.InsertMasterDataButton.UseVisualStyleBackColor = true;
            this.InsertMasterDataButton.Click += new System.EventHandler(this.InsertMasterDataButton_Click);
            // 
            // ConnectToAPIbutton
            // 
            this.ConnectToAPIbutton.Location = new System.Drawing.Point(16, 13);
            this.ConnectToAPIbutton.Name = "ConnectToAPIbutton";
            this.ConnectToAPIbutton.Size = new System.Drawing.Size(146, 33);
            this.ConnectToAPIbutton.TabIndex = 75;
            this.ConnectToAPIbutton.Text = "Connect to Portal API";
            this.ConnectToAPIbutton.UseVisualStyleBackColor = true;
            this.ConnectToAPIbutton.Click += new System.EventHandler(this.ConnectToAPIbutton_Click);
            // 
            // DisconnectFromAPIbutton
            // 
            this.DisconnectFromAPIbutton.Location = new System.Drawing.Point(168, 13);
            this.DisconnectFromAPIbutton.Name = "DisconnectFromAPIbutton";
            this.DisconnectFromAPIbutton.Size = new System.Drawing.Size(146, 33);
            this.DisconnectFromAPIbutton.TabIndex = 76;
            this.DisconnectFromAPIbutton.Text = "Disconnect from Portal API";
            this.DisconnectFromAPIbutton.UseVisualStyleBackColor = true;
            this.DisconnectFromAPIbutton.Click += new System.EventHandler(this.DisconnectFromAPIbutton_Click);
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Location = new System.Drawing.Point(201, 94);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(45, 13);
            this.label6.TabIndex = 55;
            this.label6.Text = "Gender:";
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(50, 94);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(34, 13);
            this.label5.TabIndex = 54;
            this.label5.Text = "*Title:";
            // 
            // GenderComboBox
            // 
            this.GenderComboBox.FormattingEnabled = true;
            this.GenderComboBox.Items.AddRange(new object[] {
            "M",
            "F"});
            this.GenderComboBox.Location = new System.Drawing.Point(253, 90);
            this.GenderComboBox.Name = "GenderComboBox";
            this.GenderComboBox.Size = new System.Drawing.Size(103, 21);
            this.GenderComboBox.TabIndex = 53;
            this.GenderComboBox.Text = "M";
            // 
            // label7
            // 
            this.label7.AutoSize = true;
            this.label7.Location = new System.Drawing.Point(20, 178);
            this.label7.Name = "label7";
            this.label7.Size = new System.Drawing.Size(65, 13);
            this.label7.TabIndex = 56;
            this.label7.Text = "*ID Number:";
            // 
            // MiddleNameTextBox
            // 
            this.MiddleNameTextBox.Location = new System.Drawing.Point(454, 123);
            this.MiddleNameTextBox.Name = "MiddleNameTextBox";
            this.MiddleNameTextBox.Size = new System.Drawing.Size(182, 20);
            this.MiddleNameTextBox.TabIndex = 44;
            // 
            // IDNumberTextBox
            // 
            this.IDNumberTextBox.Location = new System.Drawing.Point(87, 175);
            this.IDNumberTextBox.Name = "IDNumberTextBox";
            this.IDNumberTextBox.Size = new System.Drawing.Size(269, 20);
            this.IDNumberTextBox.TabIndex = 48;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(376, 126);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(76, 13);
            this.label3.TabIndex = 49;
            this.label3.Text = "*Middle Name:";
            // 
            // LastNameTextBox
            // 
            this.LastNameTextBox.Location = new System.Drawing.Point(87, 149);
            this.LastNameTextBox.Name = "LastNameTextBox";
            this.LastNameTextBox.Size = new System.Drawing.Size(269, 20);
            this.LastNameTextBox.TabIndex = 46;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(20, 152);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(65, 13);
            this.label2.TabIndex = 45;
            this.label2.Text = "*Last Name:";
            // 
            // FirstNameTextBox
            // 
            this.FirstNameTextBox.Location = new System.Drawing.Point(87, 123);
            this.FirstNameTextBox.Name = "FirstNameTextBox";
            this.FirstNameTextBox.Size = new System.Drawing.Size(269, 20);
            this.FirstNameTextBox.TabIndex = 42;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(21, 126);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(64, 13);
            this.label1.TabIndex = 43;
            this.label1.Text = "*First Name:";
            // 
            // TitleComboBox
            // 
            this.TitleComboBox.FormattingEnabled = true;
            this.TitleComboBox.Items.AddRange(new object[] {
            "Mr",
            "Mrs",
            "Miss"});
            this.TitleComboBox.Location = new System.Drawing.Point(87, 90);
            this.TitleComboBox.Name = "TitleComboBox";
            this.TitleComboBox.Size = new System.Drawing.Size(103, 21);
            this.TitleComboBox.TabIndex = 51;
            this.TitleComboBox.Text = "Mr";
            // 
            // label10
            // 
            this.label10.AutoSize = true;
            this.label10.Location = new System.Drawing.Point(34, 20);
            this.label10.Name = "label10";
            this.label10.Size = new System.Drawing.Size(48, 13);
            this.label10.TabIndex = 60;
            this.label10.Text = "*Current:";
            // 
            // MasterCurrentComboBox
            // 
            this.MasterCurrentComboBox.FormattingEnabled = true;
            this.MasterCurrentComboBox.Items.AddRange(new object[] {
            "0",
            "1"});
            this.MasterCurrentComboBox.Location = new System.Drawing.Point(86, 17);
            this.MasterCurrentComboBox.Name = "MasterCurrentComboBox";
            this.MasterCurrentComboBox.Size = new System.Drawing.Size(103, 21);
            this.MasterCurrentComboBox.TabIndex = 59;
            this.MasterCurrentComboBox.Text = "1";
            // 
            // label11
            // 
            this.label11.AutoSize = true;
            this.label11.Location = new System.Drawing.Point(50, 48);
            this.label11.Name = "label11";
            this.label11.Size = new System.Drawing.Size(32, 13);
            this.label11.TabIndex = 62;
            this.label11.Text = "*Site:";
            // 
            // MasterSiteComboBox
            // 
            this.MasterSiteComboBox.FormattingEnabled = true;
            this.MasterSiteComboBox.Items.AddRange(new object[] {
            "1",
            "2"});
            this.MasterSiteComboBox.Location = new System.Drawing.Point(87, 45);
            this.MasterSiteComboBox.Name = "MasterSiteComboBox";
            this.MasterSiteComboBox.Size = new System.Drawing.Size(103, 21);
            this.MasterSiteComboBox.TabIndex = 61;
            this.MasterSiteComboBox.Text = "2";
            // 
            // label12
            // 
            this.label12.AutoSize = true;
            this.label12.Location = new System.Drawing.Point(12, 204);
            this.label12.Name = "label12";
            this.label12.Size = new System.Drawing.Size(73, 13);
            this.label12.TabIndex = 64;
            this.label12.Text = "*Master Type:";
            // 
            // MasterTypeComboBox
            // 
            this.MasterTypeComboBox.FormattingEnabled = true;
            this.MasterTypeComboBox.Items.AddRange(new object[] {
            "1",
            "2"});
            this.MasterTypeComboBox.Location = new System.Drawing.Point(87, 201);
            this.MasterTypeComboBox.Name = "MasterTypeComboBox";
            this.MasterTypeComboBox.Size = new System.Drawing.Size(98, 21);
            this.MasterTypeComboBox.TabIndex = 63;
            this.MasterTypeComboBox.Text = "1";
            // 
            // DisplayNameTextBox
            // 
            this.DisplayNameTextBox.Location = new System.Drawing.Point(454, 149);
            this.DisplayNameTextBox.Name = "DisplayNameTextBox";
            this.DisplayNameTextBox.Size = new System.Drawing.Size(182, 20);
            this.DisplayNameTextBox.TabIndex = 70;
            // 
            // label13
            // 
            this.label13.AutoSize = true;
            this.label13.Location = new System.Drawing.Point(369, 152);
            this.label13.Name = "label13";
            this.label13.Size = new System.Drawing.Size(79, 13);
            this.label13.TabIndex = 71;
            this.label13.Text = "*Display Name:";
            // 
            // label14
            // 
            this.label14.AutoSize = true;
            this.label14.Location = new System.Drawing.Point(206, 20);
            this.label14.Name = "label14";
            this.label14.Size = new System.Drawing.Size(43, 13);
            this.label14.TabIndex = 73;
            this.label14.Text = "*Profile:";
            // 
            // ProfileComboBox
            // 
            this.ProfileComboBox.FormattingEnabled = true;
            this.ProfileComboBox.Items.AddRange(new object[] {
            "16",
            "41"});
            this.ProfileComboBox.Location = new System.Drawing.Point(258, 17);
            this.ProfileComboBox.Name = "ProfileComboBox";
            this.ProfileComboBox.Size = new System.Drawing.Size(103, 21);
            this.ProfileComboBox.TabIndex = 72;
            this.ProfileComboBox.Text = "16";
            // 
            // groupBox3
            // 
            this.groupBox3.Controls.Add(this.label15);
            this.groupBox3.Controls.Add(this.MobileNoTextBox);
            this.groupBox3.Controls.Add(this.EmailTextBox);
            this.groupBox3.Controls.Add(this.label16);
            this.groupBox3.Location = new System.Drawing.Point(651, 19);
            this.groupBox3.Name = "groupBox3";
            this.groupBox3.Size = new System.Drawing.Size(245, 145);
            this.groupBox3.TabIndex = 74;
            this.groupBox3.TabStop = false;
            this.groupBox3.Text = "Master Detail";
            // 
            // label16
            // 
            this.label16.AutoSize = true;
            this.label16.Location = new System.Drawing.Point(20, 26);
            this.label16.Name = "label16";
            this.label16.Size = new System.Drawing.Size(35, 13);
            this.label16.TabIndex = 76;
            this.label16.Text = "Email:";
            // 
            // EmailTextBox
            // 
            this.EmailTextBox.Location = new System.Drawing.Point(23, 42);
            this.EmailTextBox.Name = "EmailTextBox";
            this.EmailTextBox.Size = new System.Drawing.Size(182, 20);
            this.EmailTextBox.TabIndex = 75;
            // 
            // MobileNoTextBox
            // 
            this.MobileNoTextBox.Location = new System.Drawing.Point(23, 97);
            this.MobileNoTextBox.Name = "MobileNoTextBox";
            this.MobileNoTextBox.Size = new System.Drawing.Size(182, 20);
            this.MobileNoTextBox.TabIndex = 77;
            // 
            // label15
            // 
            this.label15.AutoSize = true;
            this.label15.Location = new System.Drawing.Point(20, 73);
            this.label15.Name = "label15";
            this.label15.Size = new System.Drawing.Size(81, 13);
            this.label15.TabIndex = 78;
            this.label15.Text = "Mobile Number:";
            // 
            // groupBox2
            // 
            this.groupBox2.Controls.Add(this.groupBox3);
            this.groupBox2.Controls.Add(this.ProfileComboBox);
            this.groupBox2.Controls.Add(this.label14);
            this.groupBox2.Controls.Add(this.label13);
            this.groupBox2.Controls.Add(this.DisplayNameTextBox);
            this.groupBox2.Controls.Add(this.MasterTypeComboBox);
            this.groupBox2.Controls.Add(this.label12);
            this.groupBox2.Controls.Add(this.MasterSiteComboBox);
            this.groupBox2.Controls.Add(this.label11);
            this.groupBox2.Controls.Add(this.MasterCurrentComboBox);
            this.groupBox2.Controls.Add(this.label10);
            this.groupBox2.Controls.Add(this.TitleComboBox);
            this.groupBox2.Controls.Add(this.label1);
            this.groupBox2.Controls.Add(this.FirstNameTextBox);
            this.groupBox2.Controls.Add(this.label2);
            this.groupBox2.Controls.Add(this.LastNameTextBox);
            this.groupBox2.Controls.Add(this.label3);
            this.groupBox2.Controls.Add(this.IDNumberTextBox);
            this.groupBox2.Controls.Add(this.MiddleNameTextBox);
            this.groupBox2.Controls.Add(this.label7);
            this.groupBox2.Controls.Add(this.GenderComboBox);
            this.groupBox2.Controls.Add(this.label5);
            this.groupBox2.Controls.Add(this.label6);
            this.groupBox2.Location = new System.Drawing.Point(19, 21);
            this.groupBox2.Name = "groupBox2";
            this.groupBox2.Size = new System.Drawing.Size(902, 243);
            this.groupBox2.TabIndex = 70;
            this.groupBox2.TabStop = false;
            this.groupBox2.Text = "Master Data";
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(997, 665);
            this.Controls.Add(this.DisconnectFromAPIbutton);
            this.Controls.Add(this.ConnectToAPIbutton);
            this.Controls.Add(this.APISampleTabControl);
            this.Name = "Form1";
            this.Text = "Portal .NET SDK Sample Application";
            this.APISampleTabControl.ResumeLayout(false);
            this.SearchMasterTabPage.ResumeLayout(false);
            this.SearchMasterTabPage.PerformLayout();
            this.MasterInsertTabPage.ResumeLayout(false);
            this.groupBox1.ResumeLayout(false);
            this.groupBox1.PerformLayout();
            this.groupBox3.ResumeLayout(false);
            this.groupBox3.PerformLayout();
            this.groupBox2.ResumeLayout(false);
            this.groupBox2.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.TabControl APISampleTabControl;
        private System.Windows.Forms.TabPage SearchMasterTabPage;
        private System.Windows.Forms.TextBox IDNumberSearchTextBox;
        private System.Windows.Forms.Label SearchCriteriaLabel;
        private System.Windows.Forms.Button GetSpecificMasterRecordButton;
        private System.Windows.Forms.TextBox GetSpecificMasterRecordResponseTextBox;
        private System.Windows.Forms.TabPage MasterInsertTabPage;
        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.Label label8;
        private System.Windows.Forms.TextBox InsertMasterDataResponseTextBox;
        private System.Windows.Forms.Button InsertMasterDataButton;
        private System.Windows.Forms.Button ConnectToAPIbutton;
        private System.Windows.Forms.Button DisconnectFromAPIbutton;
        private System.Windows.Forms.GroupBox groupBox2;
        private System.Windows.Forms.GroupBox groupBox3;
        private System.Windows.Forms.Label label15;
        private System.Windows.Forms.TextBox MobileNoTextBox;
        private System.Windows.Forms.TextBox EmailTextBox;
        private System.Windows.Forms.Label label16;
        private System.Windows.Forms.ComboBox ProfileComboBox;
        private System.Windows.Forms.Label label14;
        private System.Windows.Forms.Label label13;
        private System.Windows.Forms.TextBox DisplayNameTextBox;
        private System.Windows.Forms.ComboBox MasterTypeComboBox;
        private System.Windows.Forms.Label label12;
        private System.Windows.Forms.ComboBox MasterSiteComboBox;
        private System.Windows.Forms.Label label11;
        private System.Windows.Forms.ComboBox MasterCurrentComboBox;
        private System.Windows.Forms.Label label10;
        private System.Windows.Forms.ComboBox TitleComboBox;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.TextBox FirstNameTextBox;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox LastNameTextBox;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.TextBox IDNumberTextBox;
        private System.Windows.Forms.TextBox MiddleNameTextBox;
        private System.Windows.Forms.Label label7;
        private System.Windows.Forms.ComboBox GenderComboBox;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.Label label6;
    }
}

