export function updateUserUI(userData){
    console.log(userData)
  loggedNav.style.display = "flex";
  loginBanner.style.display = "none";

  loggedNav.innerHTML = `
    <div class="x">
        <div style="text-align: right">
        <p class="voting_as">Voting as:</p>
        <p style="margin-bottom: 0; font-size: 0.8rem">${userData.displayName}</p>
        <p id="logout-button">Logout</p>
    </div>
        <img src="${userData.photoURL}" style="width: 36px; height: 36px; border-radius: 100%">
    </div>
`
  const logoutButton = document.getElementById("logout-button");
  logoutButton.addEventListener("click", function () {
    signOut(auth).then(() => {
      window.location.reload()
    }).catch((error) => { });
  })
}

export function callVote(btn, userInfo, origin) {
  console.log("Button clicked")
  let user = userInfo;
  let slug = btn.getAttribute('slug');
  let totalVotes = btn.childNodes[1].innerText;

  fetch(currentEnvironment + `/new-vote/${slug}&${user}&${contestName}&${origin}`, {
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
  if (localStorageToken) {return localStorageToken;}
  const cookieToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('access_token='));
  if (cookieToken) {
    return cookieToken.split('=')[1];
  }
  return null;
}