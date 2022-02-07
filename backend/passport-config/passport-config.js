const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserByName, getUserById) {
    const authenticateUser = async (name, password, done) => {
        const user = await getUserByName(name)
        if (user == null) {
            return done(null, false, { message: "No user with that name"})
        }
        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, { message: "Password incorrect"})
            }
        } catch(err) {
            return done(err)
        }
    }

    passport.use(new LocalStrategy({ usernameField: 'name'}, authenticateUser))
    passport.serializeUser((user, done) => done(null, user._id))
    passport.deserializeUser(async (id, done) => {
        return done(null, await getUserById(id))
    })
}

module.exports = initialize