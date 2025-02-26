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
