var express = require("express");
var app = express();
//var moment = require('moment');
var moment = require('moment-shortformat');

const jwt = require('jsonwebtoken');

var users = require('./routes/users');


var passport = require('passport');
var authenticate = require('./authenticate');

const checkAuth = require('./middleware/check-auth');

var port = 4000;
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var promise = require('bluebird');

var options = {
    promiseLib: promise
};

const config = {
    host: 'localhost',
    port: 5432,
    database: 'timekeeper',
    user: 'postgres',
    password: '12345'
};

// Load and initialize pg-promise:
const pgp = require('pg-promise')(options);

// Create the database instance:
const db = pgp(config);

app.use(passport.initialize());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});



// var router = express.Router();
// router.use(bodyParser.json());

app.post('/signup', async (req, res, next) => {

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

app.post('/login', async (req, res, next) => {

    try {
        console.log(req.body)
        let data = await db.any(`Select * from login where login.email = '${req.body.email}' AND login.password = '${req.body.password}'`);

        if (data.length == 1) {
            const token = authenticate.getToken({ email: data[0].email });
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

app.get('/checkJWTtoken', async (req, res, next) => {

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



//app.use('/users/', users);
/* This is an API for getting all
   the accounts created
*/
app.get('/allUserInfo', checkAuth, async (req, res, next) => {

    try {

        let output = await db.any('select * from login')
        res.status(200)
            .json(output);
    }
    catch (error) {

        res.statusCode = 404;
        return next(error);
    }
})

app.get('/user/:ID', async (req, res, next) => {

    try {

        let output = await db.any(`select * from login where login.id = ${req.params.ID}`)
        if (output.length == 0) {
            res.status(404)
                .json({
                    message: 'No data found'
                })
        }
        res.status(200)
            .json(output);
    }
    catch (error) {

        res.statusCode = 404;
        return next(error);
    }
})


app.post('/employData', async (req, res, next) => {

    try {

        // The below code is used to increment the id by 1
        let data = await db.any('select * from employ_info_table');
        req.body.e_id = data.length + 1;

        // The below code is used to add a new employ to the database
        await db.none('insert into employ_info_table(e_id, ename, contact_no, email, address, date_of_joining, date_of_birth)' + 'values(${e_id}, ${ename}, ${contact_no}, ${email}, ${address}, ${date_of_joining}, ${date_of_birth})', req.body);
        res.status(200)
            .json({
                status: 'success',
                message: 'Information Added'
            })
    }
    catch (error) {
        res.statusCode = 404;
        return next(error);
    }
})


app.get('/viewEmployInfo', async (req, res, next) => {

    try {

        let output = await db.any('select * from employ_info_table')
        res.status(200)
            .json(output);
    }
    catch (error) {

        res.statusCode = 404;
        return next(error);
    }
})

app.get('/viewEmployInfo/:EID', async (req, res, next) => {

    console.log(req.params.EID)
    try {

        let output = await db.any(`select * from employ_info_table where employ_info_table.e_id = ${req.params.EID}`)
        if (output.length == 0) {
            res.status(404)
                .json({
                    message: 'No data found'
                })
        }
        res.status(200)
            .json(output);
    }
    catch (error) {

        res.statusCode = 404;
        return next(error);
    }
})

app.post('/employe/employeclk/:ID', async (req, res, next) => {

    try {

        req.e_id = req.params.ID;
        await db.none(`insert into employ_clock(id, e_id, date, clck_in, clk_out, lunch_in, lunch_out, total_lhr, total_wrk'
         + 'values(${id}, ${e_id}, ${date}, ${clck_in}, ${clk_out}, ${lunch_in}, ${lunch_out}, ${total_lhr}, ${total_wrk})
          where employ_clock.e_id = ${req.params.ID}`,
            req.body);

        res.status(200)
            .json({
                status: 'success',
                message: "Date Added",
            })
    }
    catch (error) {

        await db.none(`insert into employ_clock(id, e_id, date, clck_in, clk_out, lunch_in, lunch_out, total_lhr, total_wrk'
         + 'values(${id}, ${e_id}, ${date}, ${clck_in}, ${clk_out}, ${lunch_in}, ${lunch_out}, ${total_lhr}, ${total_wrk})`,
            req.body);
        res.statusCode = 404;
        return next(error);
    }

})

app.get('/employe/employeclkData', async (req, res, next) => {

    try {

        let data = await db.any('select * from employ_clock');
        res.status(200).json(data);
    }
    catch (error) {

        res.statusCode = 404;
        return next(error);
    }
})

app.post('/check_clock_request', async (req, res, next) => {

    try {

        let data = await db.any(`select * from sample_employ_clock where sample_employ_clock.flag = ${true} and sample_employ_clock.email = '${req.body.email}'`);

        if (data.length >= 1) {

            let storeClockInDate = data[0].clock_in;
            storeClockInDate = storeClockInDate.slice(4, 24);

            const end = moment().format('MMM DD YYYY HH:mm:ss');
            let ms = moment(end, "MMM DD YYYY HH:mm:ss").diff(moment(storeClockInDate, "MMM DD YYYY HH:mm:ss"));
            let d = moment.duration(ms);

            res.json({
                minutes: moment.utc(ms).format("mm"),
                hours: Math.floor(d.asHours()),
                seconds: moment.utc(ms).format("ss")
            });

        }
        else {
            res.status(404)
                .json({
                    message: 'The user has not clocked-in yet'
                })
        }
    }
    catch (error) {
        res.statusCode = 404;
        return next(error);
    }
})

app.post('/addclockindata', async (req, res, next) => {

    try {
        let presentDate = moment().format('YYYYMMDDHH');
        let user = req.body.email;

        //let pastDate = parseInt(presentDate) - 1;

        //let output = await db.any(`select * from sample_employ_clock where email = '${user}' AND date = '${presentDate}' `);

        let output = await db.any(`select * from sample_employ_clock where email = '${user}' order by date LIMIT 1`);
        console.log(output);

        if (output.length != 0) {
            res.status(400)
                .json({
                    message: "You cannot clock in right now"
                })
        }
        else {
            let clock_in = new Date().toString();
            clock_in = clock_in.slice(0, 24);
            req.body.clock_in = clock_in;
            req.body.clock_out = null;
            req.body.lunch_in = null;
            req.body.lunch_out = null;
            req.body.total_hour = null;
            req.body.flag = true;
            req.body.lunch_flag = false;
            req.body.date = moment().format('YYYYMMDDHH');

            await db.none('insert into sample_employ_clock values(${clock_in}, ${clock_out}, ${flag}, ${email}, ${lunch_in}, ${lunch_out}, ${total_hour}, ${date}, ${lunch_flag})', req.body);
            res.status(200)
                .json({
                    message: 'Clocked in Successfully'
                })
        }
    }
    catch (error) {
        res.statusCode = 404;
        return next(error);
    }
})

app.post('/addlunchindata', async (req, res, next) => {

    try {

        let data = await db.any(`select * from sample_employ_clock where email = '${req.body.email}' AND lunch_flag = '${false}' AND clock_out is NULL`);

        if (data.length != 0) {

            let lunch_in = new Date().toString();
            lunch_in = lunch_in.slice(0, 24);
            req.body.lunch_in = lunch_in;
            req.body.lunch_out = null;

            await db.none('update sample_employ_clock set lunch_in = ${lunch_in}, lunch_flag = true where sample_employ_clock.email = ${email} and sample_employ_clock.flag = true', req.body);
            res.status(200)
                .json({
                    message: 'Lunched in Successfully'
                })
        }
        else {
            res.statusCode = 403;
            res.json({ message: 'You have already lunched in. You cannot go for lunch again!' });
        }
    }
    catch (error) {
        res.statusCode = 404;
        return next(error);
    }
})

app.post('/lunchoutdata', async (req, res, next) => {

    try {

        let data = await db.any(`select * from sample_employ_clock where email = '${req.body.email}' AND lunch_flag = '${true}' AND lunch_out is NULL`);

        if (data.length != 0) {
            let lunch_out = new Date().toString();
            lunch_out = lunch_out.slice(0, 24);
            req.body.lunch_out = lunch_out;

            await db.none('update sample_employ_clock set lunch_out = ${lunch_out} where sample_employ_clock.email = ${email} and sample_employ_clock.flag = true', req.body);
            res.status(200)
                .json({
                    message: 'Lunched out Successfully'
                })
        }

        else {
            res.statusCode = 403;
            res.json({ message: 'You cannot lunched out again' });
        }
    }
    catch (error) {
        res.statusCode = 404;
        return next(error);
    }
})

app.post('/addclockoutdata', async (req, res, next) => {

    try {

        let clock_out = new Date().toString();
        clock_out = clock_out.slice(0, 24);
        req.body.clock_out = clock_out;

        let data = await db.any(`Select * from sample_employ_clock where sample_employ_clock.email = '${req.body.email}' AND sample_employ_clock.flag = ${true}`);

        if (data.length >= 1) {
            let clock_in = data[0].clock_in;
            let lunch_in = data[0].lunch_in;
            let lunch_out = data[0].lunch_out;

            let storeClockInDate = clock_in;
            storeClockInDate = storeClockInDate.slice(4, 24);

            const end = moment().format('MMM DD YYYY HH:mm:ss');
            let ms = moment(end, "MMM DD YYYY HH:mm:ss").diff(moment(storeClockInDate, "MMM DD YYYY HH:mm:ss"));
            let d = moment.duration(ms);

            let officehr = Math.floor(d.asHours());
            let officemin = parseInt(moment.utc(ms).format("mm"));
            let officesec = parseInt(moment.utc(ms).format("ss"));

            if (officehr < 10) {
                officehr = '0' + officehr;
            }

            req.body.total_hour = officehr + 'h ' + officemin + 'm';

            let officeTimeFormat = officehr + officemin;

            if (lunch_in && lunch_out) {
                let storeLunchInDate = lunch_in;
                storeLunchInDate = storeLunchInDate.slice(4, 24);

                let storeLunchOutDate = lunch_out;
                storeLunchOutDate = storeLunchOutDate.slice(4, 24);

                let time = moment(storeLunchOutDate, "MMM DD YYYY HH:mm:ss").diff(moment(storeLunchInDate, "MMM DD YYYY HH:mm:ss"));
                let dur = moment.duration(time);

                let lunchhr = Math.floor(dur.asHours());
                let lucnhmin = parseInt(moment.utc(time).format("mm"));
                let lunchsec = parseInt(moment.utc(time).format("ss"));

                console.log('officehr:' + officehr + 'officemin:' + officemin);
                console.log('lunchhr:' + lunchhr + 'lucnhmin:' + lucnhmin);

                if (lunchhr < 10) {
                    lunchhr = '0' + lunchhr;
                }

                let lunchTimeFormat = lunchhr + lucnhmin;

                let totaltime = moment(officeTimeFormat, "HH:mm").diff(moment(lunchTimeFormat, "HH:mm"));
                let duration = moment.duration(totaltime);

                let totalhour = Math.floor(duration.asHours());
                let totalmin = parseInt(moment.utc(totaltime).format("mm"));

                req.body.total_hour = "";
                req.body.total_hour = totalhour + 'h ' + totalmin + 'm';

            }

            await db.none('update sample_employ_clock set clock_out = ${clock_out}, total_hour = ${total_hour}, flag = false where sample_employ_clock.flag = true and sample_employ_clock.email = ${email}', req.body);
            res.status(200)
                .json({
                    message: 'Clocked out Successfully'
                })
        }
    }
    catch (error) {
        res.statusCode = 404;
        return next(error);
    }
})

app.post('/getcurrentweekdata', async (req, res, next) => {

    try {

        let dt = new Date();
        let todayDayNo = dt.getDay();

        let endDate = moment().format('YYYYMMDD') + '24';
        let startDate = moment().subtract(todayDayNo, 'days').format('YYYYMMDD') + '00';

        let data = await db.any(`select * from sample_employ_clock where email = '${req.body.email}' and flag = false and date <= '${endDate}' and date >= '${startDate}' ORDER BY date ASC`);

        res.status(200)
            .json({ data });
    }
    catch (error) {
        res.statusCode = 403;
        next(error);
    }

});

app.post('/getlastweekdata', async (req, res, next) => {

    try {

        let dt = new Date();
        let todayDayNo = dt.getDay();

        let startDate = moment().subtract(todayDayNo + 7, 'days').format('YYYYMMDD') + '00';
        let endDate = moment().subtract(todayDayNo + 1, 'days').format('YYYYMMDD') + '24';

        let data = await db.any(`select * from sample_employ_clock where email = '${req.body.email}' and flag = false and date <= '${endDate}' and date >= '${startDate}' ORDER BY date ASC`);

        res.status(200)
            .json({ data });

    }
    catch (error) {
        res.statusCode = 403;
        next(error);
    }
})

app.post('/getdatabydates', async (req, res, next) => {

    try {
        console.log(req.body)

        req.body.startDate = moment(req.body.startDate).format("YYYYMMDD") + "00";
        req.body.endDate = moment(req.body.endDate).format("YYYYMMDD") + "24";

        let response = await db.any(`select * from sample_employ_clock where email = '${req.body.email}' and date >= '${req.body.startDate}' AND date <= '${req.body.endDate}' AND clock_out is not NULL `)

        res.json(response)
    }

    catch (error) {
        res.statusCode = 403;
        next(error);
    }
})

app.post('/getdaysinamonth', async (req, res, next) => {

    try {

        req.body.startDate = moment(req.body.startDate).format("YYYYMMDD") + "00";
        req.body.endDate = moment(req.body.endDate).format("YYYYMMDD") + "24";

        let data = await db.any(`select * from sample_employ_clock where email = '${req.body.email}' AND date >= '${req.body.startDate}' AND
         date <= '${req.body.endDate}' AND clock_in LIKE '${req.body.day}%' `)

        res.json(data);
    }
    catch (err) {
        res.statusCode = 403;
        next(error)
    }
})

app.get('/testquery', async (req, res, next) => {

    try {

        //console.log(moment().month("Feb").format("MM"))
        console.log(moment("Mon Feb 04 2019 00:00:00 GMT+0530 (India Standard Time)").format("YYYYMMDD"))
    }
    catch (error) {
        res.statusCode = 403;
        next(error);
    }
})


app.listen(port, () => {
    console.log("Server listening on port " + port);
});

module.exports = db;