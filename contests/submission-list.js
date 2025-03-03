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

import { getCurrencyType } from './pricing-services.js';
import { getUserToken, getMemberDetails } from './users-services.js';
import { sendVoteDataNoToken, firebaseLogout, getVoteCard, checkContestProgress, getMyEntry } from './contests-functions.js';

const isInAppBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return /FBAN|FBAV|Instagram/.test(ua);
};

let firebaseBanner = document.getElementById("firebase_banner");
firebaseBanner.classList.remove("hide");

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

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const ggProvider = new GoogleAuthProvider();

/* ************************
 *** END FIREBASE CONFIG ***
 ************************* */

const fullPage = createApp({
    data() {
        return {
            pageLink: null,
            authUrl: authUrl,
            queryParams: null,

            urlParams: null,

            plan: {},
            graphUrl: graphUrl,

            userToken: null,
            userInfo: null,
            userEntry: null,

            //User Data from firebaseApp
            firebaseUserInfo: null,

            isLogged: false,

            search: "",
            debounceTimer: null,
            isSearching: false,
            searchEmpty: false,

            pageOffset: 24,

            loginToast: false,
            elegibleBrowser: null,

            submissionList: null,
            displayList: null,

            isFetching: true,
            paginatedList: null,
            contestId: null,
            contestData: null,
            //Toast handler
            showToast: false,
            toastify: { title: null, message: null },
            //Timeline that handle events
            timeline: {
                submissionPeriod: null,
                votingPeriod: null,
                reviewPeriod: null
            }
        }
    },
    async created() {
        // GET PARAMS TO LOAD THE SUBMISSION LIST
        const queryParams = new URLSearchParams(window.location.search);
        const paramsObject = Object.fromEntries(queryParams.entries());
        this.queryParams = paramsObject
    },
    async beforeMount() {
        console.log('Vue Loaded!')
        this.elegibleBrowser = isInAppBrowser()

        this.urlParams = this.getConfigFromUrl(window.location)
        this.contestId = this.urlParams.contest

        const [contestData, submissionList] = await Promise.all([
            this.getContestData(this.urlParams.contest),
            this.getPaginatedList(this.queryParams.pagination, this.pageOffset),
        ]);

        this.contestData = contestData
        this.submissionList = submissionList.result
        this.paginatedList = submissionList

        onAuthStateChanged(firebaseAuth, (user) => {
            if (!user) return
            this.firebaseUserInfo = user
        });

        //Get user token from user's device
        this.userToken = await getUserToken(window.location.href);
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

        this.timeline = checkContestProgress(contestData.dates)
        this.isFetching = false

    },
    methods: {
        async fetchPage(direction) {
            const { currentPage, totalPages } = this.paginatedList;
            const pageIncrement = { next: 1, previous: -1 }[direction];

            if (pageIncrement === undefined) return; //if there is no page increment, return

            const newPage = currentPage + pageIncrement;

            if (newPage < 1 || newPage > totalPages) return;

            const url = new URL(window.location.href);
            url.searchParams.set('pagination', newPage);
            window.history.pushState({}, '', url);

            const pageData = await this.getPaginatedList(newPage, this.pageOffset);
            let votedEntries = document.querySelectorAll('.success')
            votedEntries.forEach(item => { item.classList.remove('success') })

            this.paginatedList = pageData;
            this.submissionList = pageData.result;
        },
        preventSubmit(event) {
            if (event.keyCode !== 13 || Event.key !== "Enter") return
            event.preventDefault();
            return
        },
        async handleSearch(event) {
            this.searchQuery = event.target.value;
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.executeSearch(); // Executa a busca
            }, 300);
        },
        async executeSearch() {
            this.isSearching = !this.isSearching;

            if (this.searchQuery === "") {
                let x = await this.getPaginatedList(this.queryParams.pagination, this.pageOffset)

                this.submissionList = x.result
                this.searchEmpty = false
                return this.isSearching = !this.isSearching;
            }

            const apiUrl = `https://wf-contest-middleware-mpw8.vercel.app/api/contest/search`
            const query = `?q=${this.searchQuery}&contest=${this.contestData.contest_id}`
            const options = { method: 'GET' }

            const request = await fetch(apiUrl + query, options)
            const response = await request.json()

            if (response.data.length === 0) {
                this.submissionList === this.getPaginatedList(this.queryParams.pagination, this
                    .pageOffset).result
                this.searchEmpty = true
                return this.isSearching = !this.isSearching;
            }

            this.submissionList = response.data
            this.isSearching = !this.isSearching;
            this.searchEmpty = false
        },
        async logoutFirebase() {
            let logout = await firebaseLogout(firebaseAuth)
            window.location.reload()
        },
        async beatstarsLogin() {
            return window.location.href =
                'https://oauth.beatstars.com/verify?app=WEB_STUDIO&version=3.14.0&origin=' + this
                    .pageLink + '&send_callback=true&t=dark-theme'
        },
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
        async fetchNextPage() {
            let currentPage = this.paginatedList.currentPage
            let totalPages = this.paginatedList.totalPages
            let nextPage = currentPage + 1

            if (nextPage > totalPages) return

            const newPage = await this.getPaginatedList(nextPage, this.pageOffset)
            this.paginatedList = newPage
            this.submissionList = newPage.result
        },
        async fetchPreviousPage() {
            let currentPage = this.paginatedList.currentPage
            let totalPages = this.paginatedList.totalPages
            let prevPage = currentPage - 1

            if (prevPage < 1) return

            const newPage = await this.getPaginatedList(prevPage, this.pageOffset)
            this.paginatedList = newPage
            this.submissionList = newPage.result
        },
        async getPaginatedList(page, size) {
            const apiUrl =
                `https://wf-contest-middleware-mpw8.vercel.app/api/contest/submission-page`
            // const apiUrl = 'http://localhost:8080/api/contest/submission-page'
            let query = `?contest-name=${this.urlParams.contest}&page=${page}&size=${size}`

            const options = { method: 'GET' }
            const request = await fetch(apiUrl + query, options)
            const response = await request.json()

            return response.data
        },
        async getSubmissionList() {
            const apiUrl =
                `https://wf-contest-middleware-mpw8.vercel.app/api/contest/submission-page`
            let query =
                `?contest-name=${this.urlParams.contest}&page=${this.queryParams.pagination}&size=${size}`

            const options = { method: 'GET' }
            const request = await fetch(apiUrl + query, options)
            const response = await request.json()

            return response.data
        },
        openEntry(item) {
            return window.location.href = "/entry?e=" + item.slug
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
                contest_id: item.contest_id,
                slug: item.slug,
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
        getConfigFromUrl(url) {
            url = new URL(url).search;
            const params = new URLSearchParams(url)
            return {
                contest: params.get('contest-name'),
                pagination: params.get('offset'),
                order: params.get('order')
            }
        },
        toggleToast() {
            this.showToast = !this.showToast
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
        convertDate(date) {
            return new Date(date).toLocaleDateString()
        },
        getAnchor() {
            return (document.URL.split('#').length > 1) ? document.URL.split('#')[1] : null;
        },
        getMoneyType(value) { return getCurrencyType(value, this.plan?.plans[0]?.price.currency) },
    },
    mounted() { },
    updated() {
        this.displayList = this.submissionList
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