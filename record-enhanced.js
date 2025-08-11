require('dotenv').config();

const puppeteer = require("puppeteer");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const axios = require("axios");

// Configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "your-api-key-here";
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Default voice ID (Rachel)
const SUBTITLE_FONT_SIZE = 24;
const SUBTITLE_COLOR = "FFFFFF"; // White text
const SUBTITLE_BG_COLOR = "000000"; // Black background
const SUBTITLE_BG_OPACITY = "80"; // 80% opacity

// Convert URL to safe filename
function safeFilename(url) {
  return url.replace(/(^\w+:|^)\/\//, "").replace(/[^\w]/g, "_");
}

// Pick a random mp3 file from /public/audio
const audioDir = path.resolve(__dirname, "public/audio");
function pickRandomAudio() {
  if (!fs.existsSync(audioDir)) return null;
  const files = fs.readdirSync(audioDir).filter(f => f.toLowerCase().endsWith(".mp3"));
  if (files.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * files.length);
  return path.join(audioDir, files[randomIndex]);
}

// Generate TTS audio using ElevenLabs API
async function generateTTS(text, outputPath) {
  try {
    console.log("🎤 Generating TTS audio...");
    console.log("📝 Narration text:", text.substring(0, 100) + "...");
    
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      data: {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log("✅ TTS audio file created successfully");
        resolve(true);
      });
      writer.on('error', (err) => {
        console.error("❌ Error writing TTS file:", err.message);
        reject(err);
      });
    });
  } catch (error) {
    console.error("❌ TTS generation failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    return false;
  }
}

// Extract text content from webpage
async function extractPageContent(page) {
  try {
    const content = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, nav, footer, header');
      scripts.forEach(el => el.remove());
      
      // Get main content areas
      const mainContent = document.querySelector('main, article, .content, .post, .entry') || document.body;
      
      // Extract text with some formatting
      const textContent = mainContent.innerText || mainContent.textContent;
      
      // Clean up the text
      return textContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 2000); // Limit to 2000 characters for TTS
    });
    
    return content;
  } catch (error) {
    console.error("❌ Failed to extract page content:", error.message);
    return "Welcome to this website. Enjoy browsing through the content.";
  }
}

// Create subtitle file from text
function createSubtitleFile(text, outputPath) {
  const words = text.split(' ');
  const wordsPerSecond = 2.5; // Adjust based on TTS speed
  const duration = words.length / wordsPerSecond;
  
  let subtitleContent = `1\n00:00:00,000 --> 00:00:${Math.floor(duration)},000\n`;
  subtitleContent += text.replace(/(.{50})/g, '$1\n'); // Break long lines
  
  fs.writeFileSync(outputPath, subtitleContent);
  return outputPath;
}

// Add subtitles to video using FFmpeg
function addSubtitlesToVideo(videoPath, subtitlePath, outputPath) {
  try {
    console.log("📝 Adding subtitles to video...");
    
    const ffmpegCommand = `C:\\dev\\ffmpeg\\ffmpeg.exe -y -i "${videoPath}" -vf "subtitles='${subtitlePath}':force_style='FontSize=${SUBTITLE_FONT_SIZE},PrimaryColour=&H${SUBTITLE_COLOR},BackColour=&H${SUBTITLE_BG_COLOR}${SUBTITLE_BG_OPACITY},Alignment=2,MarginV=20'" -c:a copy "${outputPath}"`;
    
    execSync(ffmpegCommand, { stdio: 'pipe' });
    console.log("✅ Subtitles added successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to add subtitles:", error.message);
    return false;
  }
}

