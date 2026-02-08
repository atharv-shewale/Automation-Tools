# Position Editor - User Guide

## How to Use the Position Editor

### Step 1: Upload Your Certificate Template
1. Go to the **Setup** tab
2. Upload your certificate PNG template
3. The template will be used as the background in the Position Editor

### Step 2: Open Position Editor
1. Click on the **🎨 Position Editor** tab
2. You should see your certificate template displayed on a canvas
3. Text elements (Name, Event, Cert ID, QR Code) will appear as colored boxes on the template

### Step 3: Drag Elements to Position Them
**How to Drag:**
- **Hover** over any text element - cursor changes to a "grab" hand
- **Click and hold** on the element
- **Drag** it to the desired position on the certificate
- **Release** to drop it in place

**Elements you can drag:**
- 👤 **Participant Name** - "John Smith" (blue box)
- 🎯 **Event Name** - "Annual Tech Summit 2026" (blue box)
- 🔖 **Certificate ID** - "CERT-001" (blue box)
- 📱 **QR Code** - "QR CODE" (blue square, if enabled)

### Step 4: Fine-Tune with Controls
Use the sidebar controls to adjust:
- **X/Y Coordinates** - Precise positioning
- **Font Size** - Use the slider
- **Color** - Click the color picker
- **QR Code** - Enable/disable with checkbox

### Step 5: Save Your Positions
1. Click **"Save Positions"** button
2. Wait for confirmation message
3. Positions are saved to your `.env` file

### Step 6: Verify with Preview
1. Go to the **👁️ Preview** tab
2. Enter test name and event
3. Click **"Generate Preview"**
4. Check if text appears in the correct positions
5. Download the PDF to verify

### Step 7: Process Certificates
Once positions are correct:
1. Go to **⚡ Process** tab
2. Click **"Start Processing"**
3. All certificates will use your saved positions

## Troubleshooting

### Canvas is blank or shows "Template not found"
- Go to Setup tab and upload a PNG template
- Make sure the file is named `certificate.png`
- Refresh the Position Editor tab

### Can't drag elements
- Check browser console (F12) for errors
- Make sure you're clicking directly on the colored boxes
- Try refreshing the page

### Positions don't save
- Check that you have write permissions to the `.env` file
- Look for error messages in the alert
- Check browser console for API errors

### Preview doesn't match editor
- Make sure you clicked "Save Positions"
- Wait for the success message before testing preview
- The preview uses the saved `.env` values

## Tips for Best Results

1. **Start with default positions** - They're usually close to correct
2. **Use the preview often** - Test after each major change
3. **Adjust font sizes** - Smaller text gives more flexibility
4. **Center alignment** - Text is centered on the X coordinate
5. **QR code placement** - Usually bottom-right corner works best

## Console Debugging

Open browser console (F12) to see detailed logs:
- `[Position Editor] Initializing canvas...` - Canvas setup
- `[Position Editor] Template image loaded successfully` - Image loaded
- `[Position Editor] Mouse down at: X, Y` - Click detected
- `[Position Editor] Dragging element: name` - Drag started
- `[Position Editor] Stopped dragging name` - Drag ended
- `[Position Editor] Saving positions...` - Save initiated

## Workflow Summary

```
Setup Tab → Upload Template
    ↓
Position Editor → Drag elements to position
    ↓
Sidebar Controls → Fine-tune sizes and colors
    ↓
Save Positions → Click save button
    ↓
Preview Tab → Generate test certificate
    ↓
Verify → Check positions are correct
    ↓
Process Tab → Start batch processing
```

## Need Help?

If dragging still doesn't work:
1. Check browser console (F12) for errors
2. Make sure JavaScript is enabled
3. Try a different browser (Chrome recommended)
4. Clear browser cache and reload
5. Check that the web server is running on port 3000
