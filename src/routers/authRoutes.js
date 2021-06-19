const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');



const User = mongoose.model('User');

router.post('/signup',async (req,res) => {
    const {email,password,nick_name} = req.body;
    try{
        const user = new User({email,password,nick_name});
        await user.save();
    
        const token = jwt.sign({userID: user._id},process.env.JWT_SECRET_KEY);
        
        res.send({token:token})
    }
    catch(err){
        return res.status(422).send(err.message);
    }

});

router.post('/signin',async (req,res)=> {
    const {email,password} = req.body;
    if(!email || !password){
        return res.status(422).send({error: 'Must provide email and password'})
    }

    const user = await User.findOne({email});
    if (!user) {
        //Email not found
        return res.status(422).send({error:'Invalid Password or Email'})
    }
    try {
        await user.comparePassword(password)
        const token = jwt.sign({userID: user._id},process.env.JWT_SECRET_KEY)
        res.send({token});
    }
    catch(err){
        //Password error
        return res.status(422).send({error:'Invalid Password or Email'})
    }
     
})

module.exports = router;