let BrowserPool = require("./utils/browserPool")

async function run(){
	let url = 'https://blog.csdn.net/qq_18827233/article/details/108000740'
	await BrowserPool.use(async browser =>{
        let pagePool = browser.pagePool;
        await pagePool.use(async page =>{
            await page.goto(url,{timeout:0});
            let u = new Date().getTime();
            let filekey = "IM_" + u + ".png";
            let tmpfile = "./"+filekey;
            await autoScroll(page);
            await page.screenshot({
                path: tmpfile,
                fullPage: true
            })
        })
    })
    return;
}

/**
 * 滚动截屏
 * @param page
 * @returns {Promise<*>}
 */
async function autoScroll(page) {
    return page.evaluate(() => {
        return new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        })
    });
}


run();