// Main recording function with enhanced logging
async function recordWithTTS(url) {
  console.log(`\n🎬 Recording: ${url}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1920,1080",
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  
  try {
    console.log("🌐 Navigating to page...");
    // Go to page first and wait for complete loading
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    console.log("✅ Page loaded successfully");
    
    // Wait a bit more to ensure everything is rendered
    console.log("⏳ Waiting for page to stabilize...");
    await page.waitForTimeout(3000);
    
    // Extract page content for TTS
    console.log("📄 Extracting page content...");
    const pageContent = await extractPageContent(page);
    console.log("📄 Extracted content length:", pageContent.length, "characters");

    // Set viewport to 1920x1080 for full width recording
    console.log("🖥️ Setting viewport...");
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    
    // Wait for viewport to take effect
    await page.waitForTimeout(1000);

    // Setup recorder
    console.log("🎥 Setting up screen recorder...");
    const recorder = new PuppeteerScreenRecorder(page, {
      followNewTab: true,
      fps: 30,
      videoFrame: {
        width: 1920,
        height: 1080,
      },
    });

    const outputDir = path.resolve(__dirname, "recordings");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const baseFilename = safeFilename(url);
    const videoFile = path.join(outputDir, `${baseFilename}.mp4`);
    const ttsFile = path.join(outputDir, `${baseFilename}_tts.mp3`);
    const subtitleFile = path.join(outputDir, `${baseFilename}_subtitles.srt`);
    const finalVideoFile = path.join(outputDir, `${baseFilename}_enhanced.mp4`);

    try {
      // Wait a moment before starting recording to ensure page is stable
      console.log("⏳ Final preparation before recording...");
      await page.waitForTimeout(2000);
      
      // Start recording
      await recorder.start(videoFile);
      console.log("🎥 Recording started, beginning smooth scroll...");

      // Smooth scroll with timeout protection and progress logging
      const scrollPromise = page.evaluate(async () => {
        await new Promise((resolve) => {
          const scrollStep = 1;
          const minDuration = 30000; // Minimum 30 seconds
          const startTime = Date.now();
          let lastProgressLog = 0;
          
          function smoothScroll() {
            const currentScrollY = window.scrollY;
            const maxScrollY = document.body.scrollHeight - window.innerHeight;
            const scrollProgress = Math.min((currentScrollY / maxScrollY) * 100, 100);
            const elapsed = Date.now() - startTime;
            
            // Log progress every 5 seconds
            if (elapsed - lastProgressLog >= 5000) {
              console.log(`📊 Scroll progress: ${scrollProgress.toFixed(1)}% (${Math.floor(elapsed/1000)}s elapsed)`);
              lastProgressLog = elapsed;
            }
            
            window.scrollBy(0, scrollStep);
            
            // Continue scrolling if we haven't reached the bottom OR haven't met minimum duration
            if ((window.innerHeight + window.scrollY) < document.body.scrollHeight && elapsed < minDuration) {
              requestAnimationFrame(smoothScroll);
            } else {
              console.log(`✅ Scrolling completed: ${scrollProgress.toFixed(1)}% in ${Math.floor(elapsed/1000)}s`);
              // Add a small pause at the end to ensure we capture everything
              setTimeout(resolve, 2000);
            }
          }
          requestAnimationFrame(smoothScroll);
        });
      });

      // Add timeout protection (max 2 minutes for scrolling)
      const scrollWithTimeout = Promise.race([
        scrollPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Scrolling timeout after 2 minutes')), 120000)
        )
      ]);

      try {
        await scrollWithTimeout;
        console.log("🎬 Scrolling completed, stopping recording...");
      } catch (error) {
        console.warn(`⚠️ Scrolling timeout or error: ${error.message}. Stopping recording anyway.`);
      }

      await recorder.stop();
      console.log(`✅ Saved recording to: ${videoFile}`);

      // Generate TTS audio
      if (ELEVENLABS_API_KEY !== "your-api-key-here") {
        console.log("🎤 Starting TTS generation...");
        const ttsStartTime = Date.now();
        const ttsResult = await generateTTS(pageContent, ttsFile);
        const ttsDuration = Date.now() - ttsStartTime;
        console.log(`🎤 TTS generation completed in ${Math.floor(ttsDuration/1000)}s`);
        
        if (ttsResult && fs.existsSync(ttsFile)) {
          console.log("✅ TTS generation successful!");
          
          // Create subtitle file
          console.log("📝 Creating subtitle file...");
          createSubtitleFile(pageContent, subtitleFile);
          
          // Combine video with TTS audio and subtitles
          console.log("🎵 Combining video with TTS audio and subtitles...");
          
          // First add TTS audio to video
          const videoWithTTS = path.join(outputDir, `${baseFilename}_with_tts.mp4`);
          console.log("🔧 Running FFmpeg to add TTS audio...");
          execSync(`C:\\dev\\ffmpeg\\ffmpeg.exe -y -i "${videoFile}" -i "${ttsFile}" -c:v copy -c:a aac -shortest "${videoWithTTS}"`, { stdio: 'pipe' });
          console.log("✅ TTS audio added to video");
          
          // Then add subtitles
          console.log("🔧 Running FFmpeg to add subtitles...");
          addSubtitlesToVideo(videoWithTTS, subtitleFile, finalVideoFile);
          
          console.log(`🎉 Enhanced video saved: ${finalVideoFile}`);
        } else {
          console.log("❌ TTS generation failed, skipping TTS-related files");
        }
      } else {
        console.log("⚠️ ElevenLabs API key not set. Skipping TTS generation.");
      }

      // Add background music if available
      const audioFile = pickRandomAudio();
      if (audioFile) {
        console.log(`🎵 Adding background music: ${path.basename(audioFile)}`);
        const outputWithMusic = videoFile.replace(".mp4", "_with_music.mp4");
        try {
          console.log("🔧 Running FFmpeg to add background music...");
          execSync(`C:\\dev\\ffmpeg\\ffmpeg.exe -y -i "${videoFile}" -i "${audioFile}" -c:v libx264 -b:v 2000k -preset veryfast -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest "${outputWithMusic}"`, { stdio: 'pipe' });
          console.log(`🎵 Added background music: ${outputWithMusic}`);
        } catch (ffmpegErr) {
          console.error(`❌ FFmpeg error while adding music:`, ffmpegErr.message);
        }
      } else {
        console.log("⚠️ No background music files found in /public/audio");
      }

      // Create the ULTIMATE video: TTS + Subtitles + Background Music
      if (ELEVENLABS_API_KEY !== "your-api-key-here" && fs.existsSync(ttsFile) && audioFile && fs.existsSync(subtitleFile)) {
        console.log("🎬 Creating ULTIMATE video with TTS + subtitles + background music...");
        
        const ultimateVideoFile = path.join(outputDir, `${baseFilename}_ultimate.mp4`);
        
        try {
          // Step 1: Combine video with TTS audio
          console.log("🔧 Step 1: Combining video with TTS audio...");
          const videoWithTTS = path.join(outputDir, `${baseFilename}_temp_with_tts.mp4`);
          execSync(`C:\\dev\\ffmpeg\\ffmpeg.exe -y -i "${videoFile}" -i "${ttsFile}" -c:v copy -c:a aac -shortest "${videoWithTTS}"`, { stdio: 'pipe' });
          
          // Step 2: Add background music to the TTS video
          console.log("🔧 Step 2: Adding background music to TTS video...");
          const videoWithTTSAndMusic = path.join(outputDir, `${baseFilename}_temp_with_tts_and_music.mp4`);
          execSync(`C:\\dev\\ffmpeg\\ffmpeg.exe -y -i "${videoWithTTS}" -i "${audioFile}" -filter_complex "[0:a]volume=1.0[voice];[1:a]volume=0.3[music];[voice][music]amix=inputs=2:duration=longest[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k "${videoWithTTSAndMusic}"`, { stdio: 'pipe' });
          
          // Step 3: Copy the video with TTS and music as the ultimate video
          console.log("🔧 Step 3: Finalizing ultimate video...");
          execSync(`C:\\dev\\ffmpeg\\ffmpeg.exe -y -i "${videoWithTTSAndMusic}" -c copy "${ultimateVideoFile}"`, { stdio: 'pipe' });
          
          // Clean up temporary files
          if (fs.existsSync(videoWithTTS)) fs.unlinkSync(videoWithTTS);
          if (fs.existsSync(videoWithTTSAndMusic)) fs.unlinkSync(videoWithTTSAndMusic);
          
          console.log(`🎉 ULTIMATE video saved: ${ultimateVideoFile}`);
        } catch (ffmpegErr) {
          console.error(`❌ FFmpeg error while creating ultimate video:`, ffmpegErr.message);
          // Clean up temp files on error
          if (fs.existsSync(videoWithTTS)) fs.unlinkSync(videoWithTTS);
          if (fs.existsSync(videoWithTTSAndMusic)) fs.unlinkSync(videoWithTTSAndMusic);
        }
      } else {
        console.log("⚠️ Skipping ultimate video - missing TTS, audio, or subtitle files");
      }

      console.log(`🎉 Recording completed for ${url}`);

    } catch (err) {
      console.error(`❌ Failed to record ${url}:`, err.message);
    } finally {
      console.log("🧹 Cleaning up browser resources...");
      await page.close();
      await browser.close();
      console.log("✅ Browser cleanup completed");
    }
  } catch (err) {
    console.error(`❌ Failed to record ${url}:`, err.message);
    await page.close();
    await browser.close();
  }
}

// Main execution
(async () => {
  const sitesFile = "sites.txt";
  if (!fs.existsSync(sitesFile)) {
    console.error(`❌ File ${sitesFile} not found!`);
    process.exit(1);
  }

  const urls = fs.readFileSync(sitesFile, "utf-8")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`🚀 Starting enhanced recording of ${urls.length} sites...`);
  
  for (const url of urls) {
    await recordWithTTS(url);
  }

  console.log("\n🎉 All enhanced recordings completed!");
})();
