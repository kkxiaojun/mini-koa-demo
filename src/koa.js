let Koa = require('./application')

let app = new Koa()

app.use(async (ctx, next) => {
    console.log(1)
    await next()
    console.log(6)
});

app.use(async (ctx, next) => {
    console.log(2)
    await next()
    console.log(5)
})

app.use(async (ctx, next) => {
    console.log(3)
    console.log('ctx===>', ctx)
    ctx.body = "hello world"
    console.log(4)
    next()
})

app.listen(3000, () => {
    console.log('listenning on 3000')
});
