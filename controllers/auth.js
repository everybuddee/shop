const crypto = require('crypto');
const nodemailer = require('nodemailer');

const {validationResult} = require('express-validator')

const bcrypt = require('bcryptjs')
const msg = require('nodemailer-mailgun-transport');

const User = require('../models/user')

const auth = {
    auth:{
        api_key:'f2619969974b6d02db79d94c8039f397-db4df449-638ffeb0',
        domain: 'sandbox4707e61eab404a7298d3b98a35aae198.mailgun.org'
    }}
    
const transporter = nodemailer.createTransport(msg(auth))
    
exports.getLogin = (req, res, next)=> {
    let message = req.flash('error')
    if(message.length>0){
        message = message[0]
    } else{
        message = null
    }

    res.render('auth/login', {
        path: '/login',
        pageTitle : 'Login',
        errorMessage : message
    })
}

exports.getSignup = (req, res, next)=> {
    let message = req.flash('error')
    if(message.length>0){
        message = message[0]
    } else{
        message = null
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle : 'Signup',
        errorMessage : message
    })
}
exports.postLogin = (req, res, next)=> {
    const email = req.body.email
    const password = req.body.password
    User.findOne({ email: email })
    .then(user => {
        if(!user){
            req.flash('error','invalid email or password')
            return res.redirect('/login')
        }
        bcrypt
        .compare(password, user.password)
        .then(doMatch => {
            if(doMatch == true){
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save(err =>{
                    console.log(err);
                    res.redirect('/')
             }); 
            }     
            req.flash('error','invalid email or password')   
            res.redirect('/login')
        })
        .catch(err => {
            console.log(err);
            res.redirect('/login')
        })
    })
    .catch(err => {console.log(err)})
}
exports.postSignup = (req, res, next)=>{
    const password = req.body.password
    const email = req.body.email
    const error = validationResult(req)
    if(!error.isEmpty()){
        const err = error.array()
        const msg = err[0]
        const errors = msg.msg
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle : 'Signup',
            errorMessage : errors
        })
    }
    User.findOne({ email: email})
    .then(userDoc => {
        if (userDoc){
            req.flash('error','Email already exists')
            return res.redirect('/signup')
        }
        return bcrypt
        .hash(password,12)
        .then(hashedPassword => {
            const user = new User({
                password: hashedPassword,
                email: email,
                cart: {items : []}
        })
        return user.save()
    })
        .then(result =>{
          res.redirect('/login')
          return transporter.sendMail({
            to: email,
            from: 'shop@node.com',
            subject:'Signedup successfully',
            html: '<h1>you have succesfully created an account</h1>'
          })    
          .catch(err => console.log(err))
          })
    })
    .catch(err => {console.log(err)})
}
exports.postLogout = (req, res, next)=> {
    req.session.destroy((err)=>{
        console.log(err)
        res.redirect('/')
    })
}
exports.getReset = (req, res, next) =>{
    let message = req.flash('error')
    if(message.length>0){
        message = message[0]
    } else{
        message = null
    }
    res.render('auth/reset',{
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    })
}
exports.postReset = (req,res,next) => {
    crypto.randomBytes(32,(err, buffer)=>{
        if(err){
            console.error(err)
            return res.redirect('/reset')
        }
        const token = buffer.toString('hex')
        User.findOne({email: req.body.email})
        .then(user => {
            if(!user){
              req.flash('error', 'No account found')
              return res.redirect('/reset')  
            }
            user.resetToken = token
            user.resetTokenExpiration = Date.now() + 3600000
            return user.save()
        })
        .then(result =>{
            res.redirect('/')
            transporter.sendMail({
                to: req.body.email,
                from: 'shop@node.com',
                subject:'Password reset',
                html: `
                <p>You requested password reset</p>
                <p> Click this <a href="http://localhost:3000/reset/${token}">Link</a> to reset your password</p>
                `
              })  
        })
        .catch(err => console.log(err))
    })
}
exports.getNewPassword = (req, res, next) =>{
    const token = req.params.token
    User.findOne({resetToken: token, resetTokenExpiration: {$gt : Date.now()}})
    .then(user =>{
        let message = req.flash('error')
    if(message.length>0){
        message = message[0]
    } else{
        message = null
    }
    res.render('auth/new-password',{
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken : token
    })
    })
    .catch(err => console.log(err))
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password
    const userId = req.body.userId
    const passwordToken = req.body.passwordToken
    let resetUser

    User.findOne({
        resetToken: passwordToken, 
        resetTokenExpiration: {$gt : Date.now()},
        _id: userId
    })
    .then(user => {
        resetUser = user
        return bcrypt.hash(newPassword, 12)
    })
    .then(hashedPassword =>{
        resetUser.password = hashedPassword
        resetUser.resetToken = undefined
        resetUser.resetTokenExpiration = undefined
        return resetUser.save()
    })
    .then(result =>{
        res.redirect('/login')
        transporter.sendMail({
            to: resetUser.email,
            from: 'shop@node.com',
            subject:'Password updated successfully',
            html: '<h1>you have succesfully updated the password</h1>'
          })  
    })
    .catch(err => {
        console.log(err)
    })

}