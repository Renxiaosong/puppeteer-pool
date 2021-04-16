const puppeteer = require('puppeteer')
const genericPool = require('generic-pool')
const config = require('./config');
const PagePool = require('./pagePool')

module.exports = createPool(config.browserPool);

/**
 * 初始化一个 Puppeteer 池
 * @param {Object} [options={}] 创建池的配置配置
 * @param {Number} [options.max=5] 最多产生多少个 puppeteer 实例 。如果你设置它，请确保 在引用关闭时调用清理池。 pool.drain().then(()=>pool.clear())
 * @param {Number} [options.min=1] 保证池中最少有多少个实例存活
 * @param {Number} [options.maxUses=500] 每一个 实例 最大可重用次数，超过后将重启实例。0表示不检验
 * @param {Number} [options.testOnBorrow=true] 在将 实例 提供给用户之前，池应该验证这些实例。
 * @param {Boolean} [options.autostart=false] 是不是需要在 池 初始化时 初始化 实例
 * @param {Number} [options.idleTimeoutMillis=3600000] 如果一个实例 60分钟 都没访问就关掉他
 * @param {Number} [options.evictionRunIntervalMillis=300000] 每 5分钟 检查一次 实例的访问状态
 * @param {Object} [options.puppeteerArgs={}] puppeteer.launch 启动的参数
 * @param {Function} [options.validator=(instance)=>Promise.resolve(true))] 用户自定义校验 参数是 取到的一个实例
 * @param {Object} [options.otherConfig={}] 剩余的其他参数 // For all opts, see opts at https://github.com/coopernurse/node-pool#createpool
 * @return {Object} pool
 */
function createPool(options = {}) {

    // 定义参数
    const {
        max = 5,
        min = 1,
        maxUses = 500,
        testOnBorrow = true,
        autostart = true,
        idleTimeoutMillis = 3600000,
        evictionRunIntervalMillis = 300000,
        validator = () => Promise.resolve(true),
        ...otherConfig
    } = options

    // 定义生命周期
    const factory = {
        create: async () => {
            let browser = await puppeteer.launch(config.puppeteer).catch(e => {
                console.error(e)
            });
            let pagePoolConfig = config.pagePool;
            pagePoolConfig.browser = browser;
            let pagePool = await PagePool.createPool(pagePoolConfig);
            browser.pagePool = pagePool;
            browser.useCount = 0;
            return browser;
        },
        destroy: async browser => {
            await browser.pagePool.drain();
            browser.close();
        },
        validate: browser => {
            // 执行一次自定义校验，并且校验校验 实例已使用次数。 当 返回 reject 时 表示实例不可用
            return validator(browser).then(valid =>
                Promise.resolve(valid && (maxUses <= 0 || ++browser.useCount <= maxUses))
            )
        }
    }
    // 配置generic-pool
    const genericConfig = {
        max,
        min,
        testOnBorrow,
        autostart,
        idleTimeoutMillis,
        evictionRunIntervalMillis,
        ...otherConfig
    }

    // 初始化资源池
    var pool = genericPool.createPool(factory, genericConfig);

    // 定义使用方法
    pool.use = async fn => {
        let page = await pool.acquire();
        let result = await fn(page).catch(e => {
            pool.release(page);
            throw e;
        });
        pool.release(page);
        return result;
    }

    return pool;
}