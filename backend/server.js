require('dotenv').config()

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const User = require('./models/User')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')


const initializePassport = require('./passport-config/passport-config')
initializePassport (
    passport, 
    name => User.findOne({name: name}),
    id => User.findOne({_id: id})
)
require("./passport-config/passport-google")

mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

const userRouter = require('./routes/users')
app.use('/users', userRouter)

app.get('/', (req, res) => {
    res.send('<a href="/auth/google">Authenticate with Google</a>')
})

app.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }))

app.get('/google/callback', passport.authenticate('google', {
    successRedirect: '/protected',
    failureRedirect: '/login'
}))

app.get('/login', alreadyLoggedIn, (req, res) => {
    res.send("Login Page")
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/protected',
    failureRedirect: '/login'
}))

app.get('/protected', checkAuthenticated, (req, res) => {
    res.send("Hello!")
})

app.post('/register', async (req, res) => {
    try {
        if ((await User.findOne({name: req.body.name})) != null) {
            res.send("User already exists")
        }
        else {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const user = new User({
                name: req.body.name,
                password: hashedPassword
            })
            const newUser = await user.save()
            res.status(201).json(newUser)
        }
    } catch(err) {
        res.json({ message: err.message })
    }
})

app.delete('/logout', (req, res) => {
    req.logOut()
    req.redirect('/login')
})

// Login checks
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

function alreadyLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/protected')
    }

    next()
}

app.listen(3000, () => console.log('Server Started'))