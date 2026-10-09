const express = require('express')
const Admin = require('../models/Admin')
const router = express.Router();
const jwt = require('jsonwebtoken')


router.post('/register', async(req,res)=>{
//logic for checking admin alredy register
const c = await Admin.countDocuments()
if(c>0){
    res.json("Admin alredy registered Before ");
}
const user = await new Admin(req.body)
user.save()
res.json("Admin Register successfully")
})

//admin auth routes

router.post('/login', async(req,res)=>{
    const {email, password} = req.body;
    const a = await Admin.findOne({email}).select('password')
    if(!a){
        return res.json({msg:"Invalid Credentials"});
    }
    if(a.password == password){
        const secret = process.env.JWT_SECRET || process.env.jWT_SECRET || 'secret';
        const token = jwt.sign({id:a._id, role: 'Admin'}, secret, {expiresIn:"30d"})
        return res.json({
            msg:"Login Successfully",
            id:a._id,
            token:token,
            role: "Admin"
        })
    }
    return res.json({msg:"Invalid Credentials"});
})
module.exports= router;