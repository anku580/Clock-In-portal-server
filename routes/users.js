var express = require('express');
const bodyParser = require('body-parser');
var passport = require('passport');
var authenticate = require('../authenticate');


var router = express.Router();
router.use(bodyParser.json());

router.post('/signup', async (req, res, next) => {

    try {

        // The below code is used to increment the id by 1
        let data = await db.any('select * from login');
        req.body.id = data.length + 1;
        req.body.role = "user"

        // The below code is used to add a new user to the database
        await db.none('insert into login(id, email, password, role)' + 'values(${id}, ${email}, ${password}, ${role})', req.body);
        res.status(200)
            .json({
                status: 'success',
                message: 'Account Accessed!'
            })
    }
    catch (error) {
        res.statusCode = 404;
        return next(error);
    }
})

router.post('/login', async (req, res, next) => {

    try {
        console.log(req.body)
        let data = await db.any(`Select * from login where login.email = '${req.body.email}' AND login.password = '${req.body.password}'`);

        if (data.length == 1) {
            const token = authenticate.getToken({ email : data[0].email} );
            res.status(200)
                .json({
                    message: 'Logged in Successfully',
                    data: data[0],
                    token: token
                })
        }
        else {
            res.status(401)
                .json({
                    message: 'Unauthorized: There is not any account registered with this email'
                })
        }
    }
    catch (error) {
        res.statusCode = 404;
        return next(error);
    }
})

router.get('/checkJWTtoken', async (req, res, next) => {

    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err)
            return next(err);

        if (!user) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.json({ status: 'JWT invalid!', success: false, err: info });
        }
        else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({ status: 'JWT valid!', success: true, user: user });

        }
    })(req, res, next);
})



module.exports = router;