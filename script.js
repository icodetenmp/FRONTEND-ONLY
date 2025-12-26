const upLoad = document.querySelector('.Upload');
const upbtn = document.querySelectorAll('.Up');
const delBtn = document.querySelectorAll('.Del');
const about = document.querySelector('.aboutbtn');
const modal = document.getElementById("parentModal");
const closebtn = document.querySelector('.close');
const form = document.getElementById('uploadForm');
const ham = document.querySelector(".hamburger")
const ul = document.querySelector(".ul");
const footer = document.querySelector('.foot');
const container = document.querySelector(".flex");
console.log(upLoad);




let currentTrackId = null;
let isOpen = false;
let manageMode = false;
const BACKEND_URL = "https://my-music-app-backend-vq2k.onrender.com"

ham.addEventListener("click", ()=>{
    isOpen = !isOpen;

    if(isOpen){
        ul.style.visibility = "visible";
    }else{
        ul.style.visibility = "hidden";
    }
});

  //UPLOAD BUTTON
                upLoad.addEventListener("click", (e) =>{
                    e.stopPropagation();
                    manageMode = !manageMode;

                    document.querySelectorAll('.Up').forEach(but =>{
                        but.style.visibility = manageMode ? "visible" : "hidden";
                    });
                    console.log(manageMode ? "Manage Mode ON" : "Manage Mode OFF");
                });

container.addEventListener("click", (e) => {
    const btn = e.target.closest(".Up");
    if (!btn) return;

    const trackEl = btn.closest(".container");
    const trackId = trackEl.dataset.id;
    const artist = trackEl.querySelector(".text2").textContent;
    const title = trackEl.querySelector(".title").textContent;

    editTrack(trackId, artist, title);
});


   closebtn.addEventListener("click", ()=>{
        modal.style.opacity = "0";
        modal.style.transform = "translateY(-20px)";
        setTimeout(() => {
            modal.style.display = "none";
            
        })
        });

       form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentTrackId) return;

    const artist = form.querySelector('[name="artist"]').value;
    const title = form.querySelector('[name="title"]').value;

    if (!artist || !title) {
        alert("Please fill in both fields");
        return;
    }

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

        // Update the track card in the UI
        const trackCard = document.querySelector(`[data-id="${currentTrackId}"]`);
        if (trackCard) {
            trackCard.querySelector(".text2").textContent = data.artist;
            trackCard.querySelector(".title").textContent = data.title;
            if (data.coverPath) {
                trackCard.querySelector("img").src = `${BACKEND_URL}${data.coverPath}?v=${Date.now()}`;
            }
        }

        // Update video player if needed
        if (data.videoPath) {
            const videoPlayer = document.getElementById("videoPlayer");
            videoPlayer.src = `${BACKEND_URL}${data.videoPath}`;
            videoPlayer.load();
        }

        form.reset();
        modal.style.display = "none";
        fetchTrack(); // refresh track list
        alert("Track updated successfully!");
    } catch (err) {
        console.error(err);
        alert("Failed to update track.");
    }
});
 ;

 //BACKEND LOADING 
  async function fetchTrack(){

    try{
    const res = await fetch(`${BACKEND_URL}/api/tracks`);
    tracks =  await res.json();
   // console.log("Fetched tracks:", tracks);
    //console.log(tracks);

  //RENDER TRACKS
    const container = document.querySelector(".flex");
    container.innerHTML = "";

     tracks.forEach(track =>{
        //console.log('Fetched track audio path:', track.audioPath);
        const trackEl = document.createElement("div");
        trackEl.classList.add("container");
        trackEl.dataset.id = track.id;

        trackEl.innerHTML = `
         <div class="image">
                    <img class="imge"  src="${BACKEND_URL}${track.coverPath}"/>
                </div>
                <div class="text">
             <p> <span class="title">${track.title}</span></p>
                <p class="text2">${track.artist}</p>
                 <div class="medialine">
                        <hr>
                    <hr class="line">
                
                  <audio class="audio" src="${BACKEND_URL}${track.audioPath}" preload="metadata"></audio>
                    <div class="playbutton">
                    <i class="fa-solid fa-play"></i>                   
                </div>

                </div>
                </div>
                <div id="upDelbtn">
                <button class="Up" data-id="${track.id}">Update</button>
                </div>
        `;
        container.appendChild(trackEl);

        //Set video Player source fromthe first track that has a videoPath
       if(track.videoPath) {
        const videoPlayer = document.getElementById("videoPlayer");
        videoPlayer.src = BACKEND_URL + track.videoPath;
        videoPlayer.load();
       }
       
        const playBtn = trackEl.querySelector('.playbutton');
        const audio = trackEl.querySelector('.audio');
        const progressFill = trackEl.querySelector('.line');
        console.log(trackEl);

       document.addEventListener("click", (e)=>{
        const btn = e.target.closest(".playbutton");
        if (!btn) return;

        const trackEl = btn.closest('.container');
        if(!trackEl) return;

         const audio = trackEl.querySelector('.audio');
            if (!audio || !audio.src){
                alert("No audio souurce found!");
                return;
            }

            //PAUSE ALL OTHER TRACKS
            document.querySelectorAll(".audio").forEach(a =>{
                if (a !== audio){
                    a.pause();
                  const otherBtn = a.closest(".container")?.querySelector(".playbutton")
                  if(otherBtn) otherBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                }
            });
            
            //Toggle
            if (audio.paused){
                audio.play();
                    btn.innerHTML = '<i class="fa-solid fa-pause"></i>';

            } else{
                audio.pause();
                btn.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
            

        const titleEl = trackEl.querySelector(".title");
        const artistEl = trackEl.querySelector(".text2");
        const coverImg = container.querySelector(".img") || trackEl.querySelector('.imge');


        const NowTitleEl = document.getElementById("Nowtitle");
        const nowArtistEl = document.getElementById('Nowartist');
        const nowCoverEl = document.getElementById('Nowcover');

        if (NowTitleEl && titleEl) NowTitleEl.textContent = titleEl.textContent.trim();
        if (nowArtistEl && artistEl) nowArtistEl.textContent = artistEl.textContent.trim();
        if(nowCoverEl && coverImg) nowCoverEl.src = coverImg.src;




                //PROGRESSI BAR
                audio.addEventListener("timeupdate", ()=>{
                    if (!audio.duration) return;
                    const progress = (audio.currentTime / audio.duration) * 85;

                    const trackEl = btn.closest(".container");
                    const line = trackEl.querySelector(".line");
                    if (line){
                        line.style.width = progress + "%";
                    };
                })

                //Reset when song ends
                audio.addEventListener("ended", ()=>{
                    btn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    const line = btn.closest(".container").querySelector(".line");
                    if(line) line.style.width = "0%";
                });
       });



    
         });

    
         

  }catch (err) {
            console.error('error fetching tracks:', err);
            
         }

        };



  async function editTrack(id, artist, title) {
//Save track id globally
    currentTrackId = id;

     modal.style.display ="block";
     modal.style.opacity = "1";
     modal.style.pointerEvents = "auto";
     modal.style.transform = "translateY(0)";

    

    

    form.querySelector('[name="artist"]').value = artist;
    form.querySelector('[name="title"]').value = title;

    //reset file input
    form.querySelector('[name="cover"]').value = "";
    form.querySelector('[name="audio"]').value = "";
    form.querySelector('[name="video"]').value = "";

  }


    document.addEventListener("DOMContentLoaded", fetchTrack, editTrack);
