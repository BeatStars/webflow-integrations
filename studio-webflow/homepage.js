/***************************
 * The following const are *
 * stored on the Webflow ***
 * header script tag. ******
 * *************************
 * graphUrl - Get GraphQL URL
 * authUrl - Get OAuth URL
 * currentEnv - Get current Env
 * *************************/

import {
  getProducersPlans,
  createAnnualPlans,
  createMonthlyPlans,
  getCurrencyType,
} from "./../contests/pricing-services.js";

import {
  getUserToken,
  getMemberDetails,
  logoutUser,
} from "./../contests/users-services.js";

const fullPage = createApp({
  data() {
    return {
      graphUrl: graphUrl,
      currentPage: null,
      isFetching: true,
      plans: {},
      userToken: null,
      userInfo: null,
      isLogged: false,
      isTrial: false,
      annualy: [],
      monthly: [],
      currentPlanType: "annualy",
      currentPlan: [],
      comparsionTable: [],
      ressetedAnimations: false,
      featuresNotIncludeds: [
        "Content ID & More (coming soon)",
        "Content ID & More (Coming Soon)",
        "Creators Rights Agency",
        "Creator Rights Agency Access",
        "Monthly Beat ID Credit",
        "1 Monthly Beat ID Credit",
        "5% Discount on Promote",
        "50 Lemonaide Credits (AI Melody Generator)",
        "150 Lemonaide Credits (AI Melody Generator)",
        "250 Lemonaide Credits (AI Melody Generator)",
        "BeatStars Publishing",
        "BeatStars Publishing services",
        "PROkits Access",
        "3 Monthly Beat ID Credits",
        "5% off Promote Campaigns",
        "$50 Annual Promote Credits",
        "Seeds by Lemonaide Monthly Credits",
        "3 Beat ID credits per month",
        "BeatStars Publishing services",
        "250 Seeds by Lemonaide monthly credits",
        "Exclusive savings on Promote campaigns",
        "Creative Rights Agency Access",
      ],
    };
  },
  async beforeMount() {
    console.log("Vue Loaded!");
    //Get user token from user's device
    this.userToken = await getUserToken(window.location.href);
    if (!this.userToken) this.isTrial = true;
    //If user has a token on client - Request user data
    if (this.userToken)
      this.userInfo = await getMemberDetails(this.graphUrl, this.userToken);
    //If userInfo is sucefully fetched, update isLogged variable to update UI
    if (this.userInfo) this.isLogged = true;
    //Validate Token to get user plan to check if there's special promo
    let token = this.userToken ? this.userToken : undefined;

    //Get plan from Chargebee using GraphQL
    this.plans = await getProducersPlans(this.graphUrl, token);
    //Enable Trial Buttons if available
    if (this.plans[1].trialEligibility.eligible) this.isTrial = true;
    //Create Annual Plan to pricing Section
    this.annualy = createAnnualPlans(this.plans);
    //Create Monthly Plan to pricing Section
    this.monthly = createMonthlyPlans(this.plans);
    //Create new array to handle comparsion table
    let last = this.annualy[this.annualy.length - 1];
    this.comparsionTable = this.monthly.concat(last);

    this.currentPage = window.location.href;

    this.currentPlan = Array.from(this.annualy);

    this.isFetching = this.isFetching ? false : this.isFetching;
  },
  methods: {
    trackGaEvent(event) {
      gtag("event", event);
    },
    getAnchor() {
      return document.URL.split("#").length > 1
        ? document.URL.split("#")[1]
        : null;
    },
    getMoneyType(value) {
      return getCurrencyType(value, this.plans[0].plans[0].price.currency);
    },
    login(path) {
      return authUrl + "/" + path;
    },
    logout() {
      return logoutUser();
    },
    updatePricingSection(event) {
      this.updateSwitchUi();

      if (this.currentPlanType === "annualy") {
        this.currentPlanType = "monthly";
        this.currentPlan[this.currentPlan.length - 1] =
          this.monthly[this.monthly.length - 1];
        return;
      }

      this.currentPlanType = "annualy";
      this.currentPlan[this.currentPlan.length - 1] =
        this.annualy[this.annualy.length - 1];
      return;
    },
    updateSwitchUi() {
      let buttons = document.querySelectorAll(".new_pricing_switch--button");
      buttons.forEach((item) => {
        item.classList.toggle("disabled");
      });
      return;
    },
    compareArrays() {
      const equals = (array1, array2) =>
        JSON.stringify(array1) === JSON.stringify(array2);
      let x = equals(this.currentPlan, this.annualy);
      return x;
    },
    getLinkByPlan(name, frequency) {
      const plans = {
        free: "free",
        starter: "marketplace",
        professional: "proPage",
        growth: "growth",
      };
      const planKey = plans[name.toLowerCase()];
      if (!planKey) return null;
      return `${window.location.origin}/onboarding/subscription-checkout?onboardingType=seller&backEnabled=false&plan=${planKey}&paymentFrequency=${frequency}`;
    },
  },
  updated() {
    this.$nextTick(function () {
      let anchor = this.getAnchor();
      if (anchor) {
        const pageSection = document.getElementById(anchor);
        if (pageSection) pageSection.scrollIntoView();
      }
      // RE-INIT WF as Vue.js init breaks WF interactions
      if (!this.ressetedAnimations) {
        Webflow.destroy();
        Webflow.ready();
        Webflow.require("ix2").init();
        // this.ressetedAnimations = true;
      }
    });
  },
});

fullPage.mount("#app");
