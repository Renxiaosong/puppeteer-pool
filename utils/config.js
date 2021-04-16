module.exports = {
    puppeteer: {
        headless: false, // 是否启用无头模式页面
        //args:['--no-sandbox'],
        args: [
            "–disable-gpu",
            "–disable-dev-shm-usage",
            "–disable-setuid-sandbox",
            "–no-first-run",
            "–no-sandbox",
            "–no-zygote",
            "–single-process"
        ],
        ignoreHTTPSErrors: true,
        timeout: 0
    },
    browserPool: {
        min:1,
        max:5,
        idleTimeoutMillis:3600000
    },
    pagePool: {
        min:1,
        max:10,
        idleTimeoutMillis:300000
    }
}