# VoiceBat Enhanced Recording Script

## Overview
This enhanced recording script (`record-enhanced-2.js`) fixes the issues that were preventing full-page scrolling and recording in the original `record-enhanced.js` file.

## What Was Fixed

### 1. **Missing `sites.txt` File**
- The original script was looking for a `sites.txt` file that didn't exist
- Created `sites.txt` with local URLs for testing

### 2. **Scrolling Issues**
- **Problem**: The original scrolling logic could get stuck on the first section
- **Solution**: Implemented improved scrolling with:
  - Stuck detection and recovery
  - Minimum duration enforcement (45 seconds)
  - Maximum duration protection (2 minutes)
  - Progress logging every 5 seconds
  - Final scroll to bottom + return to top for complete coverage

### 3. **Path Issues**
- **Problem**: Hardcoded Windows paths that might not work
- **Solution**: Dynamic FFmpeg path detection for multiple platforms

### 4. **Enhanced Logging**
- Better progress tracking during scrolling
- Page dimension reporting
- Detailed timing information

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure URLs
Edit `sites.txt` to include the URLs you want to record:
```
http://localhost:3000
file:///C:/dev/voicebat3/index.html
```

### 3. Set ElevenLabs API Key (Optional)
Create a `.env` file:
```
ELEVENLABS_API_KEY=your-actual-api-key-here
```

### 4. Install FFmpeg
Make sure FFmpeg is installed and accessible in your PATH, or update the paths in the script.

## Usage

### Basic Recording
```bash
npm run record
```

### Original Script (if needed)
```bash
npm run record-original
```

### Direct Node Execution
```bash
node record-enhanced-2.js
```

## What the Script Does

1. **Page Loading**: Navigates to the specified URL and waits for complete loading
2. **Content Extraction**: Extracts text content for TTS narration
3. **Recording Setup**: Configures screen recorder with 1920x1080 resolution
4. **Smooth Scrolling**: Performs enhanced smooth scrolling through the entire page
5. **TTS Generation**: Creates audio narration using ElevenLabs API (if configured)
6. **Video Processing**: Combines video with TTS audio and subtitles
7. **Background Music**: Adds background music if available in `/public/audio`

## Output Files

The script creates several output files in the `recordings/` directory:
- `{url}.mp4` - Basic recording
- `{url}_tts.mp3` - TTS audio file
- `{url}_subtitles.srt` - Subtitle file
- `{url}_enhanced.mp4` - Video with TTS and subtitles
- `{url}_with_music.mp4` - Video with background music

## Troubleshooting

### Common Issues

1. **"sites.txt not found"**
   - Make sure `sites.txt` exists in the same directory as the script

2. **"FFmpeg not found"**
   - Install FFmpeg or update the paths in the script

3. **"Puppeteer launch failed"**
   - Make sure you have the required dependencies installed (`npm install`)

4. **Scrolling still gets stuck**
   - The improved script has multiple safeguards, but if issues persist, check the browser console for errors

### Performance Tips

- Use `file:///` URLs for local files to avoid network delays
- Ensure your page loads completely before recording starts
- Close other browser instances to free up resources

## Technical Details

### Scrolling Algorithm
- **Minimum Duration**: 45 seconds to ensure adequate coverage
- **Maximum Duration**: 2 minutes to prevent infinite loops
- **Stuck Detection**: Monitors scroll position and forces movement if stuck
- **Progress Tracking**: Logs scroll progress every 5 seconds
- **Complete Coverage**: Scrolls to bottom, then returns to top

### Browser Configuration
- Headless mode for server compatibility
- 1920x1080 viewport for consistent recording
- Disabled security features for local file access
- Extended timeouts for reliable page loading

## Support

If you encounter issues:
1. Check the console output for detailed error messages
2. Verify all dependencies are installed
3. Ensure FFmpeg is accessible
4. Check that the target URLs are accessible

The enhanced script should now provide reliable, full-page recording with beautiful smooth scrolling!
