import { getMemberQuery } from './queries.js'
export async function getUserToken(url) {
    const tokenOnParams = getTokenOnParams(url);
    const tokenOnStorage = getTokenOnStorage();
    const tokenOnCookies = getTokenOnCookies()
  
    //If user doens't have token on URL param or storage return false to main function
    if (!tokenOnParams && !tokenOnStorage && !tokenOnCookies) return false
  
    //If token its not found on storage, save it for future calls
    if (tokenOnParams) addTokenToLocalStorage(
      tokenOnParams.access_token,
      tokenOnParams.refresh_token,
      tokenOnParams.access_token_expiration
    )
  
    if (tokenOnCookies) addTokenToLocalStorage(
      tokenOnCookies.access_token,
      tokenOnCookies.refresh_token,
      tokenOnCookies.access_token_expiration
    )
  
    return tokenOnParams.access_token || tokenOnStorage || tokenOnCookies.access_token
  }
  
  export async function getMemberDetails(graphUrl, token) {
    const options = {
      method: 'POST',
      headers: {
        'Accept': "application/json",
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: getMemberQuery })
    }
    const request = await fetch(graphUrl, options)
    if (request.status === 401) return false
    const response = await request.json()
    return {
      ...response.data.member,
      publishingDeal: { ...response.data.publishingDeal }
  
    }
  }
  
  export async function logoutUser() {
    //Destroy cookies and clean localStorage           
    deleteCookie('access_token');
    deleteCookie('expiration_date');
    deleteCookie('access_token_expiration');
    deleteCookie('refresh_token');
  
    localStorage.removeItem("access_token");
    localStorage.removeItem("expiration_date");
    localStorage.removeItem("access_token_expiration");
    localStorage.removeItem("refresh_token");
    //Remove URL params for prevent infinite loop
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    url.search = '';
    const modifiedUrl = url.href;
    //Reload page to update UI
    setTimeout(() => { window.location.href = modifiedUrl }, 1000);
    return "finished"
  }
  
  function getTokenOnParams(url) {
    const userUrl = new URL(url)
    const urlParams = new URLSearchParams(userUrl.search)
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')
    const tokenExpiration = urlParams.get('expiration_date')
  
    if (!accessToken || !refreshToken || !tokenExpiration) return false
  
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      access_token_expiration: tokenExpiration
    }
  }
  
  function getTokenOnCookies() {
    const accessToken = getCookieByName('access_token')
    const refreshToken = getCookieByName('refresh_token')
    const tokenExpiration = getCookieByName('access_token_expiration')
  
    if (!accessToken || !refreshToken || !tokenExpiration) return false
  
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      access_token_expiration: tokenExpiration
    }
  }
  
  function getTokenOnStorage() {
    return localStorage.getItem("access_token")
  }
  
  function addTokenToLocalStorage(userToken, refreshToken, expirationDate) {
    localStorage.setItem('access_token', userToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('access_token_expiration', expirationDate);
  }
  
  function getCookieByName(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
  
  function deleteCookie(name) {
    document.cookie = name +
      "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=.beatstars.com;path=/";
  }