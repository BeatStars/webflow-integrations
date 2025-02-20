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

import { getCurrencyType } from 'https://slater.app/1147/13054.js';
import { getUserToken, getMemberDetails } from 'https://slater.app/1147/13066.js';
import { topArtists } from './json-data.js'

const popup = document.getElementById('results');
const stepTwo = document.getElementById('step2');
const stepThree = document.getElementById('step3');
const containerInput = document.getElementById('containerInput');

popup.classList.toggle('hide');
stepTwo.classList.toggle('hide');
stepThree.classList.toggle('hide');

const fullPage = createApp({
    data() {
        return {
            artists: topArtists,

            graphUrl: graphUrl,
            isFetching: true,

            userToken: null,
            userInfo: null,
            isLogged: false,
            ressetedAnimations: false,

            displayError: false,
            errorMessage: "",

            // SPOTIFY INTEGRATIONS VARIABLES
            spotifyToken: null,
            spotifyResults: null,
            songTitle: "",
            songTitleBkp: null,
            selectedTracks: [],

            showModal: false,
            showSecondModal: false,
            showConfirmation: false,

            showSelectedTracks: false,

            royaltyCalculatorForm: {
                email: null,
                memberId: null,
                firstName: null,
                lastName: null,
                submitterDescription: null,
                publishingSituation: null,
                tracks: []
            }
        }
    },
    async beforeMount() {
        console.log('Vue Loaded!');
        try {
            // Get user token from user's device
            this.userToken = await getUserToken(window.location.href) || undefined;
            // Check if user is in trial mode if no token is available
            this.isTrial = !this.userToken;
            // If user has a token, fetch user data
            if (this.userToken) {
                this.userInfo = await getMemberDetails(this.graphUrl, this.userToken);
                // Update isLogged status based on successful data fetch
                this.isLogged = !!this.userInfo;
            }
            // Token used to validate user plan for special promotions
            const token = this.userToken || undefined;
            // Assign spotifyToken if available or generate a new one
            this.spotifyToken = this.spotifyToken || await this.generateSpotifyToken();
        } catch (error) {
            console.error('Error in beforeMount:', error);
        }
    },
    methods: {
        async newOpenModal() {
            if (this.songTitle === this.songTitleBkp) return

            let spotifyRequest = await this.getSpotifyTracks(this.spotifyToken)

            if (!spotifyRequest) {
                this.spotifyToken = await this.generateSpotifyToken();
                return spotifyRequest = await this.getSpotifyTracks(this.spotifyToken)
            }

            this.spotifyResults = null;

            setTimeout(() => {
                this.spotifyResults = spotifyRequest
            }, 1);

            return this.showModal = true
        },
        handleSpecialKeys(element) {
            this.newOpenModal()
        },

        async sendForm(element) {
            // element.preventDefault();
            let validateForm = this.verifyFormFields(this.royaltyCalculatorForm);

            if (!validateForm) {
                this.displayError = true
                this.errorMessage = "All fields need to be filled."
                return
            }

            if (this.royaltyCalculatorForm.memberId === null) {
                delete this.royaltyCalculatorForm["memberId"]
            }

            try {

                console.log(this.royaltyCalculatorForm)

                let url = webflowApi
                let options = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.royaltyCalculatorForm),
                }

                const response = await fetch(url, options)

                if (!response.ok) {
                    // Lançar erro para códigos 4xx ou 5xx
                    throw new Error(`Erro HTTP: ${response.status} - ${req.statusText}`);
                }

                const res = await response.json()

                if (res.Error) { return window.alert("Something wen't wrong, check console!") }

                this.showConfirmation = true;
                this.showSecondModal = false

            } catch (err) {
                console.error('This happened:', err.message);
                this.displayError = true
                this.errorMessage =
                    "Sorry, something went wrong. Please try again later."
                return
            }

        },
        nextStep() {
            let convertedTracks = this.convertTracks(this.selectedTracks)
            let validateTrackPercentage = this.verifyFilledPorcentage(convertedTracks)

            console.log(convertedTracks)
            console.log(this.selectedTracks)

            let verifyTrackPercentageThreeMethod = this.selectedTracks.every(function (element,
                index) {
                // Do your thing, then:
                if (
                    element.percentageOwned === "" ||
                    element.percentageOwned === "0" ||
                    element.percentageOwned == NaN
                ) return false
                else return true
            })

            if (!verifyTrackPercentageThreeMethod) {
                this.displayError = true
                this.errorMessage = "All tracks need to have a percentage defined."
                return
            }

            if (this.selectedTracks.length === 0) {
                this.displayError = true
                this.errorMessage = "You need to select at least 1 track"
                return
            }

            if (validateTrackPercentage === false) {
                this.displayError = true
                this.errorMessage = "All tracks need to have a percentage defined."
                return
            }

            this.royaltyCalculatorForm.tracks = this.convertPercentageOwned(convertedTracks);
            this.showModal = false;
            this.showSecondModal = true;
            this.displayError = false
            this.errorMessage = ""
            return
        },
        convertPercentageOwned(data) {
            for (let key in data) {
                // Converte o percentageOwned para um número
                data[key].percentageOwned = parseFloat(`${data[key].percentageOwned}`.replace(/,/g,
                    '.'));
            }
            return data;
        },
        backStep() {
            this.showModal = true;
            this.showSecondModal = false;
            return
        },
        verifyFormFields(obj) {
            for (let key in obj) {
                if (!obj[key] && obj[key] !== 0 && key !== "memberId") {
                    return false;
                }
            }
            return true;
        },
        verifyFilledPorcentage(tracks) {
            for (let key in tracks) {
                if (isNaN(tracks[key].percentageOwned)) return false;
                // return true
            }
        },
        convertTracks(obj) {
            let spotifyTracks = obj
            let tracks = {}
            spotifyTracks.forEach(item => {
                let musicOwners = []
                item.artists.forEach(artist => {
                    musicOwners.push(artist.name)
                })
                tracks = {
                    ...tracks,
                    [item.external_ids.isrc]: {
                        "isrc": item.external_ids.isrc,
                        "artworkUrl": item.album.images[0].url,
                        "title": item.name,
                        "artist": musicOwners,
                        "percentageOwned": item.percentageOwned
                    }
                }
            })
            return tracks
        },
        isNumber(e) {
            let char = String.fromCharCode(e.keyCode); // Get the character
            if (/^[0-9]+$/.test(char) || char === '.') return true; // Match with regex 
            else e.preventDefault(); // If not match, don't add to input text
        },
        updatePercentageOwned(item, element) {

            if (parseFloat(element.target.value) > 100) {

                this.displayError = true
                this.errorMessage = "You can only own a maximum of 100%."
                return
            }

            this.displayError = false
            this.errorMessage = ""

            // //Get element that triggers the interaction
            // let interaction = element.target
            // //Find item inside selectedTracks by comparing ids inside array
            // let itemIndex = this.selectedTracks.findIndex((element) => element.id == item.id);
            // //Add value of percentageOwned to this track
            // this.selectedTracks[itemIndex] = {
            //   ...this.selectedTracks[itemIndex],
            //   percentageOwned: interaction.value
            // }
        },
        selectTrack(item, element) {
            //Prevent add same item on list
            if (!this.newItemInArray(item)) return
            //Prevent user to add more than 5 items on array
            if (this.selectedTracks.length >= 5) {
                this.displayError = true
                this.errorMessage = "You can select only 5 tracks."
                return
            }

            let interaction = element.target

            //Use element that fired the click element to find the Card Element
            let card = this.getCardElement(interaction)

            if (interaction.tagName === "A") {
                card.classList.toggle('selected')
                return
            }
            card.classList.toggle('selected')
            //Update selectedTracks Array to be send on form
            this.addTrackInArray(item, card)
        },
        addTrackInArray(obj, domElement) {
            this.selectedTracks.push(obj)
        },
        removeTrackInArray(obj) {
            let index = this.findItemIndexOnArray(obj)

            this.selectedTracks.splice(index, 1);

            if (this.selectedTracks.length === 0 && this.showSelectedTracks) {
                this.showSelectedTracks = !this.showSelectedTracks
                this.showModal = true
            }

            this.displayError = false
            this.errorMessage = ""
            return
        },
        newItemInArray(obj) {
            let index = this.findItemIndexOnArray(obj);
            if (index === -1) return true;
            return false
        },
        findItemIndexOnArray(item) {
            return this.selectedTracks.findIndex(element => JSON.stringify(element.id) === JSON
                .stringify(item.id));
        },
        getCardElement(element) {
            if (element.classList && element.classList.contains('integration_track')) {
                return element;
            }

            while (element.parentElement) {
                element = element.parentElement;
                if (element.classList && element.classList.contains('integration_track')) {
                    return element;
                }
            }
            return false;

        },
        getAnchor() {
            return (document.URL.split('#').length > 1) ? document.URL.split('#')[1] : null;
        },
        getMoneyType(value) {
            return getCurrencyType(value, this.plans[0].plans[0].price.currency)
        },
        openModal() {
            return this.showModal = true
        },
        closeModal() {
            this.songTitle = null;
            this.spotifyResults = null;
            this.selectedTracks = [];
            this.showModal = false;
            this.showSecondModal = false;
            this.showConfirmation = false;
            return
        },
        toggleListDisplay() {
            let spotifyList = document.querySelector('.spotify_list');
            return this.showSelectedTracks = !this.showSelectedTracks;
        },
        buttonText() {
            if (this.showSelectedTracks) return "Back to search"
            return `See selected tracks (${this.selectedTracks.length})`
        },
        async getSpotifyTracks(token) {
            this.songTitleBkp = this.songTitle

            let baseUrl = "https://api.spotify.com/v1/"
            let config = {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            }

            let getList = await fetch(baseUrl + `search?query=${this.songTitle}&type=track`, config)
            let spotifyData = await getList.json();
            return spotifyData.tracks.items;
        },
        async generateSpotifyToken() {
            let callSpotifyTokenApi = await fetch('https://spotifytoken.vercel.app/newest')
            let token = await callSpotifyTokenApi.text()
            return token
        }
    },
    mounted() {
        gtag('event', 'pub_roster_page_landed');

        new PureCounter({
            // Setting that can't' be overriden on pre-element
            selector: '.animated', // HTML query selector for spesific element
            // Settings that can be overridden on per-element basis, by `data-purecounter-*` attributes:
            start: 0, // Starting number [unit]
            end: 325000000, // End number [unit]
            duration: 2, // The time in seconds for the animation to complete [seconds]
            delay: 10, // The delay between each iteration (the default of 10 will produce 100 fps) [miliseconds]
            once: true, // Counting at once or recount when the element in view [boolean]
            repeat: false, // Repeat count for certain time [boolean:false|seconds]
            decimals: 0, // How many decimal places to show. [unit]
            legacy: true, // If this is true it will use the scroll event listener on browsers
            filesizing: false, // This will enable/disable File Size format [boolean]
            currency: false, // This will enable/disable Currency format. Use it for set the symbol too [boolean|char|string]
            separator: ",", // This will enable/disable comma separator for thousands. Use it for set the symbol too [boolean|char|string]
        });
        new PureCounter({
            // Setting that can't' be overriden on pre-element
            selector: '.animated_mobile', // HTML query selector for spesific element
            // Settings that can be overridden on per-element basis, by `data-purecounter-*` attributes:
            start: 0, // Starting number [unit]
            end: 325, // End number [unit]
            duration: 2, // The time in seconds for the animation to complete [seconds]
            delay: 10, // The delay between each iteration (the default of 10 will produce 100 fps) [miliseconds]
            once: true, // Counting at once or recount when the element in view [boolean]
            repeat: false, // Repeat count for certain time [boolean:false|seconds]
            decimals: 0, // How many decimal places to show. [unit]
            legacy: true, // If this is true it will use the scroll event listener on browsers
            filesizing: false, // This will enable/disable File Size format [boolean]
            currency: false, // This will enable/disable Currency format. Use it for set the symbol too [boolean|char|string]
            separator: ",", // This will enable/disable comma separator for thousands. Use it for set the symbol too [boolean|char|string]
        });

        // this.$nextTick(function () {
        if (!this.ressetedAnimations) {
            Webflow.destroy();
            Webflow.ready();
            Webflow.require('ix2').init();
            this.ressetedAnimations = true;
        }
        // });
    },
    async updated() {
        let anchor = this.getAnchor()

        try {
            //THIS IS SO WRONG IN MANY LEVELS BUT AT LEAST ITS WORKING
            if (!this.showSelectedTracks && this.selectedTracks.length != 0) {
                let spotifyList = document.querySelector('.spotify_list');
                let tracks = spotifyList.children

                if (tracks.length == 0) return

                for (let item of tracks) {
                    let spotifyId = item.getAttribute('spotifyid');
                    this.selectedTracks.forEach(element => {
                        if (element.id === spotifyId) {
                            let x = [...item.classList].includes('selected')
                            if (!x) {
                                item.classList.add('selected')
                                return
                            }

                        }
                    })
                }
            }
        } catch (error) {
            return
        }

        if (anchor) {
            const pageSection = document.getElementById(anchor)
            if (pageSection) pageSection.scrollIntoView();
        }
    },
});

fullPage.mount('#app')
