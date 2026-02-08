# Certificate Automation Tool - Web UI Guide

## 🚀 Quick Start

### Starting the Web Interface

```bash
npm run web
```

Open your browser to: **http://localhost:3000**

## 📋 Features

### 1. Visual Position Editor
- Drag-and-drop text elements on your certificate template
- Real-time preview of positioning
- Adjust font sizes, colors, and coordinates
- QR code positioning and sizing

### 2. File Upload System
- **Certificate Template**: Upload PNG templates via drag-and-drop
- **Participant Data**: Upload CSV or Excel files
- Real-time validation and preview
- Automatic file format detection

### 3. Live Preview
- Generate test certificates with sample data
- Preview in browser before batch processing
- Download PDF for verification

### 4. Batch Processing Dashboard
- Real-time progress tracking
- Success/failure statistics
- Live log streaming
- Processing controls

### 5. Delivery History
- View all sent certificates
- Track delivery status
- Timestamp and participant details

## 🎨 Using the Position Editor

1. **Upload Template**: Go to Setup tab and upload your certificate PNG
2. **Switch to Editor**: Click the "Position Editor" tab
3. **Drag Elements**: Move the text boxes to desired positions
4. **Fine-tune**: Use the sidebar controls to adjust:
   - X/Y coordinates
   - Font size (slider)
   - Text color (color picker)
5. **Save**: Click "Save Positions" to persist changes

## 📤 Uploading Files

### Certificate Template
- Format: PNG only
- Recommended size: 2480 × 3508 px (A4 at 300 DPI)
- Drag & drop or click to browse

### Participant Data
- Formats: CSV, XLSX, XLS
- Required columns: Name, Email
- Optional columns: Event (if not set globally)

## ⚙️ Configuration

In the Setup tab, configure:
- **Event Name**: Name of your event
- **Certificate ID Prefix**: Prefix for certificate IDs (e.g., CERT-TECH2026)
- **Email From Name**: Sender name for emails
- **Email Subject**: Subject line for certificate emails

## 🔄 Dual Mode Support

### Web Mode (New)
```bash
npm run web
```
Visual interface for managing certificates

### CLI Mode (Original)
```bash
npm start          # Production
npm run test       # Test mode
npm run dry-run    # Dry run
```
Command-line batch processing

## 🎯 Workflow

1. **Setup**
   - Upload certificate template
   - Upload participant CSV
   - Configure event details

2. **Position**
   - Use visual editor to position text
   - Preview with test data
   - Save positions

3. **Preview**
   - Generate test certificate
   - Verify positioning and styling
   - Download PDF to review

4. **Process**
   - Start batch processing
   - Monitor real-time progress
   - Check delivery history

## 🔧 Technical Details

### API Endpoints
- `GET /api/config` - Get configuration
- `PUT /api/config` - Update configuration
- `POST /api/upload-csv` - Upload participant data
- `POST /api/upload-template` - Upload template
- `POST /api/preview` - Generate preview
- `GET /api/status` - Real-time status (SSE)
- `GET /api/logs` - Delivery history

### File Structure
```
public/
├── index.html          # Main UI
├── css/
│   └── styles.css      # Dark-mode styling
└── js/
    ├── app.js          # Main logic
    ├── positionEditor.js   # Visual editor
    ├── preview.js      # Preview generation
    └── dashboard.js    # Processing dashboard
```

## 🎨 Design Features

- **Dark Mode**: Optimized for extended use
- **Glassmorphism**: Modern aesthetic with backdrop blur
- **Responsive**: Works on desktop and tablet
- **Smooth Animations**: Fade-in transitions and hover effects
- **Real-time Updates**: Server-Sent Events for live progress

## 🔒 Security Notes

For production deployment:
- Add authentication (e.g., JWT, OAuth)
- Implement rate limiting
- Validate all file uploads server-side
- Use HTTPS
- Sanitize user inputs

## 📊 Monitoring

The dashboard provides:
- Total participants processed
- Success count
- Failure count
- Live processing logs
- Delivery history table

## 🆘 Troubleshooting

**Server won't start:**
- Check if port 3000 is available
- Verify all dependencies are installed (`npm install`)

**Template not loading:**
- Ensure template is PNG format
- Check file permissions
- Verify template path in `.env`

**CSV upload fails:**
- Verify CSV has Name and Email columns
- Check for special characters
- Ensure file size is under 10MB

**Preview generation fails:**
- Verify template is uploaded
- Check `.env` configuration
- Ensure all required fields are filled

## 📝 Notes

- The web UI and CLI mode share the same configuration (`.env`)
- Changes made in the web UI update the `.env` file
- Delivery logs are shared between both modes
- Template and CSV uploads overwrite existing files

## 🚀 Next Steps

After setting up the web UI:
1. Customize your certificate template
2. Position text elements visually
3. Test with preview generation
4. Upload your participant list
5. Start batch processing

For advanced features and customization, refer to the main README.md.
