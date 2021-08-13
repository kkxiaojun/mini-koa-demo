const Emitter = require('events')
const http = require('http')
const context = require('./context')
const request = require('./request')
const response = require('./response')

class Application extends Emitter {
  constructor() {
    super()
    this.context = Object.create(context)
    this.request = Object.create(request)
    this.response = Object.create(response)
    this.middleWares = []
  }
  listen(port, callback) {
    const server = http.createServer(this.callback())
    server.listen(port)
    callback()
  }
  use(fn) {
    this.middleWares.push(fn)
    // 保持use的链式调用
    return this
  }
  callback() {
    return (req, res) => {
      let ctx = this.createContext(req, res)
      // 创建响应内容
      let response = () => this.responseBody(ctx)
      // 创建异常捕获
      let onerror = (err) => this.onerror(err, ctx)
      // 调用 compose 函数，把所有的函数合并
      const fn = this.compose()
      return fn(ctx).then(response).catch(onerror)
    }
  }
  createContext(req, res) {
    let ctx = Object.create(this.context)
    ctx.request = Object.create(this.request)
    ctx.response = Object.create(this.response)
    ctx.req = ctx.request.req = req
    ctx.res = ctx.response.res = res
    return ctx
  }
  compose() {
    return async ctx => {
      function createNext(middleware, oldNext) {
        return async () => {
            await middleware(ctx, oldNext)
        }
      }
      let len = this.middleWares.length
      let next = async () => {
          return Promise.resolve()
      }
      for (let i = len - 1; i >= 0; i--) {
          let currentMiddleware = this.middleWares[i]
          next = createNext(currentMiddleware, next)
      }
      await next()
    }
  }
  onerror(err) {
    if (!(err instanceof Error)) throw new TypeError(util.format('non-error thrown: %j', err))

    if (404 == err.status || err.expose) return

    if (this.silent) return

    const msg = err.stack || err.toString()
    console.error()
    console.error(msg.replace(/^/gm, '  '))
    console.error()
  }
  responseBody(ctx) {
    const content = ctx.body
    if (typeof content === 'string') {
      ctx.res.end(content)
    } else if (typeof content === 'object') {
      ctx.res.end(JSON.stringify(content))
    }
  }
}

module.exports =  Application
