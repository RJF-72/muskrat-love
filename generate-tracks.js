const fs = require('fs');
const path = require('path');

const musicDir = path.join(__dirname, 'rrmgmusic');
const outputFile = path.join(__dirname, 'tracks.js');

const supportedExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac'];

function getTrackDuration(filePath, callback) {
    const { spawn } = require('child_process');
    const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath
    ]);
    
    let output = '';
    ffprobe.stdout.on('data', (data) => { output += data; });
    ffprobe.on('close', (code) => {
        if (code === 0 && output) {
            const seconds = parseFloat(output);
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            callback(`${mins}:${secs.toString().padStart(2, '0')}`);
        } else {
            callback('0:00');
        }
    });
    ffprobe.on('error', () => callback('0:00'));
}

function generateTracks() {
    fs.readdir(musicDir, (err, files) => {
        if (err) {
            console.error('Error reading music directory:', err);
            return;
        }

        const tracks = files
            .filter(file => supportedExtensions.includes(path.extname(file).toLowerCase()))
            .map((file, index) => {
                const title = path.basename(file, path.extname(file))
                    .replace(/\(Mastered with Thunder at \d+pct\)/gi, '')
                    .replace(/\s*\(\d+\)\s*/g, ' ')
                    .trim();
                return {
                    title: title,
                    artist: 'Redemption Road Artists',
                    src: `rrmgmusic/${file}`,
                    time: '0:00'
                };
            });

        const jsContent = `// Auto-generated tracklist - Run "node generate-tracks.js" after adding new music
const tracks = ${JSON.stringify(tracks, null, 4)};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = tracks;
}`;

        fs.writeFileSync(outputFile, jsContent);
        console.log(`Generated tracks.js with ${tracks.length} tracks`);
    });
}

generateTracks();
