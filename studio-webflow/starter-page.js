/***************************
 * The following const are *
 * stored on the Webflow ***
 * header script tag. ******
 * *************************
 * graphUrl - Get GraphQL URL
 * authUrl - Get OAuth URL
 * currentEnv - Get current Env
 * *************************/

import { getSinglePlan, getCurrencyType } from './../utils/pricing-functions.js';
import { getUserToken, getMemberDetails } from './../utils/users-functions.js';

const fullPage = createApp({
    data() {
        return {
            graphUrl: graphUrl,
            plan: {},
            userToken: null,
            userInfo: null,
            isLogged: false,
            webflowReset: false
        }
    },
    async beforeMount() {
        console.log(graphUrl)
        //Get user token from user's device
        this.userToken = await getUserToken(window.location.href);
        //If user has a token on client - Request user data
        if (this.userToken) this.userInfo = await getMemberDetails(this.graphUrl, this.userToken);
        //If userInfo is sucefully fetched, update isLogged variable to update UI
        if (this.userInfo) this.isLogged = true
        console.log(this.userInfo)
        //Validate Token to get user plan to check if there's special promo
        let token = this.userToken ? this.userToken : undefined;
        //Get plan from Chargebee using GraphQL
        this.plan = await getSinglePlan("Starter", token, this.graphUrl);
        console.log(this.plan)
    },
    methods: {
        getMoneyType(value) { return getCurrencyType(value, this.plan?.plans[0]?.price.currency) },
        testMethod() {
            let iframe = document.getElementById("iframe");
            let innerDoc = iframe.contentDocument || iframe.contentWindow.document;
            let params = new URLSearchParams(iframe.contentWindow.location.search);
            let token = params.get("access_token");
        }
    },
    mounted() {
        // this.$nextTick(function () {
        // if (!this.webflowReset) {
        Webflow.destroy();
        Webflow.ready();
        Webflow.require('ix2').init();
        // this.webflowReset = true;
        // }
        // });
    },
    updated() {
        Webflow.destroy();
        Webflow.ready();
        Webflow.require('ix2').init();
        // this.$nextTick(function () {
        //   if (!this.webflowReset) {
        //   Webflow.destroy();
        //   Webflow.ready();
        //   Webflow.require('ix2').init();
        //   this.webflowReset = true;
        //   }
        // });
    },
});

fullPage.mount('#app')

