namespace PortalAPIOpenDoorSample
{
    partial class frm_PortalAPIOpenDoorSample
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
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(frm_PortalAPIOpenDoorSample));
            this.btnOpenDoor = new System.Windows.Forms.Button();
            this.txtDebug = new System.Windows.Forms.TextBox();
            this.cbDoorName = new System.Windows.Forms.ComboBox();
            this.SuspendLayout();
            // 
            // btnOpenDoor
            // 
            this.btnOpenDoor.Location = new System.Drawing.Point(12, 12);
            this.btnOpenDoor.Name = "btnOpenDoor";
            this.btnOpenDoor.Size = new System.Drawing.Size(124, 23);
            this.btnOpenDoor.TabIndex = 0;
            this.btnOpenDoor.Text = "Open This Door -->";
            this.btnOpenDoor.UseVisualStyleBackColor = true;
            this.btnOpenDoor.Click += new System.EventHandler(this.btnOpenDoor_Click);
            // 
            // txtDebug
            // 
            this.txtDebug.Location = new System.Drawing.Point(12, 41);
            this.txtDebug.Multiline = true;
            this.txtDebug.Name = "txtDebug";
            this.txtDebug.ScrollBars = System.Windows.Forms.ScrollBars.Both;
            this.txtDebug.Size = new System.Drawing.Size(686, 412);
            this.txtDebug.TabIndex = 2;
            // 
            // cbDoorName
            // 
            this.cbDoorName.FormattingEnabled = true;
            this.cbDoorName.Location = new System.Drawing.Point(142, 13);
            this.cbDoorName.Name = "cbDoorName";
            this.cbDoorName.Size = new System.Drawing.Size(556, 21);
            this.cbDoorName.TabIndex = 3;
            // 
            // frm_PortalAPIOpenDoorSample
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(710, 465);
            this.Controls.Add(this.cbDoorName);
            this.Controls.Add(this.txtDebug);
            this.Controls.Add(this.btnOpenDoor);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
            this.Icon = ((System.Drawing.Icon)(resources.GetObject("$this.Icon")));
            this.MaximizeBox = false;
            this.Name = "frm_PortalAPIOpenDoorSample";
            this.SizeGripStyle = System.Windows.Forms.SizeGripStyle.Hide;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Portal API Open Door Sample";
            this.Load += new System.EventHandler(this.frm_PortalAPIOpenDoorSample_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Button btnOpenDoor;
        private System.Windows.Forms.TextBox txtDebug;
        private System.Windows.Forms.ComboBox cbDoorName;
    }
}

