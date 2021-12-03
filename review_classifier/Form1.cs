using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace review_classifier
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button2_Click(object sender, EventArgs e)
        {
            ResultForm form = new ResultForm();
            form.Show();
            Hide();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            ProcessStartInfo start = new ProcessStartInfo();
            start.FileName = @"C:\Program Files (x86)\Microsoft Visual Studio\Shared\Python37_64\python.exe";

            string curDir = Directory.GetCurrentDirectory();
            DirectoryInfo directoryInfo = Directory.GetParent(curDir);
            DirectoryInfo directoryInfo2 = Directory.GetParent(directoryInfo.FullName);
            string path = directoryInfo2.FullName + @"\analytics\api.py";

            start.Arguments = string.Format("{0} -c \"{1}\"", path, "worst app!");
            start.UseShellExecute = false;
            start.RedirectStandardOutput = false;
            using (Process process = Process.Start(start))
            {
                using (StreamReader reader = process.StandardOutput)
                {
                    string result = reader.ReadToEnd();
                    MessageBox.Show(result);
                }
            }
        }
    }
}
