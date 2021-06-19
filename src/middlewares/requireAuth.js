const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.model('User');

module.exports = (req,res,next)=> {
    const {authorization} = req.headers;
    // authorization === 'Bearer asgasdasfasf'
    if(!authorization) {
        return res.status(401).send({error: 'You must be logged in.'})
    }

    const token = authorization.replace('Bearer ','');
    jwt.verify(token,'MY_SECRET_KEY',async (err,payload)=> {
        if (err) {
            return res.status(401).send({error:"You must be logged in."})
        }
        const {userID} = payload;
        const user = await User.findById(userID);
        req.user = user;

        next();


    });

}