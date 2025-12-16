document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const playIconPath = playBtn.querySelector('path');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = statusIndicator.querySelector('.status-text');
    const streamInfo = document.getElementById('streamInfo');
    const loadingSpinner = document.getElementById('loadingSpinner');

    let streams = [];
    let currentStreamIndex = 0;
    let isPlaying = false;
    let hls = null;

    // Icons
    const PLAY_ICON = "M8 5v14l11-7z";
    const PAUSE_ICON = "M6 19h4V5H6v14zm8-14v14h4V5h-4z";

    // Initialize
    fetchStreams();

    async function fetchStreams() {
        try {
            const response = await fetch('streams.json');
            if (!response.ok) throw new Error('Erreur réseau');
            streams = await response.json();
            console.log('Flux chargés:', streams);
        } catch (error) {
            console.error('Erreur lors du chargement des flux:', error);
            streamInfo.innerText = "Erreur de chargement des flux.";
        }
    }

    async function parsePlaylist(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();

            // Basic parsers
            if (url.endsWith('.m3u')) {
                const lines = text.split('\n');
                for (let line of lines) {
                    line = line.trim();
                    if (line && !line.startsWith('#')) {
                        return line;
                    }
                }
            } else if (url.endsWith('.pls')) {
                const match = text.match(/File1=(.*)/i);
                if (match && match[1]) {
                    return match[1].trim();
                }
            }
            return null;
        } catch (e) {
            console.warn("Erreur parsing playlist:", e);
            return null;
        }
    }

    async function loadStream(index) {
        if (index >= streams.length) {
            console.error("Tous les flux ont échoué.");
            updateStatus(false, "Flux indisponible");
            setIsPlaying(false);
            setLoading(false);
            return;
        }

        let streamUrl = streams[index];
        console.log(`Tentative de lecture du flux ${index + 1}: ${streamUrl}`);
        streamInfo.innerText = "Connexion...";

        // Handle Playlists (.m3u, .pls) that are NOT m3u8
        if ((streamUrl.endsWith('.m3u') || streamUrl.endsWith('.pls')) && !streamUrl.endsWith('.m3u8')) {
            console.log("Détection d'une playlist, tentative d'extraction...");
            const extractedUrl = await parsePlaylist(streamUrl);
            if (extractedUrl) {
                console.log(`URL extraite: ${extractedUrl}`);
                streamUrl = extractedUrl; // Update URL to the raw stream
            } else {
                console.warn("Impossible d'extraire l'URL, tentative suivante.");
                tryNextStream();
                return;
            }
        }

        // Cleanup existing HLS
        if (hls) {
            hls.destroy();
            hls = null;
        }

        // HLS Support
        if (Hls.isSupported() && streamUrl.endsWith('.m3u8')) {
            console.log("Utilisation de Hls.js");
            hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(audioPlayer);

            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                audioPlayer.play().catch(e => {
                    console.error("Auto-play blocked or failed", e);
                    setIsPlaying(false);
                });
            });

            hls.on(Hls.Events.ERROR, function (event, data) {
                if (data.fatal) {
                    console.error("Erreur fatale HLS:", data);
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log("Erreur réseau HLS, tentative de récupération...");
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log("Erreur média HLS, tentative de récupération...");
                            hls.recoverMediaError();
                            break;
                        default:
                            tryNextStream();
                            break;
                    }
                }
            });

        } else if (audioPlayer.canPlayType('application/vnd.apple.mpegurl') && streamUrl.endsWith('.m3u8')) {
            // Native HLS (Safari)
            console.log("Utilisation de HLS natif (Safari)");
            audioPlayer.src = streamUrl;
            audioPlayer.play().catch(console.error);
        } else {
            // Standard Audio (MP3/Icecast)
            console.log("Utilisation du lecteur standard HTML5");
            audioPlayer.src = streamUrl;
            audioPlayer.load();
            audioPlayer.play().catch(e => {
                console.warn("Échec lecture standard:", e);
                tryNextStream();
            });
        }
    }

    function tryNextStream() {
        if (currentStreamIndex < streams.length - 1) {
            currentStreamIndex++;
            console.log("Passage au flux suivant...");
            streamInfo.innerText = "Tentative flux de secours " + (currentStreamIndex + 1) + "/" + streams.length + " ...";
            loadStream(currentStreamIndex);
        } else {
            updateStatus(false, "Flux indisponible");
            streamInfo.innerText = "Impossible de lire la radio.";
            setLoading(false);
            setIsPlaying(false);
        }
    }

    // UI & Controls
    playBtn.addEventListener('click', togglePlay);

    function togglePlay() {
        if (streams.length === 0) return;

        if (isPlaying) {
            audioPlayer.pause();
            if (hls) hls.stopLoad();
            setIsPlaying(false);
            updateStatus(false, "PAUSE");
        } else {
            setIsPlaying(true);
            setLoading(true);

            // Check if we need to reload or just resume
            if (!audioPlayer.src && !hls) {
                loadStream(currentStreamIndex);
            } else {
                if (hls) hls.startLoad();
                audioPlayer.play().then(() => {
                    updateStatus(true, "EN DIRECT");
                }).catch(e => {
                    console.error("Resume failed", e);
                    loadStream(currentStreamIndex); // Force reload
                });
            }
        }
    }

    // HTML5 Audio Events
    audioPlayer.addEventListener('playing', () => {
        setLoading(false);
        setIsPlaying(true);
        updateStatus(true, "EN DIRECT");
        streamInfo.innerText = "Lecture en cours";
    });

    audioPlayer.addEventListener('waiting', () => {
        setLoading(true);
        streamInfo.innerText = "Mise en mémoire tampon...";
    });

    audioPlayer.addEventListener('error', (e) => {
        if (!hls) { // Let HLS handle its own errors if active
            console.error("Erreur audio standard:", e);
            tryNextStream();
        }
    });

    // Helpers
    function updateStatus(isLive, text) {
        if (isLive) {
            statusIndicator.classList.add('live');
            statusText.textContent = text;
        } else {
            statusIndicator.classList.remove('live');
            statusText.textContent = text;
        }
    }

    function setIsPlaying(playing) {
        isPlaying = playing;
        if (playing) {
            playIconPath.setAttribute('d', PAUSE_ICON);
            playBtn.setAttribute('aria-label', 'Pause');
        } else {
            playIconPath.setAttribute('d', PLAY_ICON);
            playBtn.setAttribute('aria-label', 'Jouer');
        }
    }

    function setLoading(loading) {
        if (loading) {
            loadingSpinner.classList.remove('hidden');
        } else {
            loadingSpinner.classList.add('hidden');
        }
    }
});
