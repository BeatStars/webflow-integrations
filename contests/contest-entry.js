/***************************
 * The following const are *
 * stored on the Webflow ***
 * header script tag. ******
 * *************************
 * graphUrl - Get GraphQL URL
 * authUrl - Get OAuth URL
 * currentEnv - Get current Env
 * webflowApi - API to send Publishing Data
 * *************************/

import {
  sendVoteDataNoToken,
  firebaseLogin,
  firebaseLogout,
  getVoteCard,
  getMyEntry
} from './contests-functions.js'

import { getUserToken, getMemberDetails } from './users-services.js';


/* ************************
 ***** FIREBASE CONFIG *****
 ************************* */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const
  firebaseApp = initializeApp(firebaseConfig),
  firebaseAuth = getAuth(firebaseApp),
  ggProvider = new GoogleAuthProvider();

const isInAppBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /FBAN|FBAV|Instagram/.test(ua);
};

/* ************************
 *** END FIREBASE CONFIG ***
 ************************* */

let firebaseBanner = document.getElementById("firebase_banner");
let shareBanner = document.getElementById("share_banner")
// let toastBanner = document.getElementById("toastMessage");

firebaseBanner.classList.remove("hide");
shareBanner.classList.remove("hide")
// toastBanner.remove("hide");

const fullPage = createApp({
  data() {
    return {
      authUrl: authUrl,
      urlParams: null,
      plan: {},
      graphUrl: graphUrl,

      entryId: null,
      entryDetails: null,
      videoId: null,
      isShareable: false,

      pageLink: null,
      elegibleBrowser: null,

      //User Data from BeatStars
      userToken: null,
      userInfo: null,
      userEntry: null,

      isLogged: false,
      loginToast: false,
      //User Data from firebaseApp
      firebaseUserInfo: null,
      //Toast handler
      showToast: false,
      toastify: { title: null, message: null },
      //Contest Data
      contestId: null,
      contestData: null,
      submissionList: null,
      //Entry Form
      showEntryForm: false,
      entryForm: {
        contest_id: null,
        name: null,
        youtube_url: null
      },
      embedData: null,
      //Fetch status
      isFetching: true,
      //Timeline Configuration
      timeline: {
        submissionPeriod: null,
        votingPeriod: null,
        reviewPeriod: null
      }
    }
  },
  async beforeMount() {
    console.log('Vue Loaded!')
    this.elegibleBrowser = isInAppBrowser()

    //Get page link to place on redirects in this page
    this.pageLink = window.location.href
    //Check if param exist to display share pop-up
    this.isShareable = this.getShareParam()
    //Get Entry ID to get data from backend
    this.entryId = this.getEntryId();

    if (!this.entryId) return window.location.href = "/"
    //Call backend with requested entry id
    this.entryDetails = await this.getEntryDetails(this.entryId);
    if (!this.entryDetails) return console.log("TODO: Error feedback when entry not found");
    //Get VideoID to assign on embed 💀
    this.videoId = this.getYoutubeVideoId(this.entryDetails.youtube_url)

    const [contestData, submissionList] = await Promise.all([
      this.getContestData(this.entryDetails.contest_id),
      this.getSubmissionList(this.entryDetails.contest_id),
    ]);

    this.submissionList = submissionList
    this.contestData = contestData
    this.timeline = this.getContestStatus(this.contestData.dates)
    // Get user token from user 's device
    this.userToken = await getUserToken(window.location.href);
    //If user has a token on client - Request user data
    if (this.userToken) this.userInfo = await getMemberDetails(this.graphUrl, this.userToken);
    //If userInfo is sucefully fetched, update isLogged variable to update UI
    if (this.userInfo) {
      console.log(this.userInfo)
      this.isLogged = true
      let response = await getMyEntry(this.userInfo.id, this.contestData.contest_id)
      if (response.status !== 404) {
        this.userEntry = response.data;
      }
    }

    //Handle users logged in using firebase (Voting System)
    onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) return
      this.firebaseUserInfo = user
    });

    //Validate Token to get user plan to check if there's special promo
    let token = this.userToken ? this.userToken : undefined;
    this.isFetching = false
  },
  methods: {
    async logout() {
      //DESTROY ALL COKKIES
      //AND LOCAL STORAGE            
      this.deleteCookie('access_token');
      this.deleteCookie('expiration_date');
      this.deleteCookie('access_token_expiration');
      this.deleteCookie('refresh_token');

      localStorage.removeItem("access_token");
      localStorage.removeItem("expiration_date");
      localStorage.removeItem("access_token_expiration");
      localStorage.removeItem("refresh_token");

      //Change Status to Update Vue UI
      this.islogged = false

      //Remove URL params for prevent infinite loop
      let currentUrl = window.location.href;
      let url = new URL(currentUrl);
      // Remove specific parameters
      url.searchParams.delete('access_token');
      url.searchParams.delete('expiration_date');
      url.searchParams.delete('access_token_expiration');
      url.searchParams.delete('refresh_token');
      const modifiedUrl = url.href;

      setTimeout(() => {
        window.location.href = modifiedUrl;
      }, 1000);
    },
    deleteCookie(name) {
      document.cookie = name +
        "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=.beatstars.com;path=/";
    },
    async beatstarsLogin() {
      return window.location.href =
        'https://oauth.beatstars.com/verify?app=WEB_STUDIO&version=3.14.0&origin=' + this
        .pageLink + '&send_callback=true&t=dark-theme'
    },
    closeShare() {
      return this.isShareable = false
    },
    openEntry(item) {
      return window.location.href = "/entry?e=" + item.slug
    },
    async nativeShare() {
      if (navigator.share) {
        // Use the Web Share API to share the current page
        navigator.share({
            url: window.location.href // Pass the current page URL
          })
          .then(() => console.log('Shared successfully.'))
          .catch(error => console.log('Error sharing:', error));
      } else {
        // Fallback for browsers that do not support the Web Share API
        console.log('Web Share API is not supported in this browser.');

      }
    },
    async copyUrl(event) {
      console.log(event.target)
      event.target.classList.add("selected")
      copyEntryToClipboard()
      setTimeout(() => {
        event.target.classList.remove("selected")
      }, 3000);
    },
    getEntryId(url) {
      let params = new URLSearchParams(document.location.search)
      let id = params.get("e")
      if (!id) return false
      return id
    },
    getShareParam(url) {
      let params = new URLSearchParams(document.location.search)
      let shareable = params.get("share")
      if (!shareable) return false
      return true
    },
    async getEntryDetails(id) {
      const options = { method: 'GET' }
      const request = await fetch(
        `https://wf-contest-middleware-mpw8.vercel.app/api/contest/entry-details?id=${id}`,
        options)
      const response = await request.json()
      return response.data
    },
    getYoutubeVideoId(url) {
      let ytUrl = new URL(url)
      let params = new URLSearchParams(ytUrl.search)
      let id = params.get("v")
      if (!id) return false
      return id
    },
    toggleToast() {
      this.showToast = !this.showToast
    },
    getContestId(url) {
      return url.pathname.split("/")[2]
    },
    toggleLoginBanner() {
      return this.loginToast = !this.loginToast
    },
    async addVote(item, element) {

      const voteCard = getVoteCard(element.target);
      const voteNumber = voteCard.querySelector(".votenumber")

      if (this.timeline.votingPeriod !== "in_progress") {
        this.toggleToast();
        this.toastify.title = "Ops! Something went wrong!"
        this.toastify.message =
          "You can't vote for this contest right now. Voting period not started or it's already over."

        setTimeout(() => {
          this.toggleToast();
        }, 5000);
        return
      }

      //If user is not logged in, show login banner
      if (!this.userInfo && !this.firebaseUserInfo) return this.toggleLoginBanner()

      let myOrigin;
      let myUserId;

      if (this.userInfo) { myOrigin = "beatstars", myUserId = this.userInfo.id }

      if (this.firebaseUserInfo) {
        myOrigin = this.firebaseUserInfo.providerData[0].providerId;
        myUserId = this.firebaseUserInfo.providerData[0].uid;

      }

      let data = {
        contest_id: this.entryDetails.contest_id,
        slug: this.entryDetails.slug,
        user_id: myUserId,
        origin: myOrigin
      }

      let vote = await sendVoteDataNoToken(data);

      if (!vote.submit) {
        this.toggleToast();
        this.toastify.title = "Ops! Something went wrong!"
        this.toastify.message = vote.message

        setTimeout(() => {
          this.toggleToast();
        }, 5000);
        return
      }

      voteNumber.innerText = parseInt(voteNumber.innerText) + 1
      voteCard.classList.add("success")
      return
    },
    async getContestData(contestId) {
      const options = { method: 'GET' }
      const request = await fetch(
        `https://wf-contest-middleware-mpw8.vercel.app/api/contest/details?contest-name=${contestId}`,
        options)
      const response = await request.json()

      return {
        ...response.data,
        cards: this.convertStringIntoObj(response.data.cards),
        faq: this.convertStringIntoObj(response.data.faq)
      }
    },
    async googleLogin() {
      firebaseLogin(firebaseAuth, ggProvider)
    },
    async logoutFirebase() {
      let logout = await firebaseLogout(firebaseAuth)
      window.location.reload()
    },
    async getSubmissionList(contestId) {
      const options = { method: 'GET' }
      const request = await fetch(
        `https://wf-contest-middleware-mpw8.vercel.app/api/contest/submission-list?contest-name=${contestId}&pagination=1`,
        options)
      const response = await request.json()

      return response.data
    },
    getThumbnail(url) {
      let ytVideo = new URL(url).search
      let thumb = new URLSearchParams(ytVideo).get('v')
      return `https://i2.ytimg.com/vi/${thumb}/hqdefault.jpg`
    },
    convertStringIntoObj(array) {
      let newArr = [];
      array.forEach(item => {
        newArr.push(JSON.parse(item))
      })
      return newArr
    },
    hasFalsyValues(form) {
      for (const key in form) {
        if (!form[key]) {
          return false;
        }
      }
      return true;
    },
    getStatusText(string) {
      if (string === "closed") return "Closed"
      if (string === "in_progress") return "In Progress"
      if (string === "future") return "Soon"
      return
    },
    getContestStatus(dates) {
      const now = new Date();

      let progressCheck = {
        submissionPeriod: null,
        votingPeriod: null,
        reviewPeriod: null,
      }

      progressCheck.submissionPeriod = this.getStatus(dates.submission_starts, dates
        .submission_ends, now);
      progressCheck.votingPeriod = this.getStatus(dates.voting_starts, dates.voting_ends, now);
      progressCheck.reviewPeriod = this.getStatus(dates.review_starts, dates.review_ends, now);

      return progressCheck
    },
    getStatus(startDate, endDate, now) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (now > end) return "closed"; // Já passou
      if (now >= start && now <= end) return "in_progress"; // Em andamento
      return "future"; // Ainda não começou
    },
    convertDate(date) {
      return new Date(date).toLocaleDateString()
    },
    getAnchor() {
      return (document.URL.split('#').length > 1) ? document.URL.split('#')[1] : null;
    },
    setMetaImage(imageUrl) {
      // Procura por uma meta tag existente com propriedade "og:image"
      let metaTag = document.querySelector('meta[property="og:image"]');

      // Se a tag existir, atualiza o atributo "content"
      if (metaTag) {
        metaTag.setAttribute('content', imageUrl);
      } else {
        // Se a tag não existir, cria uma nova
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', 'og:image');
        metaTag.setAttribute('content', imageUrl);
        document.head.appendChild(metaTag);
      }
    },
    setMetaDescription(description) {
      // Procura por uma meta tag existente com name "description"
      let metaTag = document.querySelector('meta[name="description"]');

      // Se a tag existir, atualiza o atributo "content"
      if (metaTag) {
        metaTag.setAttribute('content', description);
      } else {
        // Se a tag não existir, cria uma nova
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'description');
        metaTag.setAttribute('content', description);
        document.head.appendChild(metaTag);
      }
    },
  },
  async created() {

    //Get Entry ID to get data from backend
    this.entryId = this.getEntryId();

    if (!this.entryId) return window.location.href = "/"
    //Call backend with requested entry id
    this.entryDetails = await this.getEntryDetails(this.entryId);
    if (!this.entryDetails) return console.log("TODO: Error feedback when entry not found");
    //Get VideoID to assign on embed 💀
    this.videoId = this.getYoutubeVideoId(this.entryDetails.youtube_url)

    let thumbnailUrl = this.getThumbnail(this.entryDetails.youtube_url);
    this.setMetaImage(thumbnailUrl);

    // const [contestData, submissionList] = await Promise.all([
    //   this.getContestData(this.entryDetails.contest_id),
    //   this.getSubmissionList(this.entryDetails.contest_id),
    // ]);

    document.title = `${this.entryDetails.name} | BeatStars Contests`;

  },
  mounted() {},
  updated() {
    let anchor = this.getAnchor()
    if (anchor) {
      const pageSection = document.getElementById(anchor)
      if (pageSection) pageSection.scrollIntoView();
    }

    this.$nextTick(function () {
      //RE-INIT WF as Vue.js init breaks WF interactions
      Webflow.destroy();
      Webflow.ready();
      Webflow.require('ix2').init();
    });
  },
});

fullPage.mount('#app')

