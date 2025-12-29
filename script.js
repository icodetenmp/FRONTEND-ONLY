const upLoad = document.querySelector('.Upload');
const upbtn = document.querySelectorAll('.Up');
const delBtn = document.querySelectorAll('.Del');
const about = document.querySelector('.aboutbtn');
const modal = document.getElementById("parentModal");
const closebtn = document.querySelector('.close');
const form = document.getElementById('uploadForm');
const ham = document.querySelector(".hamburger");
const ul = document.querySelector(".ul");
const footer = document.querySelector('.foot');
const container = document.querySelector(".flex");

let currentTrackId = null;
let isOpen = false;
let manageMode = false;
const BACKEND_URL = "https://my-music-app-b.onrender.com";

// Hamburger toggle
ham.addEventListener("click", () => {
    isOpen = !isOpen;
    ul.style.visibility = isOpen ? "visible" : "hidden";
});

// Manage Mode toggle
upLoad.addEventListener("click", (e) => {
    e.stopPropagation();
    manageMode = !manageMode;
    document.querySelectorAll('.Up').forEach(but => {
        but.style.visibility = manageMode ? "visible" : "hidden";
    });
    console.log(manageMode ? "Manage Mode ON" : "Manage Mode OFF");
});

// Edit track
container.addEventListener("click", (e) => {
    const btn = e.target.closest(".Up");
    if (!btn) return;
    const trackEl = btn.closest(".container");
    const trackId = trackEl.dataset.id;
    const artist = trackEl.querySelector(".text2").textContent;
    const title = trackEl.querySelector(".title").textContent;
    editTrack(trackId, artist, title);
});

// Close modal
closebtn.addEventListener("click", () => {
    modal.style.opacity = "0";
    modal.style.transform = "translateY(-20px)";
    setTimeout(() => modal.style.display = "none");
});

// Submit update
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentTrackId) return;

    const artist = form.querySelector('[name="artist"]').value;
    const title = form.querySelector('[name="title"]').value;
    if (!artist || !title) return alert("Please fill in both fields");

    const coverFile = form.querySelector('[name="cover"]').files[0];
    const audioFile = form.querySelector('[name="audio"]').files[0];
    const videoFile = form.querySelector('[name="video"]').files[0];

    const formData = new FormData();
    formData.append("artist", artist);
    formData.append("title", title);
    if (coverFile) formData.append("cover", coverFile);
    if (audioFile) formData.append("audio", audioFile);
    if (videoFile) formData.append("video", videoFile);

    try {
        const res = await fetch(`${BACKEND_URL}/api/tracks/${currentTrackId}`, {
            method: "PUT",
            body: formData,
        });
        if (!res.ok) throw new Error("Update failed");
        const data = await res.json();

        // Update UI
        const trackCard = document.querySelector(`[data-id="${currentTrackId}"]`);
        if (trackCard) {
            trackCard.querySelector(".text2").textContent = data.artist;
            trackCard.querySelector(".title").textContent = data.title;
            if (data.coverPath) trackCard.querySelector("img").src = `${data.coverPath}?v=${Date.now()}`;
            if (data.audioPath) trackCard.querySelector("audio").src = data.audioPath;
        }

        if (data.videoPath) {
            const videoPlayer = document.getElementById("videoPlayer");
            videoPlayer.src = data.videoPath;
            videoPlayer.load();
        }

        form.reset();
        modal.style.display = "none";
        fetchTrack(); // refresh UI
        alert("Track updated successfully!");
    } catch (err) {
        console.error(err);
        alert("Failed to update track.");
    }
});

// Fetch tracks
async function fetchTrack() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/tracks`);
        const tracks = await res.json();
        container.innerHTML = "";

        tracks.forEach(track => {
            const trackEl = document.createElement("div");
            trackEl.classList.add("container");
            trackEl.dataset.id = track.id;

            trackEl.innerHTML = `
                <div class="image">
                    <img class="imge" src="${track.coverPath}" />
                </div>
                <div class="text">
                    <p><span class="title">${track.title}</span></p>
                    <p class="text2">${track.artist}</p>
                    <div class="medialine">
                        <hr>
                        <hr class="line">
                        <audio class="audio" src="${track.audioPath}" preload="metadata"></audio>
                        <div class="playbutton"><i class="fa-solid fa-play"></i></div>
                    </div>
                </div>
                <div id="upDelbtn">
                    <button class="Up" data-id="${track.id}">Update</button>
                </div>
            `;
            container.appendChild(trackEl);

            // Set video player if present
            if (track.videoPath) {
                const videoPlayer = document.getElementById("videoPlayer");
                videoPlayer.src = track.videoPath;
                videoPlayer.load();
            }

            // Play button logic
            trackEl.querySelector('.playbutton').addEventListener("click", (e) => {
                const audio = trackEl.querySelector(".audio");
                if (!audio || !audio.src) return alert("No audio source found!");

                document.querySelectorAll(".audio").forEach(a => {
                    if (a !== audio) {
                        a.pause();
                        const otherBtn = a.closest(".container")?.querySelector(".playbutton");
                        if (otherBtn) otherBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    }
                });

                if (audio.paused) {
                    audio.play();
                    e.currentTarget.innerHTML = '<i class="fa-solid fa-pause"></i>';
                } else {
                    audio.pause();
                    e.currentTarget.innerHTML = '<i class="fa-solid fa-play"></i>';
                }

                // Now Playing
                const NowTitleEl = document.getElementById("Nowtitle");
                const nowArtistEl = document.getElementById("Nowartist");
                const nowCoverEl = document.getElementById("Nowcover");

                if (NowTitleEl) NowTitleEl.textContent = track.title;
                if (nowArtistEl) nowArtistEl.textContent = track.artist;
                if (nowCoverEl) nowCoverEl.src = track.coverPath;
            });

            // Progress bar
            const audio = trackEl.querySelector(".audio");
            audio.addEventListener("timeupdate", () => {
                if (!audio.duration) return;
                const line = trackEl.querySelector(".line");
                line.style.width = (audio.currentTime / audio.duration * 100) + "%";
            });
            audio.addEventListener("ended", () => {
                trackEl.querySelector(".playbutton").innerHTML = '<i class="fa-solid fa-play"></i>';
                trackEl.querySelector(".line").style.width = "0%";
            });
        });
    } catch (err) {
        console.error("Error fetching tracks:", err);
    }
}

// Edit track modal
function editTrack(id, artist, title) {
    currentTrackId = id;
    modal.style.display = "block";
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
    modal.style.transform = "translateY(0)";

    form.querySelector('[name="artist"]').value = artist;
    form.querySelector('[name="title"]').value = title;

    form.querySelector('[name="cover"]').value = "";
    form.querySelector('[name="audio"]').value = "";
    form.querySelector('[name="video"]').value = "";
}

// Initialize
document.addEventListener("DOMContentLoaded", fetchTrack);
