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
      ressetedAnimations: false
    }
  },
  async beforeMount() {
    console.log('Vue Loaded!')
    //Get user token from user's device
    this.userToken = await getUserToken(window.location.href);
    //If user has a token on client - Request user data
    if (this.userToken) this.userInfo = await getMemberDetails(this.graphUrl, this.userToken);
    //If userInfo is sucefully fetched, update isLogged variable to update UI
    if (this.userInfo) this.isLogged = true
    // console.log(this.userInfo)
    //Validate Token to get user plan to check if there's special promo
    let token = this.userToken ? this.userToken : undefined;
    //Get plan from Chargebee using GraphQL
    this.plan = await getSinglePlan("Professional", token, this.graphUrl);
  },
  methods: {
    getMoneyType(value) { return getCurrencyType(value, this.plan?.plans[0]?.price.currency) },
    getAnchor() {
      return (document.URL.split('#').length > 1) ? document.URL.split('#')[1] : null;
    },
    reinitWebflow() {
      if (!this.ressetedAnimations) {
        Webflow.destroy();
        Webflow.ready();
        Webflow.require('ix2').init();
        // this.ressetedAnimations = true;
      }
    }
  },
  mounted() { },
  updated() {
    let anchor = this.getAnchor()
    if (anchor) {
      const pageSection = document.getElementById(anchor)
      if (pageSection) pageSection.scrollIntoView();
    }
    this.reinitWebflow();
  },
});

fullPage.mount('#app')
