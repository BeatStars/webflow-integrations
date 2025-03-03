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
  sendEntryData,
  sendVoteData,
  sendEntryDataNoToken,
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

let modal = document.getElementById("entryModal");
let firebaseBanner = document.getElementById("firebase_banner");
// let toastBanner = document.getElementById("toastMessage");

firebaseBanner.classList.remove("hide");
modal.classList.remove("hide");
// toastBanner.remove("hide");

const fullPage = createApp({
  data() {
    return {
      authUrl: authUrl,
      urlParams: null,
      plan: {},
      graphUrl: graphUrl,
      //User Data from BeatStars
      userToken: null,
      userInfo: null,
      userEntry: null,

      isLogged: false,
      loginToast: false,

      elegibleBrowser: null,

      pageLink: null,
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
      showEntryButton: false,
      entryForm: {
        contest_id: null,
        name: null,
        youtube_url: null,
        checkbox: false
      },
      embedData: null,
      //Fetch status
      isFetching: true,

      winners: null,

      //Timeline Configuration
      timeline: {
        submissionPeriod: null,
        votingPeriod: null,
        reviewPeriod: null,
        winnersPeriod: null,
      }
    }
  },
  async beforeMount() {
    console.log('Vue Loaded!!!')
    //Get contest ID to make all api calls
    this.contestId = this.getContestId(window.location)
    //Get user token from user's device
    this.userToken = await getUserToken(window.location.href);
    //Get page Link to use on OAuth
    this.pageLink = window.location.href

    const [contestData, submissionList] = await Promise.all([
      this.getContestData(this.contestId),
      this.getSubmissionList(this.contestId),
    ]);

    this.contestData = contestData
    this.submissionList = submissionList

    onAuthStateChanged(firebaseAuth, (user) => {
      if (!user) return
      console.log(user)
      this.firebaseUserInfo = user
    });

    this.timeline = this.getContestStatus(this.contestData.dates)

    this.elegibleBrowser = isInAppBrowser()

    //If user has a token on client - Request user data
    if (this.userToken) this.userInfo = await getMemberDetails(this.graphUrl, this.userToken);

    //If userInfo is sucefully fetched, update isLogged variable to update UI
    if (this.userInfo) {
      this.isLogged = true

      let response = await getMyEntry(this.userInfo.id, this.contestData.contest_id)
      if (response.status !== 404) {
        this.userEntry = response.data;
      }
    }

    //Validate Token to get user plan to check if there's special promo
    let token = this.userToken ? this.userToken : undefined;
    this.isFetching = false

    if (this.contestData.timeline) {
      this.contestData = {
        ...this.contestData,
        timeline: this.getPhasesStatus(this.contestData.timeline)
      }
    }

    if (this.contestData.timeline) {
      this.showEntryButton = this.isSubmissionInProgress(this.contestData.timeline)
    }

    if (this.timeline.winnersPeriod != 'future') {
      const request = await fetch(
        `https://wf-contest-middleware-mpw8.vercel.app/api/contest/winners?contest=${this.contestData.contest_id}`
      )
      const response = await request.json()
      this.winners = response.data
    }
  },
  methods: {
    isSubmissionInProgress(phases) {
      return phases.some(
        (phase) => phase.type === "SUBMISSION" && phase.status === "in_progress"
      );
    },
    downloadFile() {
      return window.open(this.contestData.download_file, '_blank').focus();
    },
    openEntry(item) {
      return window.location.href = "/entry?e=" + item.slug
    },
    toggleToast() {
      this.showToast = !this.showToast
    },
    convertYouTubeMobileUrl(mobileUrl) {
      if (mobileUrl.includes("m.youtube.com")) {
        return mobileUrl.replace("m.youtube.com", "www.youtube.com");
      }
      return mobileUrl;
    },
    async handleUrlField() {
      this.entryForm.youtube_url = this.convertYouTubeMobileUrl(this.entryForm.youtube_url);
      let oembedUrl = this.getOEmbedLink(this.entryForm.youtube_url);
      if (!oembedUrl) return
      let oembedRequest = await fetch(oembedUrl)
      this.embedData = await oembedRequest.json();
      this.entryForm.name = this.embedData.title
    },
    getContestId(url) {
      return url.pathname.split("/")[2]
    },
    async sendEntry() {
      //Assign ContestID into the current form
      this.entryForm.contest_id = this.contestId
      //Check if form has falsy values
      let checkForm = this.hasFalsyValues(this.entryForm)
      if (!checkForm) {
        this.toggleToast();
        this.toastify.title = "Please check your fields."
        this.toastify.message =
          "Looks like your form is missing a field, please fill every required field and try again."

        setTimeout(() => {
          this.toggleToast();
        }, 5000);
        return
      }
      //Call function to create new submission to the user
      let createEntry = await sendEntryDataNoToken(this.entryForm, this.userInfo);

      if (!createEntry.submit) {
        this.toggleToast();
        this.toastify.title = "Ops!!! Something went wrong!"
        this.toastify.message = createEntry.message

        setTimeout(() => {
          this.toggleToast();
        }, 5000);
        return
      }

      fbq('track', 'SubmitContest',
        {
          content_name: this.contest_id,
          submission_id: createEntry.slug
        });

      gtag('event', 'contest_entry_complete', {
        contest_name: this.contest_id,
        submission_id: createEntry.slug
      });

      setTimeout(() => {
        window.location.href = '/entry?e=' + createEntry.slug + '&share=true'
      }, 500);

    },
    toggleEntryForm() {
      //If user is not logged in, show login banner
      if (!this.userInfo) {
        this.toggleToast();
        this.toastify.title = "Ops! Something went wrong!"
        this.toastify.message = "You need to be login to peform this action."

        setTimeout(() => {
          this.toggleToast();
        }, 5000);
        return
      }

      //Meta Event Tracker
      fbq('track', 'InitiateContest',
        {
          content_name: this.contest_id,
          content_type: "contest_entry"
        });
      //GA4 Event Tracker
      gtag('event', 'begin_contest_entry', {
        contest_name: this.contest_id,
      });

      //Open modal to the user
      return this.showEntryForm = !this.showEntryForm
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
      let myEmail;

      if (this.userInfo) {
        myOrigin = "beatstars",
          myUserId = this.userInfo.id
        myEmail = this.userInfo.account.email
      }

      if (this.firebaseUserInfo) {
        myOrigin = this.firebaseUserInfo.providerData[0].providerId;
        myUserId = this.firebaseUserInfo.providerData[0].uid;
        myEmail = this.firebaseUserInfo.email

      }

      let data = {
        contest_id: item.contest_id,
        slug: item.slug,
        user_id: myUserId,
        origin: myOrigin,
        email: myEmail
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

      if (response.data.timeline) {
        response.data = {
          ...response.data,
          timeline: this.convertStringIntoObj(response.data.timeline)
        }
      }

      return {
        ...response.data,
        cards: this.convertStringIntoObj(response.data.cards),
        faq: this.convertStringIntoObj(response.data.faq)
      }
    },
    async googleLogin() {
      firebaseLogin(firebaseAuth, ggProvider)
    },
    async beatstarsLogin() {
      return window.location.href =
        'https://oauth.beatstars.com/verify?app=WEB_STUDIO&version=3.14.0&origin=' + this
          .pageLink + '&send_callback=true&t=dark-theme'
    },
    async logout() {
      console.log('Logout')
      //DESTROY ALL COKKIES AND LOCAL STORAGE            
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

      if (url.searchParams.get('access_token')) {
        url.search = '';
        setTimeout(() => {
          window.location.href = url.href;
        }, 400);
        return
      }

      setTimeout(() => {window.location.reload()}, 400);
    },
    deleteCookie(name) {
      document.cookie = name +
        "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=.beatstars.com;path=/";
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
        winnersPeriod: null,
      }

      progressCheck.submissionPeriod = this.getStatus(dates.submission_starts, dates
        .submission_ends, now);
      progressCheck.votingPeriod = this.getStatus(dates.voting_starts, dates.voting_ends, now);
      progressCheck.reviewPeriod = this.getStatus(dates.review_starts, dates.review_ends, now);
      progressCheck.winnersPeriod = this.getStatus(dates.winners_announcement, dates
        .winners_announcement, now)

      return progressCheck
    },
    getStatus(startDate, endDate, now) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (now > end) return "closed"; // Já passou
      if (now >= start && now <= end) return "in_progress"; // Em andamento
      return "future"; // Ainda não começou
    },

    getPhasesStatus(phases) {
      const now = new Date();

      return phases.map((phase) => {
        const { type, title, dates } = phase;
        const status = this.newGetStatus(dates.start, dates.end, now);
        const caption = this.newGetStatusTxt(status);

        return {
          title,
          type,
          status,
          caption,
          description: phase.description,
          dates: phase.dates
        };
      });
    },

    newGetStatus(startDate, endDate, now) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;

      if (end && now > end) return "closed";
      if (now >= start && (!end || now <= end)) return "in_progress";
      return "future";
    },

    newGetStatusTxt(status) {
      const statusMap = {
        closed: "Closed",
        in_progress: "In Progress",
        future: "Soon",
      };

      return statusMap[status] || null;
    },

    getOEmbedLink(url) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      const tiktokRegex = /^(https?:\/\/)?(www\.)?tiktok\.com\/.+$/;

      if (youtubeRegex.test(url)) {
        return `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      }

      if (tiktokRegex.test(url)) {
        return `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      }

      return null;
    },
    convertDate(date) {
      return new Date(date).toLocaleDateString()
    },
    getAnchor() {
      return (document.URL.split('#').length > 1) ? document.URL.split('#')[1] : null;
    },
    // getMoneyType(value) {
    //   return getCurrencyType(value, this.plan?.plans[0]?.price
    //     .currency)
    // },
  },
  mounted() { },
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
