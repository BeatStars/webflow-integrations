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
            plan: {},
            graphUrl: graphUrl,
            userToken: null,
            userInfo: null,
            isLogged: false,
            isFetching: true,
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
        //Validate Token to get user plan to check if there's special promo
        let token = this.userToken ? this.userToken : undefined;
        //Get plan from Chargebee using GraphQL
        this.plan = await getSinglePlan("Professional", token, this.graphUrl);

        this.isFetching = false
    },
    methods: {
        getAnchor() {
            return (document.URL.split('#').length > 1) ? document.URL.split('#')[1] : null;
        },
        getMoneyType(value) { return getCurrencyType(value, this.plan?.plans[0]?.price.currency) },
    },
    mounted() {
        this.$nextTick(function () {
            //RE-INIT WF as Vue.js init breaks WF interactions
            Webflow.destroy();
            Webflow.ready();
            Webflow.require('ix2').init();
        });
    },
    updated() {
        let anchor = this.getAnchor()
        if (anchor) {
            const pageSection = document.getElementById(anchor)
            if (pageSection) pageSection.scrollIntoView();
        }

        let images = $(".words_container").children();
        let currentIndex = 1;

        setInterval(function () {
            images.removeClass("active completed");
            images.eq(currentIndex).addClass("active");
            images.eq(currentIndex - 1).addClass("active completed");

            currentIndex = (currentIndex + 1) % images.length;
        }, 3000);

        new PureCounter({
            // Setting that can't' be overriden on pre-element
            selector: '.highlight_number', // HTML query selector for spesific element

            // Settings that can be overridden on per-element basis, by `data-purecounter-*` attributes:
            start: 0, // Starting number [unit]
            end: 200, // End number [unit]
            duration: 2, // The time in seconds for the animation to complete [seconds]
            delay: 10, // The delay between each iteration (the default of 10 will produce 100 fps) [miliseconds]
            once: true, // Counting at once or recount when the element in view [boolean]
            repeat: false, // Repeat count for certain time [boolean:false|seconds]
            decimals: 0, // How many decimal places to show. [unit]
            legacy: true, // If this is true it will use the scroll event listener on browsers
            filesizing: false, // This will enable/disable File Size format [boolean]
            currency: false, // This will enable/disable Currency format. Use it for set the symbol too [boolean|char|string]
            separator: true, // This will enable/disable comma separator for thousands. Use it for set the symbol too [boolean|char|string]
        });

        new PureCounter({
            // Setting that can't' be overriden on pre-element
            selector: '.highlight_number_second', // HTML query selector for spesific element

            // Settings that can be overridden on per-element basis, by `data-purecounter-*` attributes:
            start: 0, // Starting number [unit]
            end: 40, // End number [unit]
            duration: 1, // The time in seconds for the animation to complete [seconds]
            delay: 10, // The delay between each iteration (the default of 10 will produce 100 fps) [miliseconds]
            once: true, // Counting at once or recount when the element in view [boolean]
            repeat: false, // Repeat count for certain time [boolean:false|seconds]
            decimals: 0, // How many decimal places to show. [unit]
            legacy: true, // If this is true it will use the scroll event listener on browsers
            filesizing: false, // This will enable/disable File Size format [boolean]
            currency: false, // This will enable/disable Currency format. Use it for set the symbol too [boolean|char|string]
            separator: true, // This will enable/disable comma separator for thousands. Use it for set the symbol too [boolean|char|string]
        });

        this.$nextTick(function () {
            //RE-INIT WF as Vue.js init breaks WF interactions
            Webflow.destroy();
            Webflow.ready();
            Webflow.require('ix2').init();
        });
    },
});

fullPage.mount('#app')
