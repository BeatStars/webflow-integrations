import { signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";


export function updateUserUI(userData, userAuth) {
    let loggedNav = document.getElementById("votingAs");
    let loginBanner = document.getElementById("login_banner");

    loggedNav.style.display = "flex";
    loginBanner.style.display = "none";

    loggedNav.innerHTML = `
      <div class="x">
          <div style="text-align: right; display: flex; justify-content: center; flex-direction: column;">
          <p style="margin-bottom: 0; font-size: 0.8rem; color: white">${userData.displayName}</p>
          <p id="logout-button" style="margin-bottom: 0px">Logout</p>
      </div>
          <div style="position: relative">
              ${renderLoginMethod(userData.providerData[0].providerId)}
              <img src="${userData.photoURL}" style="width: 36px; height: 36px; border-radius: 100%">
          </div>
      </div>
  `
    const logoutButton = document.getElementById("logout-button");
    logoutButton.addEventListener("click", function () {
        signOut(userAuth).then(() => {
            window.location.reload()
        }).catch((error) => { });
    })
}

function renderLoginMethod(providerId) {
    let html;
    switch (providerId) {
        case "google.com":
            html = `
                  <img src="https://www.transparentpng.com/thumb/google-logo/google-logo-png-icon-free-download-SUF63j.png" style="position: absolute; right: 0; bottom: 0; width: 16px; height: 16px" />
              `
            break;
        case "twitter.com":
            html = `
                  <img src="https://cdn4.iconfinder.com/data/icons/social-media-icons-the-circle-set/48/twitter_circle-512.png" style="position: absolute; right: 0; bottom: 0; width: 16px; height: 16px" />
              `
            break;
    }
    return html
}

export function callVote(btn, userInfo, origin, url) {
    console.log("Button clicked")
    let user = userInfo;
    let slug = btn.getAttribute('slug');
    let totalVotes = btn.childNodes[1].innerText;

    fetch(url + `/new-vote/${slug}&${user}&${contestName}&${origin}`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userToken}`
        },
        body: JSON.stringify({ success: true })
    })
        .then(response => {
            return response.json()
        })
        .then(json => {
            if (json.vote) {
                let vote = parseInt(totalVotes) + 1
                btn.childNodes[1].innerText = vote.toString()
                btn.classList.add("success")
            }
        })
        .catch(err => { console.log(err) })
}

export function getUserToken() {
    const localStorageToken = localStorage.getItem('access_token');
    if (localStorageToken) { return localStorageToken; }
    const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='));
    if (cookieToken) {
        return cookieToken.split('=')[1];
    }
    return null;
}

export function callError(title, message) {
    let toast = document.getElementById("toastMessage");
    let toastHeading = document.getElementById("toastHeading");
    let toastText = document.getElementById("toastText");

    toastHeading.innerText = title || "No description provided"
    toastText.innerText = message || "No title provided"

    toast.classList.add("error")
    toast.style.opacity = "1";
    toast.style.marginBottom = "132px"
    toast.style.transition = "all 650ms"

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.marginBottom = "-100px"
        toast.style.transition = "all 650ms"
        toast.classList.remove("error")
    }, 5000);
}
export function handleLoginBanner() {
    let loginBanner = document.getElementById("login_banner");
    
    if (loginBanner.style.opacity === "1") { //hide the banner
        return
    }

    loginBanner.style.opacity = "1"
    loginBanner.style.marginBottom = "32px"
    loginBanner.style.transition = "all 650ms"
}