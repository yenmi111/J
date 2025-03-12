const express =require('express')
const dayjs =require('dayjs')
const app =express()    

app.set('view engine','ejs')
app.set('views','pagee')

app.get('/',(req,res)=>{    //array
        let articles = [
            {title : '小紅帽',author : 'Jim'},
            {title : '睡美人',author : 'June'},
            {title : '灰姑娘',author : 'Ann'},
        ]
 
    let now =`現在是${dayjs().hour()}時${dayjs().minute()}分${dayjs().second()}秒`   
    res.render('index',{
        time :now,
        blogs : articles,
        title :'首頁'
    }) 
})
app.get('/about',(req,res)=>{
    res.render('about',{title :'關於'})
    
})

app.use((req,res)=>{     
    res.render('404',{title :'404-找不到'})
    res.status(404)
})  
app.listen(3000)