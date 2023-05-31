
export function stringToObject(str) {
    const obj = {};
    str.split(",").forEach((pair) => {
        const [key, value] = pair.split(":");
        obj[key] = parseInt(value);
    });
    return obj;
}

export function getOneTrustCookies(cookieJar) {
    let candy;
    cookieJar.split(" ").forEach(cookie => {
        let name = cookie.split("=")[0];
        if (name === "OptanonConsent") {
            candy = cookie
        }
    })
    return candy
}

export function getOneTrustPermissions(cookie) {
    let permissions;
    let groups;
    let vendors;
    let hosts;

    if (cookie.length == 0) return window.location.reload();
    cookie.split("&").forEach(category => {
        let name = category.split("=")[0];
        let content = category.split("=")[1]
        switch (name) {
            case "groups":
                groups = content
                break;

            case "genVendors":
                vendors = content
                break;

            case "hosts":
                hosts = content
                break;
        }
    })

    return permissions = {
        groups: decodeURIComponent(groups),
        genVendors: decodeURIComponent(vendors),
        hosts: decodeURIComponent(hosts)
    }
}

export function runAnalytics(serial) {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
        
    window.ga = window.ga || function () { (ga.q = ga.q || []).push(arguments) }; ga.l = +new Date;
    ga('create', serial, 'auto');
    ga('send', 'pageview');
}
export function runGTag(serial) {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());

    gtag('config', serial);
}
export function runMetaPixel(serial) {
    !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
            n.callMethod ?
            n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s)
    }(window, document, 'script',
        'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', serial);
    fbq('track', 'PageView');
}

export function runTikTokPixel(serial){
    !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++
      )ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=i+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
 
        ttq.load(serial);
        ttq.page();
      }(window, document, 'ttq');
}
