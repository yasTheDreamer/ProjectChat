const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const Contact = require('../models/contact')
const Message = require('../models/message')
const FriendShip = require('../models/freindship')
const ContactSchema = require('../db/Contactdb')
const MessageSchema = require('../db/Messagedb')
const FriendShipShcema = require('../db/FriendShip')
const mongoose = require('mongoose')



const {check, validationResult} = require('express-validator');
const flash = require('connect-flash')
const session = require('express-session');
const { Store } = require('express-session');
const { fileURLToPath } = require('url');
const { findOneAndRemove } = require('../db/Contactdb');

app.set('views', './public/views');
app.set('view-engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(session({
        secret : "secret",
        resave : false,
        saveUninitialized : false,
        Store:Store
}))
app.use(flash())
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache');
    next();
})


let user = new Contact(); 
let userSchema;
let friends = [];


mongoose.connect('mongodb://localhost:27017/test',{useNewUrlParser : true, useUnifiedTopology : true} )

mongoose.connection
        .once('open', () => console.log("connected to database"))
        .on('error' , () =>console.log("error") )

app.get('/', (req,res) => {

    if(req.session && req.session.user){
        res.render('contact.ejs')
    }
    else {
        res.redirect('/login')
    }
    
})



app.get('/register', (req, res) => {

    if(req.session && req.session.user){
        res.redirect('/login');
    }
    else {
        res.render('register.ejs', {email_empty : req.flash('email'),
        username : req.flash('username'), 
        password_empty : req.flash('password'),
        userExists : req.flash('userExists')
       });
    }


 
})


app.post('/register', [check('email', 'email is empty').notEmpty(),
                        check('email', 'email format is wrong').isEmail(),
                        check('username', 'username is empty').notEmpty(),
                        check('password', 'password is empty').notEmpty(),
                        check('password', 'password must be minmum 4 characters long').isLength({min : 4})],
                        (req, res) => {


    const errors = validationResult(req);

    if(errors.isEmpty()){
        let email = req.body.email;
        let username = req.body.username;
        let password = req.body.password;

        user = new Contact(new mongoose.Types.ObjectId(), email, username, password);

        
        ContactSchema.countDocuments({email : user.email},async (err, count) => {
            if(count) {
                req.flash('userExists', 'this email is already used')
                res.redirect('/register')
            }
            else {
                
                ContactSchema.countDocuments({username:user.username}, async (err,count)=> {

                    if(count){
                        req.flash('userExists', 'this username is already used')
                        res.redirect('/register')
                    }
                    else {
                        
                userSchema = new ContactSchema({
                    _id : user.id,
                    email : user.email,
                    username : user.username,
                    password : new ContactSchema().generateHash(user.password)
                })
                

                await userSchema.save();

                
                res.redirect('/login');
                    }
                
                
                })


            }
            
        });

    }
        
    else {
       Object.keys(errors).forEach((key) => {
            for(let value of Object.values(errors[key])){
                req.flash(value.param, value.msg)
            }
                
       })
       
       res.redirect('/register');    
    }

})
 

app.get('/login',  (req, res) => {

    if(req.session && req.session.user){
        user = req.session.user;
        res.render('contact.ejs');
    }
    else {
        
        res.render('login.ejs', {loginemail : req.flash('loginemail'),
        loginpassword : req.flash('loginpassword'),
        userNotFound : req.flash('userNotFound'),
        incorrectPassword : req.flash('incorrectPassword')});

    }
   
})

