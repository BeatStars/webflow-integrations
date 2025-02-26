
import {
    getAuth,
    signInWithPopup,
    signInWithRedirect,
    TwitterAuthProvider,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
  } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
  
  export function checkContestProgress(dates) {
    const now = new Date();
  
    const getPeriodStatus = (start, end) => getStatus(start, end, now);
    const progressCheck = {
      submissionPeriod: getPeriodStatus(dates.submission_starts, dates.submission_ends),
      votingPeriod: getPeriodStatus(dates.voting_starts, dates.voting_ends),
      reviewPeriod: getPeriodStatus(dates.review_starts, dates.review_ends),
    };
  
    return progressCheck;
  }
  
  export function getStatus(startDate, endDate, now) {
    const start = new Date(startDate);
    const end = new Date(endDate);
  
    if (now > end) return "closed";
    if (now >= start && now <= end) return "in_progress";
    return "future";
  }
  
  export async function copyEntryToClipboard() {
    try {
      let pageUrl = window.location.href;
      let checkParams = pageUrl.split('&');
      //Remove share param to remove banner
      if (checkParams.length != 1) { pageUrl = checkParams[0] }
      //Copy to clipboard only the desired url
      await navigator.clipboard.writeText(pageUrl);
    } catch (error) {
      console.error(error);
    }
  }
  
  export function stringToObj(array) {
    let newArr = [];
    array.forEach(item => {
      newArr.push(JSON.parse(item))
    })
    return newArr
  }
  
  export function formatStatusText(string) {
    if (string === "closed") return "Closed"
    if (string === "in_progress") return "In Progress"
    if (string === "future") return "Soon"
    return
  }
  
  export async function newFirebaseLogin(isCompatible, firebase, provider) {
    if (isCompatible) {
      const redirectUrl = window.location.href; // Replace with your app's login URL
      // Inform user to open in external browser
      alert("To log in, please open this link in an external browser." + redirectUrl);
      // window.location.href = `googlechrome://navigate?url=${redirectUrl}`;
      // window.location = 'https://google.com';
      // window.open(redirectUrl, '_system');
      window.open(redirectUrl, '_blank')
    } else {
      // Use signInWithPopup for regular browsers
      signInWithPopup(firebase, provider)
        .then((result) => {
          window.location.reload()
        }).catch((error) => {});
    }
  }
  
  export async function firebaseLogin(firebase, provider) {
    signInWithPopup(firebase, provider)
      .then((result) => {
        window.location.reload()
      }).catch((error) => {});
  }
  
  export async function firebaseLogout(auth) {
    let x;
    signOut(auth).then(() => {
      x = true
      // Sign-out successful.
    }).catch((error) => {
      console.log(error)
      x = false
    });
    return x
  }
  
  export async function sendEntryDataNoToken(data, user) {
    try {
      const options = {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entry: data, member: user })
      }
      const request = await fetch(
        `https://wf-contest-middleware-mpw8.vercel.app/api/contest/new-entry`, options)
      const response = await request.json()
  
      if (response.status !== 200) return response
      return response.data
    } catch (error) {
      return error
    }
  }
  
  export async function sendEntryData(token, data) {
    try {
      const options = {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify(data)
      }
      const request = await fetch(
        `https://wf-contest-middleware-mpw8.vercel.app/api/contest/new-entry`, options)
      const response = await request.json()
  
      if (response.status !== 200) return response
      return response.data
    } catch (error) {
      return error
    }
  }
  
  export async function sendVoteDataNoToken(data) {
  
    let header = { "Content-Type": "application/json" }
  
    try {
      const options = {
        method: 'POST',
        headers: header,
        body: JSON.stringify(data)
      }
      const request = await fetch(`https://wf-contest-middleware-mpw8.vercel.app/api/contest/vote`,
        options)
      const response = await request.json()
  
      if (response.status !== 200) return response
      return response.data
    } catch (error) {
      return error
    }
  }
  
  export async function sendVoteData(data, token) {
  
    let header = { "Content-Type": "application/json" }
  
    if (token) {
      header = { ...header, "Authorization": token }
    }
  
    console.log(header)
  
    try {
      const options = {
        method: 'POST',
        headers: header,
        body: JSON.stringify(data)
      }
      const request = await fetch(`https://wf-contest-middleware-mpw8.vercel.app/api/contest/vote`,
        options)
      const response = await request.json()
  
      if (response.status !== 200) return response
      return response.data
    } catch (error) {
      return error
    }
  }
  
  export function getVoteCard(element) {
    if (element.classList && element.classList.contains('card-item__voting-count__wrapper')) {
      return element;
    }
  
    while (element.parentElement) {
      element = element.parentElement;
      if (element.classList && element.classList.contains('card-item__voting-count__wrapper')) {
        return element;
      }
    }
    return false;
  
  }
  
  export async function getMyEntry(memberId, contestId) {
    const options = { method: 'GET' }
    const request = await fetch(
      `https://wf-contest-middleware-mpw8.vercel.app/api/contest/my-entry?id=${memberId}&contest=${contestId}`,
      options)
    const response = await request.json()
    return response
  }
  
  