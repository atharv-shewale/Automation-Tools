# Club Certificate Automation Tool

A Node.js-based system that automates certificate generation and email distribution for club events.

## 🎯 Features

- ✅ Read participant data from Excel files
- ✅ Generate personalized certificates from PNG templates
- ✅ Dynamic text placement with auto font sizing
- ✅ QR code generation for certificate verification
- ✅ Bulk email sending with attachments
- ✅ Rate limiting to avoid spam blocking
- ✅ Retry mechanism for failed sends
- ✅ Comprehensive logging and delivery tracking
- ✅ Multiple modes: production, dry-run, test

## 📋 Prerequisites

- Node.js (v14 or higher)
- Gmail account with App Password (or other SMTP service)
- Certificate template (PNG image)
- Excel file with participant data

## 🚀 Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd certificate-automation
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your settings
   notepad .env
   ```

## ⚙️ Configuration

### Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the generated password

3. Update `.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

### Certificate Template

1. Place your PNG certificate template in `templates/certificate.png`
2. Recommended size: 2480x3508px (A4 at 300 DPI)
3. Update text placement coordinates in `.env`:
   ```env
   NAME_X=1240
   NAME_Y=1400
   NAME_FONT_SIZE=80
   ```

### Excel File Structure

Your Excel file should have these columns (case-insensitive):
- **Name** (required)
- **Email** (required)
- **Event** (optional - uses EVENT_NAME from .env if not provided)
- Phone (optional)
- Organization (optional)

Example:
| Name | Email | Event |
|------|-------|-------|
| John Smith | john@example.com | Tech Summit 2026 |

## 🎮 Usage

### Production Mode
Generate and send certificates to all participants:
```bash
npm start
```

### Dry-Run Mode
Generate certificates WITHOUT sending emails (for testing):
```bash
npm run dry-run
```

### Test Mode
Send all certificates to admin email only:
```bash
npm run test
```

## 📁 Project Structure

```
certificate-automation/
├── data/
│   └── participants.xlsx          # Input Excel file
├── templates/
│   ├── certificate.png            # Certificate template
│   ├── font.ttf                   # Custom font (optional)
│   └── email-template.html        # Email HTML template
├── output/
│   └── generated-certificates/    # Generated PDFs
├── logs/
│   ├── app-YYYY-MM-DD.log        # Application logs
│   └── delivery-YYYY-MM-DD.csv   # Delivery status
├── services/
│   ├── excelService.js           # Excel parsing
│   ├── certificateService.js     # Certificate generation
│   ├── emailService.js           # Email sending
│   └── validatorService.js       # Data validation
├── utils/
│   ├── logger.js                 # Logging utility
│   └── helpers.js                # Helper functions
├── .env                          # Configuration (create from .env.example)
├── server.js                     # Main application
└── package.json
```

## 📊 Logs

### Application Logs
Location: `logs/app-YYYY-MM-DD.log`
- Timestamped events
- Error details with stack traces
- Processing status

### Delivery Logs
Location: `logs/delivery-YYYY-MM-DD.csv`
- CSV format for easy analysis
- Columns: Timestamp, Name, Email, CertificateID, Status, Error

## 🔧 Troubleshooting

### "Email configuration verification failed"
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Ensure App Password is correct (not regular password)
- Verify 2FA is enabled on Gmail

### "Failed to load custom font"
- Ensure font.ttf exists in templates/
- Check file path in .env
- System will fallback to Arial if font fails to load

### "Excel file is empty or invalid"
- Verify Excel file has data rows (not just headers)
- Check column names match (Name, Email)
- Ensure file path in .env is correct

### Certificates not generating
- Verify certificate.png exists in templates/
- Check image file is valid PNG format
- Review text placement coordinates in .env

## 🎨 Customization

### Email Template
Edit `templates/email-template.html` to customize email design.
Available placeholders:
- `{{name}}` - Participant name
- `{{event}}` - Event name
- `{{certificateId}}` - Certificate ID
- `{{fromName}}` - Sender name

### Certificate Design
- Replace `templates/certificate.png` with your design
- Adjust text coordinates in `.env`
- Modify colors and font sizes as needed

## 📈 Performance

- **Rate Limiting**: 3 seconds between emails (configurable)
- **Gmail Limits**: ~500 emails/day on free tier
- **Retry Logic**: 3 attempts per email with 5-second delays
- **Batch Processing**: Processes participants sequentially

## 🔒 Security

- Never commit `.env` file to version control
- Use App Passwords, not account passwords
- Store logs securely (contain email addresses)
- Enable AUTO_CLEANUP to remove generated files

## 📝 License

MIT

## 🤝 Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review `.env` configuration
3. Verify Excel file structure
4. Test with dry-run mode first

---

**Made with ❤️ for club automation**
