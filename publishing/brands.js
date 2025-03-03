const fullPage = createApp({
    data() {
        return {
            pageLink: null,
            action: actionUrl,
            showForm: true,
            displayError: false,
            errorMessage: "",
            brandForm: {
                firstName: "",
                lastName: "",
                workEmail: "",
                companyName: "",
                companyType: "",
                phoneNumber: "",
                annualBudget: "",
                details: ""
            }
        }
    },
    async beforeMount() { console.log('Vue Loaded!'); this.pageLink = window.location.href },
    methods: {
        trackGaEvent(event) {
            gtag('event', event);
        },
        async sendForm() {
            let isEmpty = this.hasEmptyFields(this.brandForm)

            if (isEmpty) {
                this.displayError = true
                this.errorMessage = "All fields need to be filled."
                return
            }

            let data = this.jsonToFormData(this.brandForm)

            fetch(this.action, {
                method: 'POST',
                body: data, // Adiciona o FormData como o corpo da requisição
            })
                .then(response => response.json()) // ou response.text(), dependendo da resposta
                .then(data => {
                    console.log("Sucesso:", data);
                    this.showForm = !this.showForm
                })
                .catch(error => {
                    console.error("Erro:", error);
                });
            //return
        },
        hasEmptyFields(obj) {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    // Ignora o campo 'phoneNumber'
                    if (key === "phoneNumber") {
                        continue;
                    }

                    // Verifica se o valor da chave é nulo, undefined ou uma string vazia
                    if (obj[key] === null || obj[key] === undefined || obj[key] === "") {
                        return true; // Retorna true assim que encontrar um valor inválido
                    }
                }
            }
            return false; // Retorna false se não encontrar campos inválidos
        },
        jsonToFormData(json) {
            const formData = new FormData();
            for (const key in json) {
                if (json.hasOwnProperty(key)) {
                    formData.append(key, json[key]);
                }
            }
            return formData;
        },
        getAnchor() {
            return (document.URL.split('#').length > 1) ? document.URL.split('#')[1] : null;
        }
    },
    mounted() {
        gtag('event', 'pub_brands_page_landed')
    },
    async updated() {
        let anchor = this.getAnchor()

        if (anchor) {
            const pageSection = document.getElementById(anchor)
            if (pageSection) pageSection.scrollIntoView();
        }

        this.$nextTick(function () {
            // RE - INIT WF as Vue.js init breaks WF interactions
            if (!this.ressetedAnimations) {
                Webflow.destroy();
                Webflow.ready();
                Webflow.require('ix2').init();
                this.ressetedAnimations = true;
            }
        });
    },
});

fullPage.mount('#app')
