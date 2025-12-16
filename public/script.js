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

    // Icons
    const PLAY_ICON = "M8 5v14l11-7z";
    const PAUSE_ICON = "M6 19h4V5H6v14zm8-14v14h4V5h-4z";

    // Fetch streams from static JSON (Netlify compatible)
    async function fetchStreams() {
        try {
            const response = await fetch('streams.json');
            if (!response.ok) throw new Error('Erreur réseau');
            streams = await response.json();
            console.log('Flux chargés:', streams);
        } catch (error) {
            console.error('Erreur lors du chargement des flux:', error);
            streamInfo.textContent = "Erreur de chargement des flux.";
        }
    }

    // Load and Play Stream
    function loadStream(index) {
        if (index >= streams.length) {
            updateStatus(false, "Aucun flux disponible");
            return;
        }

        const streamUrl = streams[index];
        console.log(`Tentative de lecture du flux ${index + 1}: ${streamUrl}`);

        audioPlayer.src = streamUrl;
        audioPlayer.load();

        // Timeout to handle hang scenarios
        const playPromise = audioPlayer.play();

        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Play started successfully
                updateStatus(true, "EN DIRECT");
                setIsPlaying(true);
            }).catch(error => {
                console.warn(`Échec du flux ${index + 1}:`, error);
                // Try next stream
                tryNextStream();
            });
        }
    }

    function tryNextStream() {
        if (currentStreamIndex < streams.length - 1) {
            currentStreamIndex++;
            console.log("Passage au flux suivant...");
            streamInfo.textContent = "Tentative de connexion au flux de secours...";
            loadStream(currentStreamIndex);
        } else {
            console.error("Tous les flux ont échoué.");
            updateStatus(false, "Flux indisponible");
            setIsPlaying(false);
            setLoading(false);
        }
    }

    // UI Updates
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
            setLoading(false);
        } else {
            playIconPath.setAttribute('d', PLAY_ICON);
        }
    }

    function setLoading(loading) {
        if (loading) {
            loadingSpinner.classList.remove('hidden');
        } else {
            loadingSpinner.classList.add('hidden');
        }
    }

    function togglePlay() {
        if (streams.length === 0) {
            streamInfo.textContent = "Chargement des flux...";
            return;
        }

        if (isPlaying) {
            audioPlayer.pause();
            updateStatus(false, "PAUSE");
            setIsPlaying(false);
        } else {
            setLoading(true);
            streamInfo.textContent = "Connexion...";
            // If starting fresh or after error, reset index? 
            // Better to keep trying current first, if it fails fetch logic handles next.
            // But if src is empty we need to start.
            if (!audioPlayer.src || audioPlayer.src === window.location.href) {
                loadStream(0);
            } else {
                playPromise = audioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        updateStatus(true, "EN DIRECT");
                        setIsPlaying(true);
                    }).catch(() => {
                        tryNextStream();
                    });
                }
            }
        }
    }

    // Event Listeners
    playBtn.addEventListener('click', togglePlay);

    audioPlayer.addEventListener('error', (e) => {
        console.error("Erreur audio native:", e);
        tryNextStream();
    });

    audioPlayer.addEventListener('waiting', () => {
        setLoading(true);
        streamInfo.textContent = "Mise en mémoire tampon...";
    });

    audioPlayer.addEventListener('playing', () => {
        setLoading(false);
        updateStatus(true, "EN DIRECT");
        streamInfo.textContent = "Lecture en cours";
    });

    // Initialize
    fetchStreams();
});
