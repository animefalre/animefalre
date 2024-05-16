const seasonInp = document.getElementById("inp-season-no");
const episodeInp = document.getElementById("inp-episode-no");
const serverOneInp = document.getElementById("inp-server1-link");

document
  .getElementById("selected-anime")
  .addEventListener("change", async (e) => {
    const animeId = e.target.value;

    try {
      const response = await fetch(`/admindata?selected=${animeId}`);
      if (!response.ok) {
        throw new Error("Response error, Anime Id not found");
      }
      const data = await response.json();
      const seasonData = data.season;
      const episodeData = data.episodeNo;

      seasonInp.value = seasonData;
      episodeInp.value = episodeData;

      serverOneInp.addEventListener("input", (e) => {
        const episode = data.episode;
        const inp = e.target.value;

        episode.forEach((episode) => {
          const URLdata = episode.server1;
          if (inp === URLdata) {
            alert("URL is already in use");
          }
        });
      });
    } catch (error) {
      console.error("Fetching error: " + error);
      alert("Error fetching data: " + error.message);
    }
  });

const popupBox = document.getElementById("pop-up-box");

document.getElementById("popup-close").addEventListener("click", () => {
  popupBox.style.visibility = "hidden";
})

document.querySelectorAll(".ep-post").forEach((elem) => {
  elem.addEventListener("click", (e) => {
    const episodeClass = e.target.classList[1];
    const episodeData = document.getElementById(episodeClass);

    const name = episodeData.dataset.episodeName;
    const animeId = episodeData.dataset.episodeAnime;
    const seasonId = episodeData.dataset.episodeSeason;
    const episodeNo = episodeData.dataset.episodeNo;
    const episodeId = episodeData.dataset.episodeId;
    const views = episodeData.dataset.views;
    const cloudURL = episodeData.dataset.cloudUrl;
    var displayViews;
    if (views > 0) {
      displayViews = views;
    } else {
      displayViews = 0;
    }

    document.getElementById("ep-name").textContent = name;
    document.getElementById("episode-no").textContent = "EP " + episodeNo;
    document.getElementById("ep-season").textContent = seasonId;
    document.getElementById("views").textContent = displayViews;
    document.getElementById("ep-thumbnail-src").src = cloudURL;
    document.getElementById("img-src").textContent = cloudURL;
    document.getElementById("copy-btn").dataset.copySrc = cloudURL;
    document.getElementById("open-ep").href = `/anime/watch/${animeId}/${seasonId}/${episodeId}`;

    document.getElementById("ep-del-btn").addEventListener("click", () => {
      document.getElementById("check-popup").style.visibility = "visible";
      document.getElementById("check-popup-inp").addEventListener("input", async (val) => {
        const checkInp = val.target.value;
        console.log(checkInp);
        if (checkInp === "2008") {
          document.getElementById("check-popup").style.visibility = "hidden";
          try {
            const response = await fetch(`/delete-ep-api?animeId=${animeId}&seasonId=${seasonId}&episodeId=${episodeId}`);
            if (!response.ok) {
              throw new Error("Response error, Fetch response isn't ok" + response);
            }
            const data = await response.json();
            alert(data.episode);
          } catch (error) {
            throw new Error("Response error, unable to fetch API response" + error.message);
          }
        }
      })

    })
    popupBox.style.visibility = "visible";
  })
})



const inpServer1 = document.getElementById("inp-server1-link");
var prePlayer = document.getElementById("pre-player");

function prePlay() {
  prePlayer.src = inpServer1.value;
}


function replaceWord(input, wordToReplace, replacementWord) {
  const regex = new RegExp(`\\b${wordToReplace}\\b`, 'g');
  return input.replace(regex, replacementWord);
}

function handleInput(event) {
  const inputText = event.target.value;
  let wordToReplace;
  let replacementWord;

  // Define specific replacements
  if (inputText.includes('youtu.be')) {
    wordToReplace = 'youtu.be';
    replacementWord = 'www.youtube.com/embed';
  } else if (inputText.includes('dai.ly')) {
    wordToReplace = 'dai.ly';
    replacementWord = 'www.dailymotion.com/embed/video';
  } else {
    wordToReplace = ''; // Default case if no specific word is found
    replacementWord = '';
  }

  // Replace the word in the input text
  let newText = inputText;
  if (wordToReplace && replacementWord) {
    newText = replaceWord(inputText, wordToReplace, replacementWord);
  }

  // Update the input field with the new text
  event.target.value = newText;
  prePlay()
}

// Attach event listener to all input elements with class 'inp-url'
const inputElements = document.querySelectorAll('.inp-url');
inputElements.forEach(input => {
  input.addEventListener('input', handleInput);
});