app.post('/login',[ check('loginemail', 'email is required').notEmpty(),
                    check('loginemail', 'email format is wrong').isEmail(),
                    check('loginpassword', 'password is required').notEmpty()],
                    async (req, res) => {

            const errors  = validationResult(req);

            if(errors.isEmpty()) {
                let email = req.body.loginemail;
                let password = req.body.loginpassword;

               await ContactSchema.findOne({email :email}, async function(err, localuser) {
                    if(err){
                        res.send(err)
                    }
                    else{
                        user = new Contact();
                        if(localuser != {} && localuser!= null){
                           if(localuser.validPassword(password)){
                                user.id = localuser.id;
                                user.email = localuser.email;
                                user.username = localuser.username;
                                user.password = localuser.password;
                                req.session.user = user;

                                await FriendShipShcema.find({firstContact : user.id},  (err, users) => {
                                    users.forEach(async (user) => {
                                       await ContactSchema.find({ _id: user.secondContact }, (err, user) => {
                                           friends.push(user);
                                       });

                                   });
    
    
                               })

                                //loginstateChanged = true;
                                res.render('contact.ejs');
                           }
                           else {
                               req.flash('incorrectPassword', 'incorrect password');
                               res.redirect('/login');
                           }
                            
                           





                        }
                        else {
                            req.flash('userNotFound', 'no user with this email found');
                            res.redirect('/login');
                        }
                        
                    }
                })
               

            }
            else {
                Object.keys(errors).forEach((key) => {
                        for(let value of Object.values(errors[key])){
                                req.flash(value.param, value.msg);
                        }
                })

                res.redirect('/login');
            }

        
    
})


app.get('/addFriend', (req, res) => {

    if(req.session && req.session.user){
        res.render('addFriend.ejs', {usernameNotFound: req.flash('usernameNotFound'),
        userNotFound : req.flash('userNotFound'),
        notLoggedIn : req.flash('notLoggedIn')});
    }
    else {
        res.redirect('/login')
    }
    
})

app.post('/addFriend', check('addusername', 'username is required').notEmpty(), async (req,res) => {

   
    if(req.session && req.session.user){
        let addusername = req.body.addusername;

        const errors = validationResult(req);
    
        if(errors.isEmpty()){
        
            await ContactSchema.findOne({username: addusername}, async (err, userFriend) => {
                let freindship = new FriendShip(user, userFriend)
    
    
                if(userFriend != null &&  userFriend != undefined) {
                    let freindshipShcema = new FriendShipShcema({
                        firstContact : user.id,
                        secondContact : userFriend._id          
                    })
                
        
                    await freindshipShcema.save()
        
                    res.redirect('/login')
                }
                else {
                    req.flash('userNotFound', 'no user found with this username');
                    res.redirect('/addFriend');
                }
              
            })
    
        }
        else {
            req.flash('usernameNotFound','username is required');
            res.redirect('/addFriend')
        }
    
    }
    else {
        req.flash('notLoggedIn', 'you should login to add a friend');
        res.redirect('/addFriend');
    }

    
})  

app.get('/logout', (req,res) => {
    req.session.destroy();
    friends = [];
    res.redirect('/login');
});

io.on('connection', socket => {

    socket.emit('user', user);

        socket.emit('friends', friends);
        console.log(friends)

    socket.on('newMessage', async messagesent => {

        let messageSchema = new MessageSchema({
            message : messagesent.message,
            sender : messagesent.sender.id,
            reciever : messagesent.receiver.id
            
        });

        console.log(messageSchema);



        await messageSchema.save((error) => {
                if(!error) {
                    MessageSchema.find({})
                                .populate('sender')
                                .populate('reciever')
                                .exec((error, messages)=> {
                                    
                                })
                }
        })
        
    })

    socket.on('usernametoget', async username => {
      
      await  ContactSchema.findOne({username : username}, (err, userfound) => {
           
            if(!err){
                socket.emit('receiver', userfound);
            }
            else {
                console.log('error')
            } 
                
            })
    }) 


    socket.on('getmessages', async data => {

        let user1 = data.user1;
        let user2 = data.user2;

        console.log(user1)
        console.log(user2);

        await MessageSchema.find({sender : user1.id, reciever : user2.id} , (err, messages) => {
           if(err)
                console.log(err);
            else
                socket.emit('messagessent', messages);
        })

    })




})


server.listen(3000)
