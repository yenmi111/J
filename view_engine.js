//加入動態資料到網站

//npm i ejs   (view engine)

const express =require('express')
const dayjs =require('dayjs')
const app =express()    

app.set('view engine','ejs')    //使用ejs樣板 <%= %> 
app.set('views','bag')    //指讀取bag資料夾下的資料

app.get('/',(req,res)=>{     
    let now =`現在是${dayjs().hour()}時${dayjs().minute()}分${dayjs().second()}秒`   //時間

    res.render('ind',{courseName :'首頁',time :now})    //更改網站名(title)   
    //res.sendFile('./page/index.html',{root:__dirname})
})



app.get('/about',(req,res)=>{
    let now =`現在是${dayjs().hour()}時${dayjs().minute()}分${dayjs().second()}秒`
    res.render('aboutt',{courseName :'關於',time :now})
})

app.use((req,res)=>{     
    let now =`現在是${dayjs().hour()}時${dayjs().minute()}分${dayjs().second()}秒`
    res.render('4044',{courseName :'關於',time :now})
    res.status(404)
})  
app.listen(3000)