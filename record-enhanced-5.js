require('dotenv').config();

const puppeteer = require("puppeteer");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
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

// Extract text content from webpage (for potential future use)
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
        .substring(0, 2000); // Limit to 2000 characters
    });
    
    return content;
  } catch (error) {
    console.error("❌ Failed to extract page content:", error.message);
    return "Welcome to this website. Enjoy browsing through the content.";
  }
}

// Simple, aggressive scrolling that forces movement down the entire page
async function performSmoothScroll(page) {
  console.log("🔄 Starting aggressive scroll...");
  
  return await page.evaluate(async () => {
    return new Promise((resolve) => {
      const scrollHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      const totalScrollDistance = scrollHeight - viewportHeight;
      
      console.log(`📏 Total scroll distance: ${totalScrollDistance}px`);
      console.log(`📏 Page height: ${scrollHeight}px`);
      console.log(`👁️ Viewport height: ${viewportHeight}px`);
      
      let currentPosition = 0;
      const scrollStep = 100; // Bigger steps for faster movement
      const scrollInterval = 100; // Faster scrolling
      
      const scrollDown = setInterval(() => {
        currentPosition += scrollStep;
        window.scrollTo(0, currentPosition);
        
        console.log(`📊 Scrolled to: ${currentPosition}px / ${totalScrollDistance}px`);
        
        // Stop when we've scrolled past the bottom
        if (currentPosition >= totalScrollDistance) {
          clearInterval(scrollDown);
          console.log("✅ Reached bottom, scrolling back to top...");
          
          // Scroll back to top
          setTimeout(() => {
            window.scrollTo(0, 0);
            setTimeout(resolve, 2000);
          }, 1000);
        }
      }, scrollInterval);
    });
  });
}

// Main recording function without TTS
async function recordWebsite(url) {
  console.log(`\n🎬 Recording: ${url}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1920,1080",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor"
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  
  try {
    console.log("🌐 Navigating to page...");
    
    // Set a longer timeout for page loading
    await page.setDefaultNavigationTimeout(120000);
    
    // Go to page and wait for complete loading
    await page.goto(url, { 
      waitUntil: "networkidle2", 
      timeout: 120000 
    });
    console.log("✅ Page loaded successfully");
    
    // Wait for page to stabilize
    console.log("⏳ Waiting for page to stabilize...");
    await page.waitForTimeout(5000);
    
    // Force page to fully render by scrolling a bit
    console.log("🔄 Forcing page render...");
    await page.evaluate(() => {
      window.scrollTo(0, 100);
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(2000);
    
    // Extract page content (for logging purposes)
    console.log("📄 Extracting page content...");
    const pageContent = await extractPageContent(page);
    console.log("📄 Extracted content length:", pageContent.length, "characters");

    // Set viewport to 1920x1080 for full width recording
    console.log("🖥️ Setting viewport...");
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    
    // Wait for viewport to take effect
    await page.waitForTimeout(2000);

    // Get page dimensions
    const pageDimensions = await page.evaluate(() => {
      return {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        bodyHeight: document.body.scrollHeight,
        htmlHeight: document.documentElement.scrollHeight
      };
    });
    
    console.log(`📏 Page dimensions: ${pageDimensions.width}x${pageDimensions.height}px`);
    console.log(`👁️ Viewport height: ${pageDimensions.viewportHeight}px`);
    console.log(`📄 Body height: ${pageDimensions.bodyHeight}px`);
    console.log(`🌐 HTML height: ${pageDimensions.htmlHeight}px`);
    
    // Check if page has enough content to scroll
    if (pageDimensions.bodyHeight <= pageDimensions.viewportHeight) {
      console.log("⚠️ WARNING: Page appears to have no scrollable content!");
      console.log("This might cause recording issues.");
    }
    
    // Test if scrolling actually works
    console.log("🧪 Testing scroll functionality...");
    await page.evaluate(() => {
      const initialScroll = window.scrollY;
      window.scrollTo(0, 500);
      console.log(`Initial scroll position: ${initialScroll}`);
      console.log(`After scrollTo(0, 500): ${window.scrollY}`);
      
      if (window.scrollY === 0) {
        console.error("❌ SCROLLING IS BLOCKED! Page cannot scroll!");
      } else {
        console.log("✅ Scrolling works! Page can scroll.");
      }
      
      // Reset to top
      window.scrollTo(0, 0);
    });
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

    try {
      // Final preparation before recording
      console.log("⏳ Final preparation before recording...");
      await page.waitForTimeout(3000);
      
      // Start recording
      await recorder.start(videoFile);
      console.log("🎥 Recording started, beginning improved smooth scroll...");

      // Use the improved scrolling function
      const scrollPromise = performSmoothScroll(page);

      // Add timeout protection (max 3 minutes for scrolling)
      const scrollWithTimeout = Promise.race([
        scrollPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Scrolling timeout after 3 minutes')), 180000)
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

      // Add background music if available
      const audioFile = pickRandomAudio();
      if (audioFile) {
        console.log(`🎵 Adding background music: ${path.basename(audioFile)}`);
        const outputWithMusic = videoFile.replace(".mp4", "_with_music.mp4");
        try {
          console.log("🔧 Running FFmpeg to add background music...");
          
          let ffmpegPath = 'ffmpeg';
          if (process.platform === 'win32') {
            const possiblePaths = [
              'C:\\dev\\ffmpeg\\ffmpeg.exe',
              'C:\\ffmpeg\\bin\\ffmpeg.exe',
              'ffmpeg.exe'
            ];
            
            for (const possiblePath of possiblePaths) {
              try {
                execSync(`"${possiblePath}" -version`, { stdio: 'pipe' });
                ffmpegPath = possiblePath;
                break;
              } catch (e) {
                // Try next path
              }
            }
          }
          
          execSync(`"${ffmpegPath}" -y -i "${videoFile}" -i "${audioFile}" -c:v libx264 -b:v 2000k -preset veryfast -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest "${outputWithMusic}"`, { stdio: 'pipe' });
          console.log(`🎵 Added background music: ${outputWithMusic}`);
        } catch (ffmpegErr) {
          console.error(`❌ FFmpeg error while adding music:`, ffmpegErr.message);
        }
      } else {
        console.log("⚠️ No background music files found in /public/audio");
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
    console.log("💡 Please create a sites.txt file with URLs to record (one per line)");
    process.exit(1);
  }

  const urls = fs.readFileSync(sitesFile, "utf-8")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  if (urls.length === 0) {
    console.error("❌ No valid URLs found in sites.txt!");
    process.exit(1);
  }

  console.log(`🚀 Starting enhanced recording of ${urls.length} sites (No TTS version)...`);
  console.log("📋 URLs to record:");
  urls.forEach((url, index) => console.log(`  ${index + 1}. ${url}`));
  
  for (const url of urls) {
    console.log(`\n${'='.repeat(60)}`);
    await recordWebsite(url);
    console.log(`${'='.repeat(60)}\n`);
  }

  console.log("\n🎉 All enhanced recordings completed!");
})();
