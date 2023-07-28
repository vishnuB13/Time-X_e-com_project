const express = require('express')
const logger = require('morgan')
const dotenv = require('dotenv');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');
const nocache = require('nocache');
const swal = require('sweetalert2')





const app = express();   

  
dotenv.config({path:'./.env'})    
         
//Session       
     
app.use(session({          
  secret:process.env.SESSION_SECRET_KEY ,  
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // set cookie options
}));  

    const db = process.env.DATABASE_LOCAL;
    mongoose.connect(db,{ 
      useNewUrlParser:true, 
      useUnifiedTopology: true,
    }).then(()=>console.log("mongodb connected"))
    .catch(err=>console.log(err.message))
                     
  
//   //connecting to database
     

                            
             
app.use(logger('dev'))    
//Body parser    
app.use(express.json()) 
app.use(express.urlencoded({extended:false}));

      
//cookie parser 
app.use(cookieParser());

// Disable caching of responses     
app.use(nocache());  


  
// Enable layout templates using express-ejs-layouts
app.use(expressLayouts);
app.use(express.static('public'));

app.set('layout', 'layouts/layout');


// Set up the views directory and view engine 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
 
// Serve static files from the public directory
app.use(express.static('assets'));
app.use(express.static(path.join(__dirname, 'public')));
 
app.use('/',require('./routes/user'))    
app.use('/admin',require('./routes/admin')) 
     
      
const port = process.env.PORT ;           
    
app.listen(port,()=>{ 
  console.log(`server listening to http://localhost:${port}`);    
}); 
        
        
  
      
