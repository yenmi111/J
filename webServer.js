     //1
const http=require('http')

const server = http.createServer((req,res)=>{ //request response //伺服器收到請求
    console.log('訪客請求已收到')

    console.log('url:',req.url) //在網站的哪一個網頁  / 代表首頁
    console.log('method:',req.method) //用什麼method請求伺服器

    res.setHeader('Content-Type','text/html')   //(回應的內容種類,種類)

    res.write('<meta charset="UTF-8">')
    res.write('<h1>hello</h1>')
    res.write('<h2>義守大學</h2>')
    res.end()
})

server.listen(3000,'localhost',()=>{  //(port,網址)
    console.log('伺服器已在聆聽')  //search localhost:3000 //ctrl+c stop the server
})


    //2
const http=require('http')
const fs=require('fs')

const server = http.createServer((req,res)=>{ //request response //伺服器收到請求

    let path= './page/'
    switch(req.url)
    {
        case '/':
            path += 'index.html'
            break;
        case '/about':
            path += 'about.html' // localhost:3000/about
            break;
        default:
            path += '404.html'
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

server.listen(3000,'localhost',()=>{  //(port,網址)
    console.log('伺服器已在聆聽')  //search localhost:3000 //ctrl+c stop the server
})
