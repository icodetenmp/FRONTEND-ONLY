const upLoad = document.querySelector('.Upload');
const modal = document.getElementById("parentModal");
const closebtn = document.querySelector('.close');
const form = document.getElementById('uploadForm');
const ham = document.querySelector(".hamburger");
const ul = document.querySelector(".ul");
const container = document.querySelector(".flex");

let currentTrackId = null;
let isOpen = false;
let manageMode = false;

const BACKEND_URL = "https://my-music-appp.onrender.com";

/* =========================
   HELPER
========================= */
function resolveMediaUrl(path) {
    if (!path) return "";
    // Only prepend BACKEND_URL if path is relative
    return path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
}

/* =========================
   HAMBURGER
========================= */
ham.addEventListener("click", () => {
    isOpen = !isOpen;
    ul.style.visibility = isOpen ? "visible" : "hidden";
});

/* =========================
   MANAGE MODE
========================= */
upLoad.addEventListener("click", (e) => {
    e.stopPropagation();
    manageMode = !manageMode;
    document.querySelectorAll('.Up').forEach(btn => {
        btn.style.visibility = manageMode ? "visible" : "hidden";
    });
});

/* =========================
   OPEN EDIT MODAL
========================= */
container.addEventListener("click", (e) => {
    const btn = e.target.closest(".Up");
    if (!btn) return;

    const trackEl = btn.closest(".container");
    editTrack(
        trackEl.dataset.id,
        trackEl.querySelector(".text2").textContent,
        trackEl.querySelector(".title").textContent
    );
});

/* =========================
   CLOSE MODAL
========================= */
function closeModal() {
    modal.style.opacity = "0";
    modal.style.transform = "translateY(-20px)";
    modal.style.pointerEvents = "none";
    setTimeout(() => modal.style.display = "none", 300);
}

closebtn.addEventListener("click", closeModal);
window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

/* =========================
   SUBMIT UPDATE
========================= */
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentTrackId) return;

    const artist = form.artist.value.trim();
    const title = form.title.value.trim();

    if (!artist || !title) {
        alert("Artist and title are required");
        return;
    }

    const formData = new FormData();
    formData.append("artist", artist);
    formData.append("title", title);

    if (form.cover.files[0]) formData.append("cover", form.cover.files[0]);
    if (form.audio.files[0]) formData.append("audio", form.audio.files[0]);
    if (form.video.files[0]) formData.append("video", form.video.files[0]);

    try {
        const res = await fetch(`${BACKEND_URL}/api/tracks/${currentTrackId}`, {
            method: "PUT",
            body: formData
        });
        console.log("Response status:", res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.log('Eroor response:', errorText);
            throw new Error("Update failed");
        }

        const updatedTrack = await res.json();
        console.log("Updated:", updatedTrack);

        await fetchTracks();   // ONE fetch, not 3
        closeModal();
        form.reset();

        alert("Track updated successfully!");
    } catch (err) {
        console.error(err);
        alert("Update Failed");
    }
});


/* =========================
   FETCH TRACKS
========================= */
async function fetchTracks() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/tracks`);
        const tracks = await res.json();

        container.innerHTML = "";

        tracks.forEach(track => {
            const coverSrc = resolveMediaUrl(track.coverPath);
            const audioSrc = resolveMediaUrl(track.audioPath);
            const videoSrc = resolveMediaUrl(track.videoPath);

            const trackEl = document.createElement("div");
            trackEl.className = "container";
            trackEl.dataset.id = track.id;

            trackEl.innerHTML = `
                <div class="image">
                    <img class="imge" src="${coverSrc}" />
                </div>
                <div class="text">
                    <p><span class="title">${track.title}</span></p>
                    <p class="text2">${track.artist}</p>
                    <div class="medialine">
                        <hr>
                        <hr class="line">
                        <audio class="audio" src="${audioSrc}" preload="metadata"></audio>
                        <div class="playbutton"><i class="fa-solid fa-play"></i></div>
                    </div>
                </div>
                <div id="upDelbtn">
                    <button class="Up" style="visibility:${manageMode ? "visible" : "hidden"}">Update</button>
                </div>
            `;

            container.appendChild(trackEl);

            const playBtn = trackEl.querySelector(".playbutton");
            const audio = trackEl.querySelector(".audio");

            /* ===== PLAY BUTTON ===== */
            playBtn.addEventListener("click", () => {
                document.querySelectorAll(".audio").forEach(a => {
                    if (a !== audio) {
                        a.pause();
                        a.closest(".container")
                         .querySelector(".playbutton")
                         .innerHTML = '<i class="fa-solid fa-play"></i>';
                    }
                });

                if (audio.paused) {
                    audio.play();
                    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                } else {
                    audio.pause();
                    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                }

                document.getElementById("Nowtitle").textContent = track.title;
                document.getElementById("Nowartist").textContent = track.artist;
                document.getElementById("Nowcover").src = coverSrc;
            });

            /* ===== PROGRESS BAR ===== */
            audio.addEventListener("timeupdate", () => {
                if (!audio.duration) return;
                trackEl.querySelector(".line").style.width =
                    (audio.currentTime / audio.duration * 80) + "%";
            });
            audio.addEventListener("ended", () => {
                playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                trackEl.querySelector(".line").style.width = "0%";
            });

            /* ===== VIDEO PLAYER ===== */
            if (videoSrc) {
                const videoPlayer = document.getElementById("videoPlayer");
                videoPlayer.src = videoSrc;
                videoPlayer.load();
            }
        });

    } catch (err) {
        console.error("Fetch error:", err);
    }
}

/* =========================
   EDIT MODAL
========================= */
function editTrack(id, artist, title) {
    currentTrackId = id;

    modal.style.display = "block";
    modal.style.opacity = "1";
    modal.style.transform = "translateY(0)";
    modal.style.pointerEvents = "auto";

    form.artist.value = artist;
    form.title.value = title;

    form.cover.value = "";
    form.audio.value = "";
    form.video.value = "";
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", fetchTracks);
