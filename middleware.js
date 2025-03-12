//Middleware 請求和回應之間做的事

const express =require('express')
const dayjs =require('dayjs')
const app =express()    

app.use((req,res,next)=>{   //有next才會跳到下面的代碼
    console.log(`有新訪客:來自${req.hostname}|請求頁面${req.path}`) //hostname主機名稱
    next()
})

app.use(express.static('public'))   //static為middleware,不用再載,express已有
app.use(express.urlencoded({extended:true}))    //接收用戶提交過來的資料

app.set('view engine','ejs')
app.set('views','mid')

app.get('/',(req,res)=>{    
        let articles = [
            {title : '小紅帽',author : 'Jim'},
            {title : '睡美人',author : 'June'},
            {title : '灰姑娘',author : 'Ann'},
        ]
 
    let now =`現在是${dayjs().hour()}時${dayjs().minute()}分${dayjs().second()}秒`   
    res.render('in',{
        time :now,
        blogs : articles,
        title :'首頁'
    }) 
})

app.post('/',(req,res)=>{   //表單提交上來的方式用 post
    console.log(req.body)
    console.log(req.body.username)
    console.log(req.body.password)
})



app.get('/about',(req,res)=>{
    res.render('abou',{title :'關於'})
    
})

app.use((req,res)=>{     
    res.render('40',{title :'404-找不到'})
    res.status(404)
})  
app.listen(3000)