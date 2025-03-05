// code簡潔

//npm i express

const express =require('express')

const app =express()    //創作新的express app

app.get('/',(req,res)=>{        //get 需訪問指定網址
    res.sendFile('./page/index.html',{root:__dirname})
})
app.get('/about',(req,res)=>{
    res.sendFile('./page/about.html',{root:__dirname})  //304 快取版本
})

app.get('/abc',(req,res)=>{     //302 暫時轉頁面
    res.redirect('/about')  //response.redirect
})

app.use((req,res)=>{     //不符合上述條件時執行此
    res.sendFile('./page/404.html',{root:__dirname})
    res.status(404)

    // res.status(404).sendFile('./page/404.html',{root:__dirname})
    
})  
app.listen(3000)