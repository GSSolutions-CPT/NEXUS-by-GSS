namespace APIEncryptMessage
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
            this.panel1 = new System.Windows.Forms.Panel();
            this.btnConnect = new System.Windows.Forms.Button();
            this.tfPort = new System.Windows.Forms.TextBox();
            this.lblPort = new System.Windows.Forms.Label();
            this.tfHost = new System.Windows.Forms.TextBox();
            this.lblHost = new System.Windows.Forms.Label();
            this.tbSend = new System.Windows.Forms.TextBox();
            this.button1 = new System.Windows.Forms.Button();
            this.tbReceive = new System.Windows.Forms.TextBox();
            this.panel1.SuspendLayout();
            this.SuspendLayout();
            // 
            // panel1
            // 
            this.panel1.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
            this.panel1.Controls.Add(this.btnConnect);
            this.panel1.Controls.Add(this.tfPort);
            this.panel1.Controls.Add(this.lblPort);
            this.panel1.Controls.Add(this.tfHost);
            this.panel1.Controls.Add(this.lblHost);
            this.panel1.Location = new System.Drawing.Point(3, 1);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(1140, 75);
            this.panel1.TabIndex = 1;
            // 
            // btnConnect
            // 
            this.btnConnect.Location = new System.Drawing.Point(251, 30);
            this.btnConnect.Name = "btnConnect";
            this.btnConnect.Size = new System.Drawing.Size(75, 23);
            this.btnConnect.TabIndex = 5;
            this.btnConnect.Text = "Connect";
            this.btnConnect.UseVisualStyleBackColor = true;
            this.btnConnect.Click += new System.EventHandler(this.button1_Click);
            // 
            // tfPort
            // 
            this.tfPort.Location = new System.Drawing.Point(134, 30);
            this.tfPort.Name = "tfPort";
            this.tfPort.Size = new System.Drawing.Size(100, 20);
            this.tfPort.TabIndex = 4;
            this.tfPort.Text = "10010";
            // 
            // lblPort
            // 
            this.lblPort.AutoSize = true;
            this.lblPort.Location = new System.Drawing.Point(131, 8);
            this.lblPort.Name = "lblPort";
            this.lblPort.Size = new System.Drawing.Size(26, 13);
            this.lblPort.TabIndex = 3;
            this.lblPort.Text = "Port";
            this.lblPort.Click += new System.EventHandler(this.label1_Click_1);
            // 
            // tfHost
            // 
            this.tfHost.Location = new System.Drawing.Point(12, 30);
            this.tfHost.Name = "tfHost";
            this.tfHost.Size = new System.Drawing.Size(100, 20);
            this.tfHost.TabIndex = 2;
            this.tfHost.Text = "127.0.0.1";
            // 
            // lblHost
            // 
            this.lblHost.AutoSize = true;
            this.lblHost.Location = new System.Drawing.Point(9, 8);
            this.lblHost.Name = "lblHost";
            this.lblHost.Size = new System.Drawing.Size(91, 13);
            this.lblHost.TabIndex = 1;
            this.lblHost.Text = "Host / IP Address";
            // 
            // tbSend
            // 
            this.tbSend.BackColor = System.Drawing.Color.White;
            this.tbSend.Font = new System.Drawing.Font("Consolas", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.tbSend.Location = new System.Drawing.Point(3, 76);
            this.tbSend.Multiline = true;
            this.tbSend.Name = "tbSend";
            this.tbSend.ScrollBars = System.Windows.Forms.ScrollBars.Both;
            this.tbSend.Size = new System.Drawing.Size(1140, 221);
            this.tbSend.TabIndex = 2;
            // 
            // button1
            // 
            this.button1.Location = new System.Drawing.Point(396, 303);
            this.button1.Name = "button1";
            this.button1.Size = new System.Drawing.Size(252, 30);
            this.button1.TabIndex = 3;
            this.button1.Text = "Send Encrypted Message";
            this.button1.UseVisualStyleBackColor = true;
            this.button1.Click += new System.EventHandler(this.button1_Click_1);
            // 
            // tbReceive
            // 
            this.tbReceive.BackColor = System.Drawing.Color.White;
            this.tbReceive.Font = new System.Drawing.Font("Consolas", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.tbReceive.Location = new System.Drawing.Point(3, 339);
            this.tbReceive.Multiline = true;
            this.tbReceive.Name = "tbReceive";
            this.tbReceive.ScrollBars = System.Windows.Forms.ScrollBars.Both;
            this.tbReceive.Size = new System.Drawing.Size(1140, 250);
            this.tbReceive.TabIndex = 4;
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1142, 587);
            this.Controls.Add(this.tbReceive);
            this.Controls.Add(this.button1);
            this.Controls.Add(this.tbSend);
            this.Controls.Add(this.panel1);
            this.MaximizeBox = false;
            this.Name = "Form1";
            this.SizeGripStyle = System.Windows.Forms.SizeGripStyle.Hide;
            this.Text = "Form1";
            this.panel1.ResumeLayout(false);
            this.panel1.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.Label lblPort;
        private System.Windows.Forms.TextBox tfHost;
        private System.Windows.Forms.Label lblHost;
        private System.Windows.Forms.TextBox tfPort;
        private System.Windows.Forms.TextBox tbSend;
        private System.Windows.Forms.Button button1;
        private System.Windows.Forms.TextBox tbReceive;
        private System.Windows.Forms.Button btnConnect;
    }
}

