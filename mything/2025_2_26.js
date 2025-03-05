//1
console.log(__dirname) //js檔案 資料夾路徑
console.log(__filename) //js檔案 資料夾路徑 和檔案名稱

//2
const fs=require('fs') //匯入模組- 設常數 名稱為fs(file system) //require後面放參數 把模組的所有東西放入常數fs

   //寫入檔案
 fs.writeFile('./demo.txt','123',()=>{ //(檔案存放地,寫入檔案內容,callbackfunction)  // ./表示同一層
    console.log('寫入完成')
}) 

    //讀取檔案內容(data)
fs.readFile('./demo.txt',(error,data)=>{ //error把錯誤原因放入,data讀取檔案內容 //(參數)
    if(error)
        console.log(error)
    else
        console.log(data.toString())
})

    //讀取檔案內容(error)
fs.readFile('./demo1.txt',(error,data)=>{ 
    if(error)
        console.log(error)
    else
        console.log(data.toString())
})
    //開新的資料夾1
fs.mkdir('./image',(error)=>{   //make directory //(檔案存放地,callbackfunction)
    if(error)
        console.log(error)
    else
        console.log('資料夾已成功創立')
})   

    //開新的資料夾2
if(!fs.existsSync('./image'))
{
    fs.mkdir('./image',()=>{   
        console.log('資料夾已成功創立')
    })      
}

    //刪除檔案1 
 fs.unlink('./delete.txt',(error)=>{
    if(error)
        console.log(error)
    else
        console.log('檔案已刪除')
})     
  
    //刪除檔案2
if(fs.existsSync('./delete.txt'))
{
    fs.unlink('./delete.txt',()=>{
        console.log('檔案已刪除')
    })     
}




fs.readFile(__dirname + '/demo.txt',(error,data)=>{ //error把錯誤原因放入,data讀取檔案內容 //(參數)
    if(error)
        console.log(error)
    else
        console.log(data.toString())
})