//1 //nodemon 自動更新結果

//npm install nodemon -g --save    下載插件 global
//nodemon 執行

//npm install dayjs  (npm i dayjs)       只適用這個專案

//package.json  第三方插件清單
//npm init
// -----------------------------------------

const http=require('http')
const fs=require('fs')
const dayjs = require('dayjs')

/* console.log(dayjs().year())
console.log(dayjs().hour())
console.log(dayjs().minute())
console.log(dayjs().second()) */

const server = http.createServer((req,res)=>{ 
    let path= './page/'
    switch(req.url)
    {
        case '/':
            path += 'index.html'
            res.statusCode=200  //檔案回應類型 200 -ok
            break;
        case '/about':
            path += 'about.html' 
            res.statusCode=200
            break;
        case '/apple':  //F12 -點 apple -headers-res headers-location:
            res.statusCode=301
            res.setHeader('Location','/about')
            return res.end()    //會立即結束函式執行

            
        default:
            path += '404.html'
            res.statusCode=404  ////檔案回應類型 404 -頁面不存在    //F12 check
            break;           
    }

    res.setHeader('Content-Type','text/html') 
    fs.readFile(path,(error,data)=>{
        if(error)
            console.log(error)
        else
            res.write(data)

        res.end()
    })
    
})
server.listen(3000,'localhost',()=>{  
    console.log('伺服器已在聆聽') 
})
